# Esquemas e Diagramas Eletrônicos

## Descrição

Esta pasta contém todos os diagramas eletrônicos, esquemáticos e layouts do projeto.

## Ferramentas Sugeridas

- **Fritzing:** Para prototipação e layout de breadboard
- **KiCad:** Para esquemáticos profissionais e PCB
- **EasyEDA:** Alternativa online
- **Tinkercad Circuits:** Para simulação online

## Componentes do Projeto

### Hardware Utilizado

#### Microcontrolador
- 1x ESP32 NodeMCU (ou 2x incluindo ESP8266 opcional)

#### Sensores
- 2x Sensor MH Infravermelho (4 pinos: VCC, GND, A0, D0)

#### Conexões Principais

**Sensor 1 (MH IR):**
- VCC → 3.3V do ESP32
- GND → GND do ESP32
- D0 → GPIO 13 do ESP32
- A0 → Não utilizado

**Sensor 2 (MH IR):**
- VCC → 3.3V do ESP32
- GND → GND do ESP32
- D0 → GPIO 14 do ESP32
- A0 → Não utilizado

#### Alimentação
- USB (5V) ou fonte externa 5V
- Regulador interno do ESP32 fornece 3.3V

## Diagrama de Conexão

```
        ESP32
    ┌──────────┐
    │          │
    │  GPIO 13 ├────► Sensor 1 (D0)
    │          │
    │  GPIO 14 ├────► Sensor 2 (D0)
    │          │
    │   3.3V   ├────► VCC (Sensores)
    │          │
    │   GND    ├────► GND (Sensores)
    │          │
    └──────────┘
```

## Posicionamento dos Sensores

Para detecção correta de entrada/saída:

```
    Entrada         Saída
      ↓              ↑
   ┌─────┐        ┌─────┐
   │ S1  │        │ S2  │
   └─────┘        └─────┘
      →     PASSAGEM    →
   
   Distância: 30-50cm entre sensores
   Altura: 1m do chão (ajustável)
```

## Arquivos

Esta pasta deve conter:

- [ ] `smartentry_breadboard.fzz` - Layout Fritzing
- [ ] `smartentry_schematic.kicad_pro` - Esquemático KiCad
- [ ] `smartentry_diagram.png` - Diagrama de blocos
- [ ] `smartentry_pcb.kicad_pcb` - Layout PCB (opcional)
- [ ] `componentes.txt` - Lista de materiais (BOM)

## Características dos Sensores MH IR

### Especificações
- Tensão: 3.3V - 5V
- Alcance: 2-30cm (ajustável via potenciômetro)
- Saída Digital: HIGH (sem objeto) / LOW (com objeto)
- Saída Analógica: Disponível mas não utilizada
- LED indicador: Acende quando detecta objeto

### Ajuste de Sensibilidade
- Potenciômetro no módulo ajusta distância de detecção
- Recomendado: Testar e calibrar para 10-20cm

## Notas Importantes

⚠️ **Atenção:**
- Usar resistores pull-up internos do ESP32 (INPUT_PULLUP) se necessário
- Verificar nível lógico dos sensores (3.3V compatível)
- Evitar exposição direta à luz solar intensa
- Posicionar sensores alinhados horizontalmente

## Diagrama de Sistema

```
┌──────────────┐
│   Sensor 1   │
│   (GPIO 13)  │
└───────┬──────┘
        │
        │ Detecção
        │
┌───────▼──────────┐
│                  │
│      ESP32       │◄─── Wi-Fi
│    (FreeRTOS)    │
│                  │
└───────▲──────────┘
        │
        │ Detecção
        │
┌───────┴──────┐
│   Sensor 2   │
│   (GPIO 14)  │
└──────────────┘
        │
        │ MQTT
        ▼
┌──────────────┐
│ Raspberry Pi │
│ (Broker MQTT)│
└───────┬──────┘
        │
        │ HTTP
        ▼
┌──────────────┐
│  Dashboard   │
│   (Web App)  │
└──────────────┘
```

## Lista de Materiais (BOM)

| Qtd | Componente | Descrição |
|-----|-----------|-----------|
| 1 | ESP32 NodeMCU | Microcontrolador |
| 2 | Sensor MH IR | Detector infravermelho |
| 1 | Cabo USB | Alimentação e programação |
| 6 | Jumpers | Conexões |
| 1 | Breadboard | Prototipação (opcional) |

## Próximos Passos

- [ ] Criar diagramas no Fritzing
- [ ] Exportar esquemático profissional
- [ ] Adicionar fotos do protótipo montado
- [ ] Criar PCB customizado (opcional)

