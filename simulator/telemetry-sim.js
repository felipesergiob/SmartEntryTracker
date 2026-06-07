/**
 * Simulador da camada de Telemetria com Buffer Circular (mock do ESP32).
 *
 * Reproduz, sem hardware, exatamente o que o firmware (esp32/src/Telemetry.h)
 * faz: roda o benchmark de escala comparando as duas vertentes e transmite as
 * amostras em lote via MQTT. As classes abaixo são a tradução fiel, em JS, das
 * estruturas em C++ (RingBuffer.h / ShiftBuffer.h), preservando a complexidade:
 *
 *   - GrowingBuffer : copia todo o conteúdo a cada push  -> O(n)  (anti-padrão)
 *   - RingBuffer    : avança índices head/tail           -> O(1)
 *
 * Publica:
 *   telemetry/sample  : cada amostra capturada (stream)
 *   telemetry/batch   : lote drenado do ring buffer (produtor-consumidor)
 *   telemetry/perf    : resultado do benchmark (latência us x N)
 *   telemetry/status  : estado/instrumentação
 *
 * Uso:
 *   node telemetry-sim.js
 *
 * Variáveis de ambiente:
 *   MQTT_URL     broker (padrão mqtt://localhost:1883)
 *   TELE_SCALES  escalas N separadas por vírgula (padrão "100,1000,5000,20000")
 *   TELE_CSV     se "1", também grava perf-results.csv (para o relatório)
 */
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const SCALES = (process.env.TELE_SCALES || '100,1000,5000,20000')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter(Boolean);

// ---------------------------------------------------------------------------
// Vertente 1 — Anti-padrão: histórico crescente copiado a cada push -> O(n)
// (equivalente ao realloc()+cópia do GrowingBuffer em C++)
// ---------------------------------------------------------------------------
class GrowingBuffer {
  constructor() {
    this.data = [];
  }
  push(item) {
    // Simula realloc: aloca um novo bloco e COPIA todo o conteúdo anterior.
    const grown = new Array(this.data.length + 1);
    for (let i = 0; i < this.data.length; i++) grown[i] = this.data[i]; // O(n)
    grown[this.data.length] = item;
    this.data = grown;
  }
  get size() {
    return this.data.length;
  }
}

// ---------------------------------------------------------------------------
// Vertente 2 — Ring Buffer de tamanho fixo: head/tail/count -> O(1)
// ---------------------------------------------------------------------------
class RingBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
  push(item) {
    if (this.count === this.capacity) {
      this.tail = (this.tail + 1) % this.capacity; // descarta o mais antigo O(1)
      this.count--;
    }
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    this.count++;
  }
  pop() {
    if (this.count === 0) return undefined;
    const item = this.buffer[this.tail];
    this.tail = (this.tail + 1) % this.capacity;
    this.count--;
    return item;
  }
  get size() {
    return this.count;
  }
  isEmpty() {
    return this.count === 0;
  }
}

// micros() de alta resolução
function microsNow() {
  return Number(process.hrtime.bigint() / 1000n);
}

// ---------------------------------------------------------------------------
// Benchmark de escala — mesma lógica do benchmarkScale() do firmware.
// ---------------------------------------------------------------------------
function runBenchmark() {
  const results = [];
  for (const N of SCALES) {
    // Vertente 1: O(n) por push
    const grow = new GrowingBuffer();
    let start = microsNow();
    for (let i = 0; i < N; i++) grow.push({ ts: i, sensor: 1, value: i & 0xffff });
    const shiftUs = microsNow() - start;

    // Vertente 2: O(1) por push (janela fixa de 256)
    const ring = new RingBuffer(256);
    start = microsNow();
    for (let i = 0; i < N; i++) ring.push({ ts: i, sensor: 1, value: i & 0xffff });
    const ringUs = microsNow() - start;

    // Latência média por inserção (us) — evidencia o jitter da Vertente 1.
    const shiftPer = shiftUs / N;
    const ringPer = ringUs / N;

    results.push({
      n: N,
      shift_us: shiftUs,
      ring_us: ringUs,
      shift_per_insert_us: Number(shiftPer.toFixed(3)),
      ring_per_insert_us: Number(ringPer.toFixed(3)),
    });

    console.log(
      `[telemetry] N=${N} | V1(shift/realloc): ${shiftUs} us total ` +
        `(${shiftPer.toFixed(3)} us/insert) | V2(ring): ${ringUs} us total ` +
        `(${ringPer.toFixed(3)} us/insert)`
    );
  }
  return results;
}

const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log(`[telemetry] conectado ao broker em ${MQTT_URL}`);
  client.publish('telemetry/status', 'Iniciando benchmark de escala...');

  const results = runBenchmark();
  const perf = JSON.stringify({ results });
  client.publish('telemetry/perf', perf);
  client.publish('telemetry/status', 'Benchmark concluido.');
  console.log('[telemetry] resultado publicado em telemetry/perf');

  if (process.env.TELE_CSV === '1') {
    const csv =
      'n,shift_us,ring_us,shift_per_insert_us,ring_per_insert_us\n' +
      results
        .map((r) => `${r.n},${r.shift_us},${r.ring_us},${r.shift_per_insert_us},${r.ring_per_insert_us}`)
        .join('\n') +
      '\n';
    const out = path.join(__dirname, 'perf-results.csv');
    fs.writeFileSync(out, csv);
    console.log(`[telemetry] CSV salvo em ${out}`);
  }

  startStreaming();
});

client.on('error', (err) => console.error('[telemetry] erro MQTT:', err.message));

// ---------------------------------------------------------------------------
// Produtor-Consumidor contínuo: o produtor enfileira amostras (sinal senoidal
// + ruído, simulando 3 sensores) no ring buffer em O(1); o consumidor drena
// lotes a cada 1s e publica em telemetry/batch.
// ---------------------------------------------------------------------------
const window = new RingBuffer(256);
let tick = 0;

function startStreaming() {
  console.log('[telemetry] streaming de amostras iniciado (Ctrl+C para parar)');

  // Produtor: ~20 amostras/s por sensor
  setInterval(() => {
    for (let sensor = 1; sensor <= 3; sensor++) {
      const base = 2048 + Math.round(900 * Math.sin((tick + sensor * 40) / 12));
      const value = Math.max(0, base + Math.round((Math.random() - 0.5) * 120));
      const sample = { sensor, value, ts: microsNow() };
      window.push(sample);
      client.publish('telemetry/sample', JSON.stringify(sample));
    }
    tick++;
  }, 50);

  // Consumidor: drena o buffer em lote a cada 1s (absorve a latência da rede)
  setInterval(() => {
    if (window.isEmpty()) return;
    const samples = [];
    let s;
    while ((s = window.pop()) !== undefined) {
      samples.push({ s: s.sensor, v: s.value });
    }
    client.publish('telemetry/batch', JSON.stringify({ count: samples.length, samples }));
  }, 1000);
}

process.on('SIGINT', () => {
  console.log('\n[telemetry] encerrando...');
  client.end(true, () => process.exit(0));
  setTimeout(() => process.exit(0), 300);
});
