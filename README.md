# SmartEntryTracker - Sistema IoT de Controle de Entrada

## Descrição do Projeto

Sistema IoT para monitoramento e contagem de pessoas utilizando ESP32 com sensores infravermelhos MH, comunicação MQTT e dashboard em tempo real.

## Disciplina
- **Curso:** Sistemas Embarcados
- **Professores:** Bella Nunes | Jymmy Barreto
- **Data de Entrega:** 04/12

## Objetivo

Desenvolver um sistema IoT completo que integra:
- ESP32 como dispositivo sensor/atuador
- Sensores infravermelhos para detecção de passagem
- Comunicação Wi-Fi e protocolo MQTT
- Dashboard para visualização em tempo real
- Implementação com FreeRTOS

## Características Principais

### Hardware
- **Placa:** ESP32 (NodeMCU)
- **Sensores:** 2x Sensores MH Infravermelho (detecção digital)
- **Conexões:**
  - Sensor 1: GPIO 13
  - Sensor 2: GPIO 14

### Software
- **Framework:** Arduino + FreeRTOS
- **Protocolo:** MQTT para comunicação
- **Tasks:**
  - Task de Sensores (Core 0)
  - Task MQTT (Core 1)
- **Comunicação:** Wi-Fi

## Estrutura do Projeto

```
SmartEntryTracker/
├── README.md                 # Este arquivo
├── esp32-esp8266/           # Firmware ESP32 com FreeRTOS
│   ├── platformio.ini       # Configuração PlatformIO
│   ├── src/                 # Código fonte
│   │   └── main.cpp
│   ├── include/             # Headers
│   └── lib/                 # Bibliotecas
├── raspberry-pi/            # Broker MQTT + Dashboard
├── schematics/              # Diagramas eletrônicos
└── docs/                    # Documentação (ABNT)
```

## Funcionamento

### Detecção de Entrada/Saída
O sistema utiliza dois sensores infravermelhos posicionados em sequência:

1. **ENTRADA:** Sensor 1 → Sensor 2 (pessoa entrando)
2. **SAÍDA:** Sensor 2 → Sensor 1 (pessoa saindo)

### Lógica dos Sensores
- **Detecção:** Sinal LOW indica objeto detectado
- **Timeout:** 2 segundos para completar sequência
- **Estados:** WAITING, SENSOR1_ACTIVE, SENSOR2_ACTIVE

### Comunicação MQTT
Tópicos publicados:
- `entry/event` - Tipo de evento (ENTRY/EXIT)
- `entry/count` - Número de pessoas dentro
- `entry/occupied` - Status de ocupação (true/false)
- `entry/data` - Dados completos em JSON
- `entry/status` - Status da conexão

## Como Compilar e Fazer Upload

### Requisitos
- PlatformIO instalado
- ESP32 conectado via USB

### Passos
```bash
cd esp32-esp8266
pio run --target upload
pio device monitor
```

## Configuração

### Wi-Fi
Edite as credenciais no arquivo `esp32-esp8266/src/main.cpp`:
```cpp
const char *ssid = "SEU_SSID";
const char *password = "SUA_SENHA";
```

### Broker MQTT
Configure o endereço IP do broker:
```cpp
const char *mqtt_server = "IP_DO_BROKER";
const uint16_t MQTT_PORT = 1883;
```

## Tecnologias Utilizadas

- **ESP32:** Microcontrolador principal
- **FreeRTOS:** Sistema operacional em tempo real
- **MQTT:** Protocolo de mensagens
- **PubSubClient:** Biblioteca MQTT para Arduino
- **Wi-Fi:** Comunicação sem fio

## Tópicos MQTT

### Publicados pelo ESP32
| Tópico | Tipo | Descrição |
|--------|------|-----------|
| `entry/event` | String | ENTRY ou EXIT |
| `entry/count` | Integer | Número de pessoas |
| `entry/occupied` | Boolean | true/false |
| `entry/data` | JSON | Dados completos |
| `entry/status` | String | Status do sistema |

### Formato JSON (`entry/data`)
```json
{
  "type": "entry",
  "people": 5,
  "timestamp": 123456,
  "occupied": true
}
```

## Funcionalidades FreeRTOS

### Tasks Implementadas
1. **taskSensors** (Core 0, Prioridade 2)
   - Leitura dos sensores IR
   - Detecção de sequência de passagem
   - Envio de eventos via Queue

2. **taskMQTT** (Core 1, Prioridade 2)
   - Gerenciamento da conexão MQTT
   - Publicação de dados
   - Recebimento de eventos da Queue

### Sincronização
- **Queue:** Comunicação entre tasks (10 elementos)
- **Mutex:** Não necessário (dados compartilhados protegidos por design)

## Status do Projeto

- [x] Implementação do firmware ESP32
- [x] Integração com FreeRTOS
- [x] Comunicação MQTT
- [x] Detecção de entrada/saída
- [ ] Dashboard web (em desenvolvimento)
- [ ] Broker MQTT no Raspberry Pi
- [ ] Documentação completa (ABNT)

## Equipe

_[Adicionar nomes dos membros da equipe]_

## Licença

Projeto acadêmico - Sistemas Embarcados

