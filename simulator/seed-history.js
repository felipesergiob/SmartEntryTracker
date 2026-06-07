/**
 * Popula o banco de histórico (app/server/events.db) com eventos passados,
 * para que a aba "Histórico" e os gráficos de horários de pico já apareçam
 * cheios na demo (sem precisar esperar o simulador rodar por horas).
 *
 * Grava direto no mesmo SQLite que o server usa, com o MESMO schema e as
 * mesmas colunas que o server.js gravaria a partir do tópico entry/data.
 * Usa o módulo nativo `node:sqlite` (Node >= 22.5) — nenhuma dependência extra.
 *
 * Uso:
 *   node seed-history.js                 # gera os últimos 5 dias
 *   SEED_DAYS=10 node seed-history.js    # gera os últimos 10 dias
 *   SEED_CLEAR=1 node seed-history.js    # apaga o histórico antes de gerar
 */
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DAYS = Number(process.env.SEED_DAYS || 5);
const CLEAR = process.env.SEED_CLEAR === '1';
const DB_PATH =
  process.env.SEED_DB || path.join(__dirname, '..', 'app', 'server', 'events.db');

// Peso de movimento por hora (0..1). Picos no almoço e no fim da tarde.
const HOUR_WEIGHTS = {
  8: 0.25, 9: 0.45, 10: 0.65, 11: 0.85, 12: 1.0, 13: 0.95,
  14: 0.65, 15: 0.6, 16: 0.7, 17: 0.85, 18: 1.0, 19: 0.9,
  20: 0.55, 21: 0.3,
};
const OPEN_HOUR = 8;
const CLOSE_HOUR = 21;
const PEAK_PASSERS_PER_HOUR = 35; // passagens/hora no horário de pico
const CONVERSION = 0.32; // fração de quem passa e entra

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    people INTEGER,
    total INTEGER,
    occupied BOOLEAN,
    raw_data TEXT,
    received_at INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_type ON events(type);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_received_at ON events(received_at);
`);

if (CLEAR) {
  db.exec('DELETE FROM events;');
  console.log('[seed] histórico anterior apagado.');
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const now = Date.now();

// Gera os eventos brutos (com horário) para um dia específico.
function buildDayEvents(dayDate) {
  const events = []; // { t, kind: 'passed_by' | 'entry' | 'exit' }
  const closeTime = new Date(dayDate);
  closeTime.setHours(CLOSE_HOUR, 30, 0, 0);

  for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h++) {
    const weight = HOUR_WEIGHTS[h] ?? 0.3;
    const passers = Math.round(PEAK_PASSERS_PER_HOUR * weight * (0.7 + Math.random() * 0.6));

    for (let i = 0; i < passers; i++) {
      const t = new Date(dayDate);
      t.setHours(h, randInt(0, 59), randInt(0, 59), 0);
      events.push({ t: t.getTime(), kind: 'passed_by' });

      // Parte de quem passa, entra — e depois sai após uma permanência.
      if (Math.random() < CONVERSION) {
        const entryT = t.getTime() + randInt(2000, 20000);
        events.push({ t: entryT, kind: 'entry' });

        const dwellMs = randInt(5, 40) * 60 * 1000;
        const exitT = Math.min(entryT + dwellMs, closeTime.getTime());
        events.push({ t: exitT, kind: 'exit' });
      }
    }
  }

  // Só eventos no passado (não cria nada no futuro para o dia de hoje).
  return events.filter((e) => e.t <= now).sort((a, b) => a.t - b.t);
}

const insert = db.prepare(`
  INSERT INTO events (type, timestamp, people, total, occupied, raw_data, received_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let peopleInside = 0;
let peoplePassedBy = 0;
let inserted = 0;

// Do dia mais antigo até hoje, em ordem cronológica.
for (let d = DAYS - 1; d >= 0; d--) {
  const day = new Date(now - d * 24 * 60 * 60 * 1000);
  day.setHours(0, 0, 0, 0);

  const dayEvents = buildDayEvents(day);

  for (const ev of dayEvents) {
    if (ev.kind === 'passed_by') {
      peoplePassedBy++;
      const raw = JSON.stringify({ type: 'passed_by', total: peoplePassedBy, timestamp: ev.t });
      insert.run('passed_by', ev.t, null, peoplePassedBy, 0, raw, ev.t);
    } else if (ev.kind === 'entry') {
      peopleInside++;
      const occupied = peopleInside > 0;
      const raw = JSON.stringify({ type: 'entry', people: peopleInside, timestamp: ev.t, occupied });
      insert.run('entry', ev.t, peopleInside, null, occupied ? 1 : 0, raw, ev.t);
    } else {
      peopleInside = Math.max(0, peopleInside - 1);
      const occupied = peopleInside > 0;
      const raw = JSON.stringify({ type: 'exit', people: peopleInside, timestamp: ev.t, occupied });
      insert.run('exit', ev.t, peopleInside, null, occupied ? 1 : 0, raw, ev.t);
    }
    inserted++;
  }

  // No fim do expediente, garante que a loja "esvaziou".
  peopleInside = 0;
}

const total = db.prepare('SELECT COUNT(*) AS n FROM events').get();
console.log(`[seed] ${inserted} eventos gerados em ${DAYS} dia(s).`);
console.log(`[seed] total de eventos no banco agora: ${total.n}`);
console.log(`[seed] banco: ${DB_PATH}`);
db.close();
