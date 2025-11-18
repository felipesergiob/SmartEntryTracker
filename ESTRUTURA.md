# Estrutura do Projeto SmartEntryTracker

## Organização Completa

```
SmartEntryTracker/
│
├── README.md                      # Documentação principal do projeto
├── QUICKSTART.md                  # Guia rápido de início
├── ESTRUTURA.md                   # Este arquivo (visão da estrutura)
├── .gitignore                     # Arquivos ignorados pelo Git
│
├── esp32-esp8266/                 # 📟 FIRMWARE ESP32 (FreeRTOS)
│   ├── README.md                  # Documentação do firmware
│   ├── platformio.ini             # Configuração PlatformIO
│   ├── src/
│   │   └── main.cpp              # Código principal (FreeRTOS)
│   ├── include/                   # Headers customizados
│   │   └── README                
│   └── lib/                       # Bibliotecas locais
│       └── README                
│
├── raspberry-pi/                  # 🖥️  BROKER MQTT + DASHBOARD
│   ├── README.md                  # Documentação Raspberry Pi
│   ├── requirements.txt           # Dependências Python
│   └── mqtt_test.py              # Script de teste MQTT
│
└── schematics/                    # 📐 DIAGRAMAS ELETRÔNICOS
    ├── README.md                  # Documentação dos esquemas
    └── componentes.txt            # Lista de materiais (BOM)
```

## Detalhamento por Pasta

### 📁 Raiz do Projeto
- **README.md**: Documentação completa do projeto
- **QUICKSTART.md**: Tutorial rápido para começar
- **ESTRUTURA.md**: Este arquivo de organização
- **.gitignore**: Configuração do Git

### 📁 esp32-esp8266/
**Função**: Código do ESP32 com FreeRTOS

**Conteúdo:**
- Firmware completo do ESP32
- 2 Tasks FreeRTOS (Sensores + MQTT)
- Comunicação via Queue
- Detecção de entrada/saída
- Cliente MQTT

**Arquivos Principais:**
- `main.cpp`: Código principal (limpo, sem comentários desnecessários)
- `platformio.ini`: Configuração do projeto PlatformIO

**Como usar:**
```bash
cd esp32-esp8266
pio run --target upload
```

### 📁 raspberry-pi/
**Função**: Broker MQTT e Dashboard Web

**Planejamento:**
```
raspberry-pi/
├── README.md
├── requirements.txt          # Dependências Python
├── mqtt_test.py             # Script de teste
├── mqtt_broker/             # (a criar)
│   └── mosquitto.conf
├── dashboard/               # (a criar)
│   ├── app.py              # Backend Flask
│   ├── templates/          # HTML
│   │   └── index.html
│   └── static/             # CSS, JS
│       ├── css/
│       └── js/
└── database/                # (a criar)
    └── models.py
```

**Tarefas Futuras:**
- [ ] Instalar e configurar Mosquitto
- [ ] Desenvolver dashboard Flask/Django
- [ ] Implementar WebSocket para tempo real
- [ ] Criar banco de dados para histórico
- [ ] Adicionar gráficos (Chart.js)

### 📁 schematics/
**Função**: Diagramas e esquemas eletrônicos

**Planejamento:**
```
schematics/
├── README.md
├── componentes.txt               # Lista de materiais
├── smartentry_breadboard.fzz    # (a criar) Fritzing
├── smartentry_schematic.pdf     # (a criar) Esquemático
├── smartentry_diagram.png       # (a criar) Diagrama blocos
└── photos/                      # (a criar) Fotos montagem
    ├── prototipo_01.jpg
    └── prototipo_02.jpg
```

**Tarefas Futuras:**
- [ ] Criar diagrama no Fritzing
- [ ] Exportar esquemático em PDF
- [ ] Tirar fotos do protótipo
- [ ] Criar diagrama de blocos

## Arquivos NÃO incluídos (por projeto)
❌ **docs/** - Não implementado conforme solicitação

## Tecnologias por Componente

### ESP32
- **Linguagem**: C++ (Arduino Framework)
- **RTOS**: FreeRTOS (nativo)
- **Bibliotecas**: 
  - WiFi.h
  - PubSubClient (MQTT)
- **IDE**: PlatformIO

### Raspberry Pi
- **OS**: Raspberry Pi OS (Linux)
- **Linguagens**: Python 3, JavaScript
- **Broker**: Mosquitto MQTT
- **Backend**: Flask/Django
- **Frontend**: HTML5, CSS3, JavaScript
- **Real-time**: WebSocket/Socket.IO

### Comunicação
- **Protocolo**: MQTT
- **Rede**: Wi-Fi 2.4GHz
- **Formato**: JSON
- **QoS**: 0 (padrão, pode melhorar)

## Fluxo de Dados

```
┌─────────────┐
│  Sensor 1   │
│  (GPIO 13)  │
└──────┬──────┘
       │
       ├───► Task Sensores (Core 0)
       │           │
┌──────┴──────┐   │ Queue
│  Sensor 2   │   │
│  (GPIO 14)  │   ▼
└─────────────┘  Task MQTT (Core 1)
                   │
                   │ Wi-Fi
                   ▼
              ┌──────────┐
              │ Broker   │
              │ MQTT     │
              │ (RPi)    │
              └────┬─────┘
                   │
                   │ WebSocket
                   ▼
              ┌──────────┐
              │Dashboard │
              │  (Web)   │
              └──────────┘
```

## Status de Implementação

### ✅ Concluído
- [x] Estrutura de pastas organizada
- [x] Firmware ESP32 com FreeRTOS
- [x] Detecção de entrada/saída
- [x] Comunicação MQTT
- [x] Código limpo e documentado
- [x] README em todas as pastas

### ⏳ Em Progresso / A Fazer
- [ ] Broker MQTT configurado no Raspberry Pi
- [ ] Dashboard web funcional
- [ ] Banco de dados para histórico
- [ ] Gráficos em tempo real
- [ ] Esquemáticos eletrônicos
- [ ] Fotos do protótipo
- [ ] Relatório ABNT
- [ ] Testes integrados

## Cronograma

| Data | Atividade | Status |
|------|-----------|--------|
| 18/11 | Checkpoint - Prototipação | ✅ |
| 25/11 | Dashboard web básico | ⏳ |
| 02/12 | Validação aplicação web | ⏳ |
| 04/12 | Apresentação final | ⏳ |
| 09/12 | Entrega artefatos | ⏳ |
| 13/12 | Mostra Tech | ⏳ |

## Comandos Rápidos

### Compilar ESP32
```bash
cd esp32-esp8266 && pio run -t upload
```

### Testar MQTT
```bash
python3 raspberry-pi/mqtt_test.py
```

### Verificar Estrutura
```bash
ls -R SmartEntryTracker/
```

---

**Projeto**: SmartEntryTracker  
**Disciplina**: Sistemas Embarcados  
**Padrão**: Conforme especificação do trabalho  
**FreeRTOS**: ✅ Implementado

