#pragma once
#include <Arduino.h>
#include <PubSubClient.h>
#include "RingBuffer.h"
#include "ShiftBuffer.h"

// Camada de telemetria: amostra os sensores, transmite em lote via MQTT e
// roda o benchmark que compara as duas vertentes.

struct Sample {
  uint32_t ts;
  uint8_t sensor;
  uint16_t value;
};

static RingBuffer<Sample, 256> g_window;

// Compara as duas vertentes inserindo N amostras, medindo latencia (micros)
// e heap livre (getFreeHeap) em cada escala.
inline void benchmarkScale(PubSubClient &client) {
  const size_t escalas[] = {100, 1000, 5000, 20000};
  const size_t numEscalas = sizeof(escalas) / sizeof(escalas[0]);

  client.publish("telemetry/status", "Iniciando benchmark de escala...");

  String json = "{\"results\":[";

  for (size_t e = 0; e < numEscalas; e++) {
    const size_t N = escalas[e];
    Sample s = {0, 1, 0};

    // Vertente 1: realloc a cada insercao
    uint32_t heapAntesV1 = ESP.getFreeHeap();
    GrowingBuffer<Sample> grow;
    unsigned long start = micros();
    for (size_t i = 0; i < N; i++) {
      s.ts = i;
      s.value = (uint16_t)(i & 0xFFFF);
      grow.push(s);
    }
    unsigned long durV1 = micros() - start;
    uint32_t heapDepoisV1 = ESP.getFreeHeap();

    // Vertente 2: ring buffer
    uint32_t heapAntesV2 = ESP.getFreeHeap();
    RingBuffer<Sample, 256> ring;
    start = micros();
    for (size_t i = 0; i < N; i++) {
      s.ts = i;
      s.value = (uint16_t)(i & 0xFFFF);
      ring.push(s);
    }
    unsigned long durV2 = micros() - start;
    uint32_t heapDepoisV2 = ESP.getFreeHeap();

    Serial.printf("N=%u | V1: %lu us | Heap Livre: %u bytes\n",
                  (unsigned)N, durV1, heapDepoisV1);
    Serial.printf("N=%u | V2: %lu us | Heap Livre: %u bytes\n",
                  (unsigned)N, durV2, heapDepoisV2);

    if (e > 0) json += ",";
    json += "{\"n\":" + String((unsigned)N) +
            ",\"shift_us\":" + String(durV1) +
            ",\"ring_us\":" + String(durV2) +
            ",\"shift_heap_used\":" + String((long)heapAntesV1 - (long)heapDepoisV1) +
            ",\"ring_heap_used\":" + String((long)heapAntesV2 - (long)heapDepoisV2) + "}";
  }

  json += "]}";
  client.publish("telemetry/perf", json.c_str(), true);
  client.publish("telemetry/status", "Benchmark concluido.", true);
}

// Modelo produtor-consumidor: o produtor amostra os sensores e enfileira no
// ring buffer; o consumidor drena lotes e publica via MQTT.
inline void taskTelemetry(void *pvParameters) {
  PubSubClient *client = (PubSubClient *)pvParameters;
  const int sensorPins[3] = {13, 14, 27};

  unsigned long lastFlush = millis();
  const unsigned long FLUSH_INTERVAL = 1000;

  while (1) {
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

    if (millis() - lastFlush >= FLUSH_INTERVAL && !g_window.isEmpty()) {
      String batch = "{\"count\":" + String((unsigned)g_window.size()) +
                     ",\"samples\":[";
      Sample s;
      bool first = true;
      while (g_window.pop(s)) {
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

inline void startTelemetry(PubSubClient &client) {
  benchmarkScale(client);
  xTaskCreatePinnedToCore(taskTelemetry, "Telemetry", 8192, &client, 1, NULL, 1);
}
