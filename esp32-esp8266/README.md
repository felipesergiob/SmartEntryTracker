# ESP32 Firmware - SmartEntryTracker

## Descrição

Firmware para ESP32 utilizando FreeRTOS para detecção de entrada/saída de pessoas através de sensores infravermelhos.

## Características

### Tecnologias
- **Framework:** Arduino
- **RTOS:** FreeRTOS (nativo do ESP32)
- **Protocolo:** MQTT
- **Comunicação:** Wi-Fi

### Arquitetura FreeRTOS

#### Tasks Implementadas

**1. taskSensors (Core 0)**
- Prioridade: 2
- Stack: 4096 bytes
- Função: Leitura e detecção de sequência dos sensores
- Período: 50ms

**2. taskMQTT (Core 1)**
- Prioridade: 2
- Stack: 4096 bytes
- Função: Gerenciamento MQTT e publicação de dados
- Período: 100ms

#### Mecanismos de Sincronização
- **Queue:** 10 elementos para comunicação entre tasks
- **Tipo de dados:** int (1 = entrada, -1 = saída)

## Configuração

### Pinos Utilizados
```cpp
#define SENSOR1_PIN 13  // GPIO 13
#define SENSOR2_PIN 14  // GPIO 14
```

### Credenciais Wi-Fi
Edite no arquivo `src/main.cpp`:
```cpp
const char *ssid = "SEU_SSID";
const char *password = "SUA_SENHA";
```

### Broker MQTT
```cpp
const char *mqtt_server = "IP_DO_BROKER";
const uint16_t MQTT_PORT = 1883;
```

## Compilação e Upload

### Via PlatformIO CLI
```bash
pio run --target upload
pio device monitor
```

### Via PlatformIO IDE (VSCode)
1. Abrir pasta `esp32-esp8266`
2. Clicar em "Build" (✓)
3. Clicar em "Upload" (→)
4. Abrir Serial Monitor

## Dependências

Biblioteca incluída em `platformio.ini`:
```ini
lib_deps = 
    knolleary/PubSubClient@^2.8
```

## Lógica de Detecção

### Estados
- **WAITING:** Aguardando detecção
- **SENSOR1_ACTIVE:** Sensor 1 ativo, aguardando sensor 2
- **SENSOR2_ACTIVE:** Sensor 2 ativo, aguardando sensor 1

### Sequências
- **Entrada:** S1 → S2 (dentro de 2 segundos)
- **Saída:** S2 → S1 (dentro de 2 segundos)
- **Timeout:** Volta para WAITING se não completar sequência

### Diagrama de Estados

```
    WAITING
      │
      ├─ S1 detectado → SENSOR1_ACTIVE
      │                      │
      │                      └─ S2 detectado → ENTRADA (+1)
      │
      └─ S2 detectado → SENSOR2_ACTIVE
                             │
                             └─ S1 detectado → SAÍDA (-1)
```

## Tópicos MQTT

### Publicados
| Tópico | Formato | Descrição |
|--------|---------|-----------|
| `entry/status` | String | Status da conexão |
| `entry/event` | String | "ENTRY" ou "EXIT" |
| `entry/count` | Integer | Contador de pessoas |
| `entry/occupied` | Boolean | "true" ou "false" |
| `entry/data` | JSON | Dados completos |

### Exemplo JSON
```json
{
  "type": "entry",
  "people": 5,
  "timestamp": 123456,
  "occupied": true
}
```

## Monitoramento Serial

### Mensagens
```
SmartEntryTracker - Starting...
Connecting to WiFi...
WiFi connected!
IP: 192.168.1.100
Connecting to MQTT...Connected!
System started!

>>> SENSOR 1 DISPAROU
Sensor 1 ativado - aguardando sequencia
>>> SENSOR 2 DISPAROU
ENTRY detectada (S1 -> S2)
ENTRY - People: 1
```

## Estrutura de Arquivos

```
esp32-esp8266/
├── README.md           # Este arquivo
├── platformio.ini      # Configuração do projeto
├── src/
│   └── main.cpp       # Código principal
├── include/           # Headers (se necessário)
└── lib/               # Bibliotecas locais (se necessário)
```

## Sensores MH IR

### Características
- Saída digital: LOW = detectado, HIGH = livre
- Tensão: 3.3V
- Alcance: Ajustável via potenciômetro
- Recomendado: 10-20cm

### Calibração
1. Ajustar potenciômetro para detecção ideal
2. Testar com objeto em diferentes distâncias
3. Verificar LED indicador no sensor

## Otimizações FreeRTOS

### Uso de Cores
- Core 0: Tarefas de I/O (Sensores)
- Core 1: Tarefas de rede (MQTT/Wi-Fi)

### Delays
- Uso de `vTaskDelay()` ao invés de `delay()`
- Loop principal em delay infinito
- Tasks gerenciam seu próprio tempo

### Memória
- Stack de 4KB por task (ajustável se necessário)
- Queue com 10 elementos (suficiente para rajadas)

## Troubleshooting

### Problema: Wi-Fi não conecta
- Verificar SSID e senha
- Verificar sinal Wi-Fi
- Verificar monitor serial para erros

### Problema: MQTT não conecta
- Verificar IP do broker
- Verificar se broker está rodando
- Testar com `mosquitto_pub/sub`

### Problema: Sensores não detectam
- Verificar alimentação (3.3V)
- Verificar conexões dos pinos
- Ajustar sensibilidade (potenciômetro)
- Verificar LED indicador do sensor

### Problema: Detecções falsas
- Aumentar timeout (SEQUENCE_TIMEOUT)
- Ajustar sensibilidade dos sensores
- Verificar interferência de luz ambiente

## Próximas Melhorias

- [ ] Adicionar configuração via web (WiFiManager)
- [ ] Implementar OTA (Over-The-Air) updates
- [ ] Adicionar modo deep sleep para economia
- [ ] Implementar filtro de debounce mais robusto
- [ ] Adicionar suporte a múltiplos brokers (fallback)
- [ ] Implementar QoS no MQTT
- [ ] Adicionar timestamp real (NTP)

