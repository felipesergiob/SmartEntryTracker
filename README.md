# SmartEntryTracker - Sistema de Contagem de Pessoas com ESP32

Sistema inteligente para contagem de entrada e saída de pessoas usando ESP32 e sensores ultrassônicos HC-SR04.

## 📋 Materiais Necessários

- **1x ESP32 DevKit** (Espressif)
- **2x Sensores HC-SR04** (ultrassom)
- **Protoboard**
- **Jumpers macho-macho**
- **Cabo USB** (para programação)

## 🔌 Montagem do Hardware

### Diagrama de Conexões:

```
┌─────────────────────────────────────────────────────────────┐
│                         ESP32 DevKit                         │
│                                                              │
│  VIN ──┐                                                    │
│        │                                                    │
│  GND ──┤                                                    │
│        │                                                    │
│  GPIO 13 ── TRIG (Sensor 1)     GPIO 14 ── TRIG (Sensor 2) │
│  GPIO 12 ── ECHO (Sensor 1)     GPIO 27 ── ECHO (Sensor 2) │
│                                                              │
└─────────────────────────────────────────────────────────────┘

SENSOR 1 (HC-SR04)          SENSOR 2 (HC-SR04)
┌──────────────┐            ┌──────────────┐
│ VCC  ← VIN   │            │ VCC  ← VIN   │
│ TRIG ← GPIO13│            │ TRIG ← GPIO14│
│ ECHO → GPIO12│            │ ECHO → GPIO27│
│ GND  ← GND   │            │ GND  ← GND   │
└──────────────┘            └──────────────┘
```

### Tabela de Conexões:

| Componente | Pino Componente | Pino ESP32 |
|------------|----------------|------------|
| **HC-SR04 #1** | VCC | VIN (5V) |
| | TRIG | GPIO 13 |
| | ECHO | GPIO 12 |
| | GND | GND |
| **HC-SR04 #2** | VCC | VIN (5V) |
| | TRIG | GPIO 14 |
| | ECHO | GPIO 27 |
| | GND | GND |

### Posicionamento dos Sensores:

```
        PORTA / PASSAGEM (30-50cm de largura)
    
    🔊 SENSOR 1          SENSOR 2 🔊
       (Entrada)          (Saída)
    
    ════════════════════════════════
         ENTRADA →  →  → SAÍDA
    ════════════════════════════════
```

**⚠️ IMPORTANTE:**
- Sensores separados por **30-50cm**
- Sensores na **mesma altura** (aprox. 1m do chão)
- Apontar **para o centro da passagem**
- Sensor 1 sempre no lado da **ENTRADA**

## ⚙️ Configuração do Software

### 1. Instalar Dependências

**PlatformIO já instalado no VSCode** ✅

O projeto já está configurado. As bibliotecas serão baixadas automaticamente.

### 2. Configurar WiFi e MQTT

Abra o arquivo `src/main.cpp` e edite as linhas 6-11:

```cpp
// Network settings
const char *ssid = "SUA_REDE_WIFI";        // ← Nome da sua rede WiFi
const char *password = "SUA_SENHA_WIFI";    // ← Senha do WiFi

// MQTT settings
const char *mqtt_server = "192.168.1.100";  // ← IP do broker MQTT
```

### 3. Configurar Broker MQTT

Você precisa de um broker MQTT rodando na sua rede.

**Opção A - Mosquitto no Mac:**

```bash
# Instalar
brew install mosquitto

# Iniciar
mosquitto -v
```

**Opção B - Mosquitto no Docker:**

```bash
docker run -it -p 1883:1883 eclipse-mosquitto
```

**Opção C - Broker Online (para testes):**

Use um dos brokers públicos:
- `test.mosquitto.org`
- `broker.hivemq.com`

Altere no código:
```cpp
const char *mqtt_server = "test.mosquitto.org";
```

### 4. Ajustar Parâmetros (Opcional)

No arquivo `src/main.cpp`, você pode ajustar:

```cpp
#define DISTANCE_THRESHOLD 100  // Distância máxima para detecção (cm)
#define MIN_DISTANCE 5          // Distância mínima válida (cm)
const unsigned long SEQUENCE_TIMEOUT = 2000;  // Timeout entre sensores (ms)
```

## 🚀 Upload e Execução

### Passo 1: Conectar ESP32

Conecte o ESP32 no computador via cabo USB.

### Passo 2: Fazer Upload

**Opção A - Pelo VSCode:**

1. Abra o projeto no VSCode
2. Na barra inferior, clique em **"→"** (PlatformIO: Upload)
3. Aguarde compilação e upload

**Opção B - Pela Linha de Comando:**

```bash
# Navegar até o diretório do projeto
cd /Users/felipesergio/Documents/PlatformIO/Projects/SmartEntryTracker

# Fazer upload
pio run --target upload
```

### Passo 3: Monitorar Serial

**Pelo VSCode:**
- Clique no ícone **"🔌"** (PlatformIO: Monitor) na barra inferior

**Pela linha de comando:**
```bash
pio device monitor
```

**Para sair do monitor:** `Ctrl + C`

## 📊 Testando o Sistema

### 1. Verificar Conexão WiFi

No monitor serial, você deve ver:

```
SmartEntryTracker - Starting...
Connecting to WiFi...
...
WiFi connected!
IP: 192.168.1.XXX
```

### 2. Verificar Conexão MQTT

```
Connecting to MQTT...
Connected!
```

### 3. Testar Sensores

Passe algo (mão, objeto) na frente dos sensores:

**ENTRADA:** Bloquear Sensor 1 → depois Sensor 2
```
Sensor 1 activated (dist: 15.3 cm)
Sensor 2 activated (dist: 18.7 cm)
ENTRY detected
ENTRY - People: 1
```

**SAÍDA:** Bloquear Sensor 2 → depois Sensor 1
```
Sensor 2 activated (dist: 12.5 cm)
Sensor 1 activated (dist: 14.2 cm)
EXIT detected
EXIT - People: 0
```

## 📡 Monitorar Dados MQTT

### Tópicos Publicados:

| Tópico | Descrição | Exemplo |
|--------|-----------|---------|
| `entry/status` | Status de conexão | `ESP32 Online` |
| `entry/event` | Tipo de evento | `ENTRY` ou `EXIT` |
| `entry/count` | Número de pessoas | `5` |
| `entry/occupied` | Local ocupado? | `true` ou `false` |
| `entry/data` | Dados completos JSON | `{"type":"entry","people":5,...}` |

### Escutar Mensagens MQTT:

**Instalar mosquitto_sub:**
```bash
brew install mosquitto
```

**Escutar todos os tópicos:**
```bash
mosquitto_sub -h 192.168.1.100 -t "entry/#" -v
```

**Escutar tópico específico:**
```bash
mosquitto_sub -h 192.168.1.100 -t "entry/count"
```

### Exemplo de Dados JSON:

```json
{
  "type": "entry",
  "people": 3,
  "timestamp": 45231,
  "occupied": true
}
```

## 🔧 Solução de Problemas

### ❌ Erro: WiFi não conecta

**Sintomas:** Muitos pontos "..." sem conectar

**Soluções:**
- Verificar nome da rede (SSID) e senha
- ESP32 só funciona em **WiFi 2.4GHz** (não 5GHz)
- Aproximar ESP32 do roteador
- Verificar se WiFi tem restrições de MAC address

### ❌ Erro: Porta USB não encontrada

**Sintomas:** `Error: Could not open port`

**Soluções:**

1. Listar portas disponíveis:
```bash
pio device list
```

2. Instalar driver USB (se necessário):
- Drivers CH340/CP2102: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers

3. Especificar porta manualmente no `platformio.ini`:
```ini
upload_port = /dev/cu.usbserial-XXXXXXXX
monitor_port = /dev/cu.usbserial-XXXXXXXX
```

### ❌ Erro: MQTT não conecta

**Sintomas:** `Failed, rc=-2` ou similar

**Soluções:**
- Verificar se broker está rodando
- Testar conexão: `telnet 192.168.1.100 1883`
- Verificar IP correto do broker
- Desativar firewall temporariamente
- Verificar se porta 1883 está aberta

### ❌ Sensores não detectam ou detectam errado

**Sintomas:** Nenhuma detecção ou detecções aleatórias

**Soluções:**

1. **Testar leitura de distância:**
   
   Adicione no `setup()` antes do `xTaskCreatePinnedToCore`:
   ```cpp
   // Teste de sensores
   for(int i=0; i<10; i++) {
     float d1 = getDistance(SENSOR1_TRIG, SENSOR1_ECHO);
     float d2 = getDistance(SENSOR2_TRIG, SENSOR2_ECHO);
     Serial.printf("Sensor1: %.1fcm  Sensor2: %.1fcm\n", d1, d2);
     delay(500);
   }
   ```

2. **Ajustar threshold:**
   - Se não detecta: aumentar `DISTANCE_THRESHOLD` (ex: 150)
   - Se detecta demais: diminuir `DISTANCE_THRESHOLD` (ex: 50)

3. **Verificar conexões:**
   - VCC deve estar em VIN (5V) do ESP32
   - Não inverter TRIG e ECHO

4. **Posicionamento:**
   - Sensores devem estar paralelos
   - Evitar superfícies que absorvem som (tecidos, espuma)
   - Melhor em superfícies rígidas (parede, madeira)

### ❌ Detecções invertidas (entrada vira saída)

**Solução:** Trocar fisicamente os sensores de posição ou trocar os pinos no código.

## 🎯 Calibração Final

1. **Ajustar distância de detecção:**
   - Meça a largura da passagem
   - Configure `DISTANCE_THRESHOLD` para metade da largura
   - Exemplo: passagem de 80cm → `DISTANCE_THRESHOLD 40`

2. **Ajustar timeout:**
   - Tempo que uma pessoa leva para passar pelos 2 sensores
   - Padrão: 2000ms (2 segundos)
   - Se pessoas lentas: aumentar para 3000ms
   - Se detecções erradas: diminuir para 1500ms

3. **Testar em condições reais:**
   - Pessoa andando normalmente
   - Pessoa andando devagar
   - Duas pessoas próximas (pode contar como 1)

## 📈 Próximos Passos

Após o sistema funcionar:

1. **Dashboard de visualização:**
   - Node-RED
   - Grafana + InfluxDB
   - Home Assistant

2. **Persistência de dados:**
   - Salvar histórico em banco de dados
   - Gerar relatórios diários/semanais

3. **Notificações:**
   - Alertas quando atingir capacidade máxima
   - Notificação por Telegram/WhatsApp

4. **Melhorias:**
   - Adicionar Display OLED
   - Bateria para funcionar sem cabo
   - Caixa 3D para proteção

## 📝 Comandos Úteis

```bash
# Compilar sem fazer upload
pio run

# Upload
pio run --target upload

# Monitor serial
pio device monitor

# Upload + Monitor
pio run --target upload && pio device monitor

# Limpar build
pio run --target clean

# Listar portas USB
pio device list

# Atualizar bibliotecas
pio lib update
```

## 🆘 Suporte

Se ainda tiver problemas:

1. Verifique todas as conexões físicas
2. Teste cada componente separadamente
3. Verifique os logs do monitor serial
4. Confirme versões de bibliotecas compatíveis

---

**Desenvolvido com ESP32 + PlatformIO**

🔗 Projeto: SmartEntryTracker  
📅 Versão: 1.0  
👨‍💻 Hardware: ESP32 DevKit + HC-SR04

