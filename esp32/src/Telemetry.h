#pragma once
#include <Arduino.h>
#include <PubSubClient.h>
#include "RingBuffer.h"
#include "ShiftBuffer.h"

/**
 * Camada de telemetria com buffer — Projeto "Otimização de Telemetria com
 * Buffer Circular".
 *
 * Junta as duas vertentes (anti-padrão x ring buffer) em cima do mesmo
 * pipeline MQTT do SmartEntryTracker. Publica:
 *
 *   telemetry/sample  : cada amostra capturada (stream contínuo)
 *   telemetry/batch   : lote de amostras drenado do ring buffer (produtor-consumidor)
 *   telemetry/perf    : resultado do benchmark de escala (latência us x N)
 *   telemetry/status  : mensagens de estado/instrumentação
 *
 * Instrumentação exigida pelo enunciado (micros + getFreeHeap) está em
 * benchmarkScale().
 */

struct Sample {
  uint32_t ts;     // micros() da captura
  uint8_t sensor;  // id do sensor (1..3)
  uint16_t value;  // valor lido
};

// Janela de telemetria (produtor-consumidor) — Vertente 2, O(1).
static RingBuffer<Sample, 256> g_window;

// ---------------------------------------------------------------------------
// Benchmark de escalabilidade: compara as duas vertentes inserindo N amostras.
// Mede a latência total em microssegundos (micros) e a saúde do heap
// (getFreeHeap) antes/depois, exatamente como pede a seção de instrumentação.
// ---------------------------------------------------------------------------
inline void benchmarkScale(PubSubClient &client) {
  const size_t escalas[] = {100, 1000, 5000, 20000};
  const size_t numEscalas = sizeof(escalas) / sizeof(escalas[0]);

  client.publish("telemetry/status", "Iniciando benchmark de escala...");

  // Monta um array JSON com um objeto por escala.
  String json = "{\"results\":[";

  for (size_t e = 0; e < numEscalas; e++) {
    const size_t N = escalas[e];
    Sample s = {0, 1, 0};

    // ---- Vertente 1: histórico crescente via realloc (O(n) por insercao) ----
    uint32_t heapAntesV1 = ESP.getFreeHeap();
    GrowingBuffer<Sample> grow;
    unsigned long start = micros();
    for (size_t i = 0; i < N; i++) {
      s.ts = i;
      s.value = (uint16_t)(i & 0xFFFF);
      grow.push(s); // realloc + copia -> O(n)
    }
    unsigned long durV1 = micros() - start;
    uint32_t heapDepoisV1 = ESP.getFreeHeap();

    // ---- Vertente 2: Ring Buffer fixo (O(1) por insercao) ----
    uint32_t heapAntesV2 = ESP.getFreeHeap();
    RingBuffer<Sample, 256> ring;
    start = micros();
    for (size_t i = 0; i < N; i++) {
      s.ts = i;
      s.value = (uint16_t)(i & 0xFFFF);
      ring.push(s); // apenas avanca indices -> O(1)
    }
    unsigned long durV2 = micros() - start;
    uint32_t heapDepoisV2 = ESP.getFreeHeap();

    Serial.printf(
        "N=%u | V1(shift/realloc): Latencia: %lu us | Heap Livre: %u bytes\n",
        (unsigned)N, durV1, heapDepoisV1);
    Serial.printf(
        "N=%u | V2(ring buffer)  : Latencia: %lu us | Heap Livre: %u bytes\n",
        (unsigned)N, durV2, heapDepoisV2);

    if (e > 0) json += ",";
    json += "{\"n\":" + String((unsigned)N) +
            ",\"shift_us\":" + String(durV1) +
            ",\"ring_us\":" + String(durV2) +
            ",\"shift_heap_used\":" + String((long)heapAntesV1 - (long)heapDepoisV1) +
            ",\"ring_heap_used\":" + String((long)heapAntesV2 - (long)heapDepoisV2) + "}";
  }

  json += "]}";
  // retained=true: o broker guarda o último resultado e o entrega a quem
  // assinar depois (dashboard aberto/recarregado após o benchmark rodar).
  client.publish("telemetry/perf", json.c_str(), true);
  client.publish("telemetry/status", "Benchmark concluido.", true);
}

// ---------------------------------------------------------------------------
// Task de telemetria (modelo Produtor-Consumidor).
// Produtor: amostra os sensores em alta frequência e enfileira no ring buffer
//           em O(1), sem nunca bloquear na rede.
// Consumidor: drena lotes do buffer e publica via MQTT. Enquanto a rede está
//           lenta (ms), o buffer absorve a latência sem perder amostras nem
//           travar a amostragem (us).
// ---------------------------------------------------------------------------
inline void taskTelemetry(void *pvParameters) {
  PubSubClient *client = (PubSubClient *)pvParameters;
  const int sensorPins[3] = {13, 14, 27};

  unsigned long lastFlush = millis();
  const unsigned long FLUSH_INTERVAL = 1000; // drena o buffer a cada 1s

  while (1) {
    // ---- Produtor: captura uma amostra de cada sensor (O(1) por push) ----
    for (int i = 0; i < 3; i++) {
      Sample s;
      s.ts = micros();
      s.sensor = i + 1;
      s.value = (uint16_t)digitalRead(sensorPins[i]);
      g_window.push(s);
      client->publish("telemetry/sample",
                      (String("{\"sensor\":") + s.sensor +
                       ",\"value\":" + s.value +
                       ",\"ts\":" + s.ts + "}")
                          .c_str());
    }

    // ---- Consumidor: a cada intervalo, drena o buffer em lote (batch) ----
    if (millis() - lastFlush >= FLUSH_INTERVAL && !g_window.isEmpty()) {
      String batch = "{\"count\":" + String((unsigned)g_window.size()) +
                     ",\"samples\":[";
      Sample s;
      bool first = true;
      while (g_window.pop(s)) { // O(1) por remocao
        if (!first) batch += ",";
        batch += "{\"s\":" + String(s.sensor) + ",\"v\":" + String(s.value) + "}";
        first = false;
      }
      batch += "]}";
      client->publish("telemetry/batch", batch.c_str());
      lastFlush = millis();
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

// Conveniência: roda o benchmark uma vez e sobe a task de telemetria.
inline void startTelemetry(PubSubClient &client) {
  benchmarkScale(client);
  xTaskCreatePinnedToCore(taskTelemetry, "Telemetry", 8192, &client, 1, NULL, 1);
}
