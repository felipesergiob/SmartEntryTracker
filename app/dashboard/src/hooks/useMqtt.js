import { useState, useEffect, useCallback } from 'react';
import mqtt from 'mqtt';

export const useMqtt = (brokerUrl, topics) => {
  const [data, setData] = useState({
    count: 0,
    occupied: false,
    lastEvent: null,
    events: [],
    status: 'Desconectado',
    connected: false,
    passedBy: 0
  });

  const [client, setClient] = useState(null);

  useEffect(() => {
    const mqttClient = mqtt.connect(brokerUrl);

    mqttClient.on('connect', () => {
      console.log('Conectado ao MQTT broker');
      
      topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
          if (err) {
            console.error(`Erro ao inscrever no tópico ${topic}:`, err);
          } else {
            console.log(`Inscrito no tópico: ${topic}`);
          }
        });
      });

      setData(prev => ({ ...prev, connected: true }));
    });

    mqttClient.on('message', (topic, message) => {
      const messageStr = message.toString();
      console.log(`Mensagem recebida - ${topic}: ${messageStr}`);

      setData(prev => {
        const newData = { ...prev };

        if (topic === 'entry/count') {
          newData.count = parseInt(messageStr, 10);
        } 
        else if (topic === 'entry/occupied') {
          newData.occupied = messageStr === 'true';
        } 
        else if (topic === 'entry/event') {
          newData.lastEvent = messageStr;
        } 
        else if (topic === 'entry/passedby') {
          newData.passedBy = parseInt(messageStr, 10);
        }
        else if (topic === 'entry/data') {
          try {
            const eventData = JSON.parse(messageStr);
            
            newData.events = [
              {
                ...eventData,
                id: Date.now() + Math.random(),
                receivedAt: new Date()
              },
              ...prev.events
            ].slice(0, 50);
            
            if (eventData.type === 'passed_by') {
              newData.passedBy = eventData.total;
              newData.lastEvent = eventData.type;
            } else {
              newData.count = eventData.people;
              newData.occupied = eventData.occupied;
              newData.lastEvent = eventData.type;
            }
          } catch (err) {
            console.error('Erro ao parsear JSON:', err);
          }
        } 
        else if (topic === 'entry/status') {
          newData.status = messageStr;
        }

        return newData;
      });
    });

    mqttClient.on('error', (err) => {
      console.error('Erro MQTT:', err);
      setData(prev => ({ ...prev, connected: false }));
    });

    mqttClient.on('disconnect', () => {
      console.log('Desconectado do MQTT');
      setData(prev => ({ ...prev, connected: false }));
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, [brokerUrl, topics]);

  return data;
};

