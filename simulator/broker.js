/**
 * Broker MQTT embutido (substitui o mosquitto na demo).
 *
 * Expõe os mesmos dois listeners que o mosquitto.conf do projeto:
 *   - MQTT puro (TCP)  na porta 1883  -> usado pelo server Node e pelo simulador
 *   - MQTT sobre WS    na porta 9001  -> usado pelo dashboard (browser)
 *
 * Vantagem: a demo roda apenas com Node, sem precisar instalar o mosquitto.
 * Se você já tem o mosquitto rodando (`mosquitto -c mosquitto.conf`), NÃO
 * precisa deste arquivo — pode pular direto para o simulator.js.
 */
const net = require('net');
const http = require('http');
const { WebSocketServer, createWebSocketStream } = require('ws');
const aedes = require('aedes')();

const MQTT_PORT = Number(process.env.MQTT_PORT || 1883);
const WS_PORT = Number(process.env.WS_PORT || 9001);

// Listener MQTT puro (TCP) — ESP32/simulador e o server Node
const tcpServer = net.createServer(aedes.handle);
tcpServer.listen(MQTT_PORT, () => {
  console.log(`[broker] MQTT (TCP) ouvindo em mqtt://localhost:${MQTT_PORT}`);
});

// Listener WebSocket — o dashboard no browser conecta aqui
const httpServer = http.createServer();
const wss = new WebSocketServer({ server: httpServer });
wss.on('connection', (socket) => {
  const stream = createWebSocketStream(socket);
  aedes.handle(stream);
});
httpServer.listen(WS_PORT, () => {
  console.log(`[broker] MQTT (WebSocket) ouvindo em ws://localhost:${WS_PORT}`);
});

aedes.on('client', (client) => {
  console.log(`[broker] cliente conectado: ${client && client.id}`);
});
aedes.on('clientDisconnect', (client) => {
  console.log(`[broker] cliente desconectado: ${client && client.id}`);
});

aedes.on('publish', (packet, client) => {
  // Ignora os tópicos internos do protocolo ($SYS/...)
  if (!client || !packet.topic || packet.topic.startsWith('$SYS')) return;
  console.log(`[broker] ${packet.topic}: ${packet.payload.toString()}`);
});

function shutdown() {
  console.log('\n[broker] encerrando...');
  tcpServer.close();
  httpServer.close();
  aedes.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('[broker] Broker MQTT embutido iniciado. Ctrl+C para parar.');
