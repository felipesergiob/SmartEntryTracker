// Mock do ESP32 para a camada de telemetria (esp32/src/Telemetry.h).
// Roda o benchmark das duas vertentes e transmite as amostras em lote via MQTT.
// Variaveis de ambiente: MQTT_URL, TELE_SCALES, TELE_CSV.
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const SCALES = (process.env.TELE_SCALES || '100,1000,5000,20000')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter(Boolean);

// Vertente 1 (anti-padrao): historico crescente, copia tudo a cada push -> O(n).
class GrowingBuffer {
  constructor() {
    this.data = [];
  }
  push(item) {
    const grown = new Array(this.data.length + 1);
    for (let i = 0; i < this.data.length; i++) grown[i] = this.data[i];
    grown[this.data.length] = item;
    this.data = grown;
  }
  get size() {
    return this.data.length;
  }
}

// Vertente 2: ring buffer de tamanho fixo com head/tail -> O(1).
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
      this.tail = (this.tail + 1) % this.capacity;
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

function microsNow() {
  return Number(process.hrtime.bigint() / 1000n);
}

function runBenchmark() {
  const results = [];
  for (const N of SCALES) {
    const grow = new GrowingBuffer();
    let start = microsNow();
    for (let i = 0; i < N; i++) grow.push({ ts: i, sensor: 1, value: i & 0xffff });
    const shiftUs = microsNow() - start;

    const ring = new RingBuffer(256);
    start = microsNow();
    for (let i = 0; i < N; i++) ring.push({ ts: i, sensor: 1, value: i & 0xffff });
    const ringUs = microsNow() - start;

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
  // retained para o dashboard receber o resultado mesmo se conectar depois
  client.publish('telemetry/perf', perf, { retain: true });
  client.publish('telemetry/status', 'Benchmark concluido.', { retain: true });
  console.log('[telemetry] resultado publicado em telemetry/perf');

  setInterval(() => {
    client.publish('telemetry/perf', perf, { retain: true });
  }, 15000);

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

// Produtor-consumidor: o produtor enfileira amostras no ring buffer e o
// consumidor drena lotes para o MQTT.
const window = new RingBuffer(256);
let tick = 0;

const SAMPLE_MS = Number(process.env.TELE_SAMPLE_MS || 200);
const NOISE = Number(process.env.TELE_NOISE || 40);

function startStreaming() {
  console.log(
    `[telemetry] streaming iniciado (amostra a cada ${SAMPLE_MS}ms, ruido +/-${NOISE})`
  );

  // Produtor: uma tripla (sensores 1,2,3) por tick
  setInterval(() => {
    for (let sensor = 1; sensor <= 3; sensor++) {
      const base = 2048 + Math.round(900 * Math.sin((tick + sensor * 40) / 12));
      const value = Math.max(0, base + Math.round((Math.random() - 0.5) * NOISE));
      const sample = { sensor, value, ts: microsNow() };
      window.push(sample);
      client.publish('telemetry/sample', JSON.stringify(sample));
    }
    tick++;
  }, SAMPLE_MS);

  // Consumidor: drena o buffer em lote a cada 1s
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
