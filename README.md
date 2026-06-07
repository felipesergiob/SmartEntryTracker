# 🏪 SmartEntryTracker
## Sistema Inteligente de Análise de Fluxo de Pessoas para Varejo

### 📊 Sistema de Análise de Fluxo de Pessoas com IoT

---

## 💡 Contexto e Motivação

Estabelecimentos comerciais frequentemente não possuem dados sobre:
- Quantas pessoas passam em frente mas não entram
- Taxa real de conversão de visitantes
- Horários de maior e menor movimento
- Efetividade da vitrine em atrair pessoas
- Padrões de comportamento ao longo do tempo

Este projeto oferece uma solução baseada em IoT para coletar e analisar essas métricas em tempo real.

---

## 🎯 A Solução

Sistema IoT completo que monitora e analisa **3 métricas fundamentais** do seu negócio:

### 1️⃣ **Leads Potenciais** (Pessoas que Passaram)
Conte quantas pessoas passam na frente da sua loja. Esse é seu **público potencial**.

### 2️⃣ **Conversão de Entrada** (Taxa de Conversão)
Descubra quantos desses leads se tornam visitantes. Meça o **poder de atração** da sua vitrine.

### 3️⃣ **Fluxo Real** (Entradas e Saídas)
Monitore em tempo real quantas pessoas estão dentro da loja e seus **horários de pico**.

---

## 🚀 Benefícios e Aplicações

### 📈 **Otimização Operacional**
- Identifique horários de pico para melhor alocação de recursos
- Análise de padrões de fluxo baseada em dados reais
- Suporte a decisões estratégicas com métricas concretas

### 📊 **Análise de Comportamento**
- Entenda padrões de movimentação de pessoas
- Teste hipóteses e meça impacto de mudanças
- Compare performance entre diferentes períodos

### 🎯 **Métricas Disponíveis**
- **Taxa de Conversão**: Percentual de pessoas que entram vs passam
- **Horários de Pico**: Identificação de períodos de maior movimento
- **Fluxo em Tempo Real**: Monitoramento instantâneo
- **Histórico Completo**: Dados armazenados para análise de tendências

---

## 🏆 Características do Sistema

✅ **Instalação Simplificada** - Configuração direta, sem necessidade de obras  
✅ **Tempo Real** - Processamento e visualização instantânea de dados  
✅ **Interface Intuitiva** - Dashboard moderno e fácil de usar  
✅ **Armazenamento de Dados** - Histórico completo para análise de tendências  
✅ **Tecnologia Acessível** - Baseado em componentes IoT de baixo custo  
✅ **Arquitetura Escalável** - Pode ser adaptado para diferentes tamanhos de estabelecimentos  

---

## 🖥️ Dashboard Profissional

Interface moderna e intuitiva mostrando:

- 👥 **Pessoas no local** (tempo real)
- 🚶 **Total que passou na frente** (leads potenciais)
- 📥 **Total de entradas** (conversões)
- 📤 **Total de saídas**
- 📊 **Taxa de conversão** entrada/passagem
- ⏰ **Horários de pico** com gráficos visuais
- 📈 **Gráficos de atividade** por período
- 📜 **Histórico detalhado** com filtros

---

## 🔧 Tecnologia de Ponta

- **Hardware**: ESP32 + Sensores Infravermelhos de alta precisão (Série MH)
- **Comunicação**: MQTT (protocolo IoT industrial)
- **Interface**: Dashboard web responsivo (React + Vite)
- **Armazenamento**: Banco de dados SQLite com histórico completo
- **Visualização**: Gráficos dinâmicos e métricas em tempo real

---

## 💼 Possíveis Aplicações

- **Varejo de Rua**: Análise de localização e efetividade de vitrines
- **Shopping Centers**: Comparação de fluxo entre diferentes horários
- **Eventos Temporários**: Monitoramento de movimentação em eventos
- **Múltiplas Unidades**: Padronização de métricas entre estabelecimentos

---

## 🎓 Desenvolvido por

**Equipe:** Felipe Sérgio, Thiago Belo, Thiago Von Sohsten, Sergio Gouveia e Enzo Nunes  
**Instituição:** Curso de Sistemas Embarcados  
**Orientadores:** Prof. Bella Nunes | Prof. Jymmy Barreto

---

## 🚀 Como Começar

### Instalação do Sistema

1. **Inicie o Broker MQTT:**
```bash
mosquitto -c mosquitto.conf
```

2. **Inicie o Dashboard:**
```bash
cd app/dashboard
yarn start
```

3. **Inicie o Servidor de Histórico:**
```bash
cd app/server
yarn start:dev
```

4. **Configure o ESP32** e posicione os sensores conforme documentação

---

## 🎭 Modo Demo (sem hardware)

Não tem o ESP32 nem os sensores em mãos? A pasta [`simulator/`](simulator/)
substitui o microcontrolador por scripts Node que publicam **exatamente os
mesmos tópicos MQTT** que o firmware — o server e o dashboard rodam sem nenhuma
alteração. Inclui até um **broker MQTT embutido**, então nem o mosquitto é
necessário.

```bash
cd simulator
npm install
npm run seed        # (opcional) popula o histórico com dias anteriores
```

Depois, em terminais separados, a partir da raiz do projeto:

```bash
cd simulator && npm run broker        # broker MQTT (no lugar do mosquitto)
cd app/server && npm run start:dev    # server de histórico
cd app/dashboard && npm start         # dashboard web
cd simulator && npm run sim           # mock dos sensores (ESP32)
```

Detalhes e opções de configuração em [`simulator/README.md`](simulator/README.md).

---

## 🧮 Telemetria com Buffer Circular (Análise de Algoritmos)

Além do rastreamento de entrada, o projeto traz uma camada de telemetria que
contrasta **empiricamente** duas estratégias de gerência de uma janela de
amostras de sensores transmitida via MQTT:

- **Vertente 1 (anti-padrão):** deslocamento de array / `realloc()` a cada
  leitura → `O(n)` por inserção (`O(n²)` acumulado), com *jitter* crescente e
  fragmentação de heap.
- **Vertente 2 (eficiente):** **Ring Buffer** de tamanho fixo com índices
  head/tail → `O(1)` por inserção, latência constante e memória estável.

**Entregáveis:**
1. **Código-fonte** — firmware C++/Arduino com ambas as implementações:
   [`esp32/src/RingBuffer.h`](esp32/src/RingBuffer.h),
   [`esp32/src/ShiftBuffer.h`](esp32/src/ShiftBuffer.h) e
   [`esp32/src/Telemetry.h`](esp32/src/Telemetry.h).
2. **Painel de telemetria** — aba **Telemetria** no dashboard, com o gráfico de
   amostras (lote via MQTT) e o gráfico de performance (latência μs × N).
3. **Relatório** — [`docs/relatorio-buffer-circular.tex`](docs/relatorio-buffer-circular.tex)
   (análise assintótica, diagnóstico de memória e discussão de instabilidade de
   rede).

Sem hardware, o benchmark roda pelo simulador (Node reproduz fielmente as
classes C++):

```bash
cd simulator && npm run broker        # broker MQTT
cd simulator && npm run telemetry     # benchmark + streaming de amostras
cd app/dashboard && npm start         # abra a aba "Telemetria"
```

---

## 📄 Sobre o Projeto

Projeto acadêmico desenvolvido para a disciplina de **Sistemas Embarcados**, demonstrando a aplicação prática de IoT no contexto de varejo e análise de dados em tempo real.

---

**SmartEntryTracker** - Inteligência de dados para o varejo moderno 🛍️📊