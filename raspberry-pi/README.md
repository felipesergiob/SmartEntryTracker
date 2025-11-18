# Raspberry Pi - Broker MQTT e Dashboard

## Descrição

Esta pasta contém os códigos para o Raspberry Pi, incluindo:
- Configuração do broker MQTT (Mosquitto)
- Dashboard web para visualização em tempo real
- Scripts de gerenciamento

## Requisitos

### Sistema Operacional
- Raspberry Pi OS (Linux) ou Raspbian (Debian ARM)

### Software Necessário
- Mosquitto MQTT Broker
- Python 3.x
- Node.js (opcional, para dashboard)

## Instalação do Broker MQTT

### Mosquitto
```bash
sudo apt update
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

### Configuração
Edite `/etc/mosquitto/mosquitto.conf`:
```
listener 1883
allow_anonymous true
```

Reinicie o serviço:
```bash
sudo systemctl restart mosquitto
```

## Dashboard

### Opção 1: Node-RED
```bash
bash <(curl -sL https://raw.githubusercontent.com/node-red/linux-installers/master/deb/update-nodejs-and-nodered)
sudo systemctl enable nodered.service
sudo systemctl start nodered.service
```

Acesse: `http://IP_DO_RASPBERRY:1880`

### Opção 2: Flask/Django (Python)
_Em desenvolvimento_

## Testes

### Verificar Broker
```bash
mosquitto_sub -h localhost -t '#' -v
```

### Publicar Teste
```bash
mosquitto_pub -h localhost -t 'test/topic' -m 'Hello MQTT'
```

## Estrutura de Arquivos

```
raspberry-pi/
├── README.md              # Este arquivo
├── mqtt_broker/          # Configurações do broker
├── dashboard/            # Aplicação web
│   ├── app.py           # Backend
│   ├── templates/       # HTML
│   ├── static/          # CSS, JS
│   └── requirements.txt
└── scripts/              # Scripts auxiliares
```

## Próximos Passos

- [ ] Implementar dashboard web
- [ ] Adicionar banco de dados (SQLite/MySQL)
- [ ] Criar gráficos em tempo real
- [ ] Implementar histórico de dados
- [ ] Adicionar alertas por e-mail

