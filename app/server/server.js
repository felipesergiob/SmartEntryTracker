const mqtt = require('mqtt');
const Database = require('better-sqlite3');
const express = require('express');
const cors = require('cors');
const path = require('path');

const MQTT_BROKER = 'mqtt://localhost:1883';
const MQTT_TOPICS = [
  'entry/event',
  'entry/count',
  'entry/occupied',
  'entry/data',
  'entry/status',
  'entry/passedby'
];

const dbPath = path.join(__dirname, 'events.db');
const db = new Database(dbPath);

const app = express();
app.use(cors());
app.use(express.json());

console.log('📁 Database:', dbPath);

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

console.log('✅ Tabela de eventos criada/verificada');

const insertEvent = db.prepare(`
  INSERT INTO events (type, timestamp, people, total, occupied, raw_data, received_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

app.get('/api/events', (req, res) => {
  const { date, type, limit = 100 } = req.query;
  
  let query = 'SELECT * FROM events WHERE 1=1';
  const params = [];

  if (date) {
    query += ' AND date(datetime(received_at/1000, "unixepoch", "localtime")) = ?';
    params.push(date);
  }

  if (type && type !== 'all') {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY received_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const events = db.prepare(query).all(...params);
  res.json(events);
});

app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM events').get();
  
  const byType = db.prepare(`
    SELECT type, COUNT(*) as count 
    FROM events 
    GROUP BY type
  `).all();

  const byDate = db.prepare(`
    SELECT 
      date(datetime(received_at/1000, "unixepoch", "localtime")) as date,
      COUNT(*) as count
    FROM events
    GROUP BY date
    ORDER BY date DESC
    LIMIT 30
  `).all();

  res.json({ total: total.count, byType, byDate });
});

app.get('/api/events/hourly', (req, res) => {
  const { date } = req.query;
  
  let query = `
    SELECT 
      strftime('%H', datetime(received_at/1000, "unixepoch", "localtime")) as hour,
      type,
      COUNT(*) as count
    FROM events
  `;
  
  const params = [];
  if (date) {
    query += ' WHERE date(datetime(received_at/1000, "unixepoch", "localtime")) = ?';
    params.push(date);
  }
  
  query += ' GROUP BY hour, type ORDER BY hour';
  
  const hourly = db.prepare(query).all(...params);
  res.json(hourly);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🌐 API REST rodando em http://localhost:${PORT}`);
});

const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('🟢 Conectado ao MQTT broker:', MQTT_BROKER);
  
  MQTT_TOPICS.forEach(topic => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Erro ao inscrever no tópico ${topic}:`, err);
      } else {
        console.log(`📥 Inscrito no tópico: ${topic}`);
      }
    });
  });
});

client.on('message', (topic, message) => {
  const messageStr = message.toString();
  const receivedAt = Date.now();
  
  console.log(`\n📨 [${new Date().toLocaleTimeString()}] ${topic}: ${messageStr}`);

  if (topic === 'entry/data') {
    try {
      const eventData = JSON.parse(messageStr);
      
      insertEvent.run(
        eventData.type,
        eventData.timestamp || receivedAt,
        eventData.people || null,
        eventData.total || null,
        eventData.occupied ? 1 : 0,
        messageStr,
        receivedAt
      );
      
      console.log(`💾 Evento salvo: ${eventData.type}`);
      
      const stats = db.prepare('SELECT COUNT(*) as total FROM events').get();
      console.log(`📊 Total de eventos no banco: ${stats.total}`);
      
    } catch (err) {
      console.error('❌ Erro ao processar/salvar evento:', err);
    }
  }
});

client.on('error', (err) => {
  console.error('❌ Erro MQTT:', err);
});

client.on('disconnect', () => {
  console.log('🔴 Desconectado do MQTT');
});

process.on('SIGINT', () => {
  console.log('\n👋 Encerrando servidor...');
  client.end();
  db.close();
  process.exit(0);
});

console.log('\n🚀 Servidor MQTT Listener + SQLite iniciado!');
console.log('📊 Aguardando eventos...\n');

