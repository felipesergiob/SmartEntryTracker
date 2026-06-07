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

// Curva de movimento: em vez de um fluxo constante, o público vem em ONDAS
// (períodos de "rush" e períodos calmos). Isso deixa o gráfico de Atividade
// por minuto bem mais vivo, com picos e vales nítidos.
const CYCLE_MS = Number(process.env.SIM_CYCLE_MS || 90000); // duração de um ciclo
const simStart = Date.now();

// --- Modo "dia acelerado" -------------------------------------------------
// Se SIM_DAY_MIN > 0, o simulador roda um dia inteiro (OPEN..CLOSE) comprimido
// nesse número de minutos reais, carimbando cada evento com a HORA SIMULADA.
// Assim o gráfico de "Horários de Pico" mostra várias horas distintas durante
// a demo, com mais movimento no almoço e no fim de tarde.
const DAY_MIN = Number(process.env.SIM_DAY_MIN || 0);
const DAY_MS = DAY_MIN * 60000;
const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const HOUR_WEIGHTS = {
  8: 0.25, 9: 0.45, 10: 0.65, 11: 0.85, 12: 1.0, 13: 0.95,
  14: 0.65, 15: 0.6, 16: 0.7, 17: 0.85, 18: 1.0, 19: 0.9,
  20: 0.55, 21: 0.35,
};

// Retorna o horário simulado atual (epoch ms) e o peso de movimento da hora,
// ou null quando o modo dia acelerado está desligado (tempo real normal).
function simDay() {
  if (!DAY_MS) return null;
  const phase = ((Date.now() - simStart) % DAY_MS) / DAY_MS; // 0..1 ao longo do dia
  const hourFloat = OPEN_HOUR + phase * (CLOSE_HOUR - OPEN_HOUR);
  const hour = Math.floor(hourFloat);
  const minute = Math.floor((hourFloat - hour) * 60);
  const d = new Date();
  d.setHours(hour, minute, Math.floor(Math.random() * 60), 0);
  return { epochMs: d.getTime(), weight: HOUR_WEIGHTS[hour] ?? 0.3, hour };
}

// Timestamp do evento: hora simulada no modo dia, senão o relógio real.
function eventTimestamp() {
  const day = simDay();
  return day ? day.epochMs : Date.now();
}

function movimento() {
  const day = simDay();
  if (day) return Math.max(0.12, day.weight); // segue a curva de movimento do dia
  const phase = ((Date.now() - simStart) % CYCLE_MS) / CYCLE_MS; // 0..1
  // 1 pico por ciclo: vai de ~0.15 (calmo) a 1.0 (pico) suavemente.
  return 0.15 + 0.85 * Math.pow(Math.sin(Math.PI * phase), 2);
}

const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log(`[sim] conectado ao broker em ${MQTT_URL}`);
  client.publish('entry/status', 'ESP32 Online (simulado)');
  if (DAY_MS) {
    console.log(`[sim] MODO DIA ACELERADO: 1 dia (${OPEN_HOUR}h-${CLOSE_HOUR}h) a cada ${DAY_MIN} min reais`);
  } else {
    console.log('[sim] modo tempo real (eventos na hora atual, em ondas)');
  }
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
  const timestamp = eventTimestamp();

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
  const timestamp = eventTimestamp();

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
  const timestamp = eventTimestamp();

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
  const f = movimento();
  const exitBias = Math.min(0.45, peopleInside * 0.05);
  if (peopleInside > 0 && Math.random() < exitBias) {
    publishExit();
    return;
  }
  // A chance de entrar sobe nos picos de movimento e cai nos vales.
  const entryChance = 0.18 + 0.42 * f;
  if (Math.random() < entryChance) {
    publishEntry();
  } else {
    publishPassedBy();
  }
}

function scheduleNext() {
  // Nos picos os eventos chegam mais rápido; nos vales, mais espaçados.
  const delay = (randInt(MIN_MS, MAX_MS) * SPEED) / movimento();
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
