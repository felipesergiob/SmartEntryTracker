#!/usr/bin/env python3
"""
Script de teste para verificar conexão com broker MQTT
e receber mensagens do ESP32
"""

import paho.mqtt.client as mqtt
import json
from datetime import datetime

BROKER_HOST = "localhost"
BROKER_PORT = 1883

def on_connect(client, userdata, flags, rc):
    """Callback quando conecta ao broker"""
    if rc == 0:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Conectado ao broker MQTT!")
        print("Aguardando mensagens do ESP32...\n")
        
        client.subscribe("entry/#")
        print("Subscrito em: entry/#\n")
    else:
        print(f"Falha na conexão. Código: {rc}")

def on_message(client, userdata, msg):
    """Callback quando recebe mensagem"""
    timestamp = datetime.now().strftime('%H:%M:%S')
    topic = msg.topic
    payload = msg.payload.decode()
    
    print(f"[{timestamp}] Tópico: {topic}")
    

    if topic == "entry/data":
        try:
            data = json.loads(payload)
            print(f"  Tipo: {data['type']}")
            print(f"  Pessoas: {data['people']}")
            print(f"  Ocupado: {data['occupied']}")
            print(f"  Timestamp: {data['timestamp']}")
        except:
            print(f"  Dados: {payload}")
    else:
        print(f"  Dados: {payload}")
    
    print()

def main():
    """Função principal"""
    print("=" * 50)
    print("  SmartEntryTracker - MQTT Test Client")
    print("=" * 50)
    print()
    
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        print(f"Conectando ao broker {BROKER_HOST}:{BROKER_PORT}...")
        client.connect(BROKER_HOST, BROKER_PORT, 60)
        client.loop_forever()
    except KeyboardInterrupt:
        print("\nEncerrando...")
        client.disconnect()
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    main()

