# 🎭 Simulador (modo demo sem hardware)

Este diretório permite rodar a demo **sem o ESP32 e sem os sensores**. Ele
substitui o microcontrolador por scripts Node que publicam exatamente os mesmos
tópicos e formatos MQTT que o firmware (`esp32/src/main.cpp`) publicava — então
o **server** e o **dashboard** funcionam sem alteração nenhuma.

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| `broker.js` | Broker MQTT embutido (TCP `1883` + WebSocket `9001`). **Substitui o mosquitto** — use só se você não tiver o mosquitto instalado. |
| `simulator.js` | Mock do ESP32: gera passagens, entradas e saídas em tempo real e publica via MQTT. Alimenta a aba **Tempo Real**. |
| `seed-history.js` | Popula o banco `app/server/events.db` com dias anteriores (curva realista com horários de pico). Deixa a aba **Histórico** já cheia. |
| `telemetry-sim.js` | Mock da camada de **Telemetria com Buffer Circular**: roda o benchmark de escala (Vertente 1 O(n) vs. Vertente 2 O(1)) e faz streaming de amostras em lote. Alimenta a aba **Telemetria**. |

Os eventos simulados são os mesmos do firmware:

- `passed_by` — alguém passou na frente → `entry/passedby` + `entry/data`
- `entry` — alguém entrou → `entry/count` + `entry/occupied` + `entry/data`
- `exit` — alguém saiu → `entry/count` + `entry/occupied` + `entry/data`

## Como rodar a demo

```bash
# 1) instale as dependências do simulador
cd simulator
npm install

# 2) (opcional) popule o histórico com dias anteriores
npm run seed                 # últimos 5 dias
# SEED_DAYS=10 npm run seed  # mais dias
# SEED_CLEAR=1 npm run seed  # apaga o histórico antes de gerar
```

Depois, abra **4 terminais** (na raiz do projeto):

```bash
# Terminal 1 — broker MQTT (use ESTE no lugar do mosquitto)
cd simulator && npm run broker
#   (se preferir o mosquitto de verdade: mosquitto -c mosquitto.conf)

# Terminal 2 — server de histórico (grava no SQLite)
cd app/server && npm install && npm run start:dev

# Terminal 3 — dashboard web
cd app/dashboard && npm install && npm start

# Terminal 4 — simulador dos sensores (mock do ESP32)
cd simulator && npm run sim
```

Abra o dashboard em http://localhost:3000 e os números começam a se mexer.

> O dashboard lê a configuração de `app/dashboard/config.js`. Já existe um
> `config.js` apontando para `ws://localhost:9001` (o broker local). Se ele não
> existir, copie de `config.example.js` e ajuste o `broker`.

## Ajustes do simulador (variáveis de ambiente)

| Variável | Padrão | Efeito |
|---|---|---|
| `MQTT_URL` | `mqtt://localhost:1883` | Broker onde o simulador publica |
| `SIM_SPEED` | `1` | Multiplicador de ritmo (`<1` mais rápido, `>1` mais lento) |
| `SIM_MIN_MS` / `SIM_MAX_MS` | `700` / `2200` | Intervalo entre eventos, em ms |

Exemplo (ritmo acelerado para a apresentação):

```bash
SIM_MIN_MS=300 SIM_MAX_MS=900 npm run sim
```

## Telemetria com Buffer Circular (projeto de Análise de Algoritmos)

O `telemetry-sim.js` é o mock da camada de telemetria que compara as duas
vertentes do projeto *Otimização de Telemetria com Buffer Circular*:

- **Vertente 1 (anti-padrão):** `GrowingBuffer` — copia todo o conteúdo a cada
  inserção (equivale a `realloc()`), custo `O(n)` por push, `O(n²)` total.
- **Vertente 2 (eficiente):** `RingBuffer` de tamanho fixo com índices
  head/tail, custo `O(1)` por push.

São a tradução fiel, em JS, das classes C++ do firmware (`esp32/src/RingBuffer.h`
e `esp32/src/ShiftBuffer.h`).

```bash
npm run telemetry                 # benchmark + streaming de amostras
TELE_CSV=1 npm run telemetry      # também grava perf-results.csv (p/ o relatório)
TELE_SCALES=100,5000,20000 npm run telemetry   # escolhe as escalas de N
```

Tópicos publicados: `telemetry/perf` (latência μs × N), `telemetry/batch`
(lote de amostras), `telemetry/sample` (stream), `telemetry/status`.
Veja o resultado na aba **Telemetria** do dashboard.

O relatório técnico (Entregável 3) está em
[`../docs/relatorio-buffer-circular.tex`](../docs/relatorio-buffer-circular.tex)
(compile no Overleaf).

## Requisitos

- Node.js **>= 22.5** (o seeder usa o módulo nativo `node:sqlite`). Testado no Node 24.
- Nenhuma dependência nativa — o broker e o simulador são Node puro.
