/**
 * Simulador dos sensores (mock do ESP32) para a demo.
 *
 * Publica nos MESMOS tópicos e com os MESMOS formatos de mensagem que o
 * firmware (esp32/src/main.cpp) publicava, então nem o server nem o dashboard
 * precisam saber que o hardware não está presente.
 *
 * Eventos simulados (iguais aos do firmware):
 *   - passed_by : alguém passou na frente (sensor 3)        -> entry/passedby + entry/data
 *   - entry     : alguém entrou (sequência sensor 1 -> 2)    -> entry/count + entry/occupied + entry/data
 *   - exit      : alguém saiu  (sequência sensor 2 -> 1)     -> entry/count + entry/occupied + entry/data
 *
 * Uso:
 *   node simulator.js
 *
 * Variáveis de ambiente (opcionais):
 *   MQTT_URL   broker MQTT (padrão: mqtt://localhost:1883)
 *   SIM_SPEED  multiplicador de velocidade; <1 mais rápido, >1 mais lento (padrão: 1)
 *   SIM_MIN_MS / SIM_MAX_MS  intervalo entre eventos em ms (padrão: 700 a 2200)
 */
const mqtt = require('mqtt');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const SPEED = Number(process.env.SIM_SPEED || 1);
const MIN_MS = Number(process.env.SIM_MIN_MS || 700);
const MAX_MS = Number(process.env.SIM_MAX_MS || 2200);

// Estado equivalente ao do firmware
let peopleInside = 0; // ocupação atual (sobe e desce) = totalEntries - totalExits
let peoplePassedBy = 0; // acumulado, só aumenta
let totalEntries = 0; // acumulado, só aumenta
let totalExits = 0; // acumulado, só aumenta (nunca passa de totalEntries)

// Mensagens de estado são publicadas com retain para que um dashboard que
// conecta/recarrega depois receba os valores atuais imediatamente.
const RETAIN = { retain: true };

const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log(`[sim] conectado ao broker em ${MQTT_URL}`);
  client.publish('entry/status', 'ESP32 Online (simulado)');
  console.log('[sim] gerando eventos... (Ctrl+C para parar)');
  scheduleNext();
});

client.on('error', (err) => {
  console.error('[sim] erro MQTT:', err.message);
});

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function publishEntry() {
  peopleInside++;
  totalEntries++;
  const occupied = peopleInside > 0;
  const timestamp = Date.now();

  client.publish('entry/event', 'ENTRY');
  client.publish('entry/count', String(peopleInside), RETAIN);
  client.publish('entry/occupied', occupied ? 'true' : 'false', RETAIN);
  client.publish('entry/entries', String(totalEntries), RETAIN);
  client.publish(
    'entry/data',
    JSON.stringify({
      type: 'entry',
      people: peopleInside,
      entries: totalEntries,
      exits: totalExits,
      timestamp,
      occupied,
    })
  );
  console.log(`[sim] ENTRY  -> dentro: ${peopleInside} | total entradas: ${totalEntries}`);
}

function publishExit() {
  // Só é chamada quando peopleInside > 0, então totalExits nunca passa totalEntries.
  peopleInside = Math.max(0, peopleInside - 1);
  totalExits++;
  const occupied = peopleInside > 0;
  const timestamp = Date.now();

  client.publish('entry/event', 'EXIT');
  client.publish('entry/count', String(peopleInside), RETAIN);
  client.publish('entry/occupied', occupied ? 'true' : 'false', RETAIN);
  client.publish('entry/exits', String(totalExits), RETAIN);
  client.publish(
    'entry/data',
    JSON.stringify({
      type: 'exit',
      people: peopleInside,
      entries: totalEntries,
      exits: totalExits,
      timestamp,
      occupied,
    })
  );
  console.log(`[sim] EXIT   -> dentro: ${peopleInside} | total saidas: ${totalExits}`);
}

function publishPassedBy() {
  peoplePassedBy++;
  const timestamp = Date.now();

  client.publish('entry/event', 'PASSED_BY');
  client.publish('entry/passedby', String(peoplePassedBy), RETAIN);
  client.publish(
    'entry/data',
    JSON.stringify({ type: 'passed_by', total: peoplePassedBy, timestamp })
  );
  console.log(`[sim] PASSED_BY -> total: ${peoplePassedBy}`);
}

/**
 * Escolhe o próximo evento de forma "realista":
 *  - a maioria das pessoas só passa na frente (passed_by);
 *  - uma fração entra (taxa de conversão ~35%);
 *  - saídas ficam mais prováveis conforme a loja enche, para a ocupação
 *    oscilar de forma natural em vez de só crescer.
 */
function nextEvent() {
  const exitBias = Math.min(0.45, peopleInside * 0.05);
  if (peopleInside > 0 && Math.random() < exitBias) {
    publishExit();
    return;
  }
  if (Math.random() < 0.35) {
    publishEntry();
  } else {
    publishPassedBy();
  }
}

function scheduleNext() {
  const delay = randInt(MIN_MS, MAX_MS) * SPEED;
  setTimeout(() => {
    nextEvent();
    scheduleNext();
  }, delay);
}

process.on('SIGINT', () => {
  console.log('\n[sim] encerrando...');
  client.end(true, () => process.exit(0));
  setTimeout(() => process.exit(0), 300);
});
