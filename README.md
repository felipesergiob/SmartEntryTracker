# SmartEntryTracker - Sistema IoT de Controle de Entrada em Lojas

## Descrição do Projeto

Sistema IoT para monitoramento e contagem de pessoas utilizando ESP32 com sensores infravermelhos MH, comunicação MQTT e dashboard em tempo real.

## Disciplina
- **Curso:** Sistemas Embarcados
- **Professores:** Bella Nunes | Jymmy Barreto
- **Data de Entrega:** 04/12

## Equipe

Felipe Sérgio, Thiago Belo, Thiago Von Sohsten, Sergio Gouveia e Enzo Nunes

## Para rodar

INICIAR MQTT: ➜ SmartEntryTracker git:(master) mosquitto -c mosquitto.conf
INICAR DASHBOARD: ➜  dashboard git:(master) yarn start
INICIAR MONITORADOR DE HISTORICO: ➜  server git:(master) yarn start:dev