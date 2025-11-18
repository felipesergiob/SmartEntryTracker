# Guia Rápido - SmartEntryTracker

## Início Rápido em 5 Passos

### 1. Configure o Broker MQTT (Raspberry Pi)

```bash
# No Raspberry Pi
sudo apt update
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Teste
mosquitto_sub -h localhost -t '#' -v
```

### 2. Configure o ESP32

Edite `esp32-esp8266/src/main.cpp`:

```cpp
const char *ssid = "SEU_WIFI";
const char *password = "SUA_SENHA";
const char *mqtt_server = "IP_DO_RASPBERRY";
```

### 3. Compile e Faça Upload

```bash
cd esp32-esp8266
pio run --target upload
pio device monitor
```

### 4. Teste a Comunicação

```bash
# No Raspberry Pi
python3 raspberry-pi/mqtt_test.py
```

### 5. Monte o Hardware

```
Sensor 1:
  VCC → 3.3V (ESP32)
  GND → GND (ESP32)
  D0  → GPIO 13 (ESP32)

Sensor 2:
  VCC → 3.3V (ESP32)
  GND → GND (ESP32)
  D0  → GPIO 14 (ESP32)
```

## Verificação de Funcionamento

### Checklist Hardware
- [ ] ESP32 liga (LED azul acende)
- [ ] Sensores ligam (LED vermelho acende)
- [ ] Sensores detectam objeto (LED verde acende)

### Checklist Software
- [ ] ESP32 conecta ao Wi-Fi
- [ ] ESP32 conecta ao broker MQTT
- [ ] Mensagens aparecem no monitor serial
- [ ] Broker recebe mensagens

### Checklist Detecção
- [ ] Passar mão no Sensor 1 → "SENSOR 1 DISPAROU"
- [ ] Passar mão no Sensor 2 → "SENSOR 2 DISPAROU"
- [ ] Sequência S1→S2 → "ENTRY detectada"
- [ ] Sequência S2→S1 → "EXIT detectada"

## Troubleshooting Rápido

### ESP32 não conecta ao Wi-Fi
1. Verificar SSID e senha
2. Verificar se Wi-Fi é 2.4GHz (ESP32 não suporta 5GHz)
3. Aproximar ESP32 do roteador

### MQTT não conecta
1. Verificar IP do broker: `hostname -I` no Raspberry Pi
2. Testar ping: `ping IP_DO_RASPBERRY`
3. Verificar firewall: `sudo ufw allow 1883`

### Sensores não detectam
1. Ajustar potenciômetro no sensor (sensibilidade)
2. Verificar alimentação (3.3V nos pinos VCC)
3. Testar cada sensor individualmente
4. Verificar se LED do sensor acende

### Detecções incorretas
1. Aumentar timeout: `SEQUENCE_TIMEOUT = 3000`
2. Diminuir sensibilidade dos sensores
3. Evitar luz solar direta nos sensores
4. Aumentar distância entre sensores (50cm)

## Comandos Úteis

### PlatformIO
```bash
pio run              # Compilar
pio run -t upload    # Upload
pio device monitor   # Monitor serial
pio device list      # Listar portas
```

### MQTT
```bash
# Publicar teste
mosquitto_pub -h localhost -t test -m "hello"

# Subscrever em tudo
mosquitto_sub -h localhost -t '#' -v

# Subscrever em entry
mosquitto_sub -h localhost -t 'entry/#' -v
```

### Raspberry Pi
```bash
# Ver IP
hostname -I

# Status do Mosquitto
sudo systemctl status mosquitto

# Logs do Mosquitto
sudo tail -f /var/log/mosquitto/mosquitto.log

# Reiniciar Mosquitto
sudo systemctl restart mosquitto
```

## Próximos Passos

1. ✅ Hardware montado e testado
2. ✅ Firmware funcionando
3. ✅ Broker MQTT operacional
4. ⏳ Desenvolver dashboard web
5. ⏳ Adicionar banco de dados
6. ⏳ Criar gráficos em tempo real
7. ⏳ Escrever relatório (ABNT)
8. ⏳ Preparar apresentação

## Links Úteis

- [Documentação PlatformIO](https://docs.platformio.org/)
- [Mosquitto MQTT](https://mosquitto.org/)
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)
- [FreeRTOS](https://www.freertos.org/)

## Suporte

Problemas? Consulte:
1. README.md principal
2. README.md de cada pasta
3. Documentação oficial das bibliotecas
4. Professores nos checkpoints

---

**Dica:** Sempre teste cada componente individualmente antes de integrar!

