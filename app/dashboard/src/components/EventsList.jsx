import React from 'react';
import { Card, Title, Timeline, Text, Badge, ScrollArea, ThemeIcon } from '@mantine/core';
import { IconLogin, IconLogout, IconClock } from '@tabler/icons-react';

export const EventsList = ({ events }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR');
  };

  return (
    <Card shadow="md" padding="lg" radius="md" withBorder>
      <Title order={3} mb="md">
        📋 Eventos Recentes
      </Title>
      
      <ScrollArea h={400}>
        {events.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nenhum evento registrado ainda
          </Text>
        ) : (
          <Timeline active={-1} bulletSize={24} lineWidth={2}>
            {events.map((event) => (
              <Timeline.Item
                key={event.id}
                bullet={
                  <ThemeIcon
                    size={24}
                    variant="filled"
                    color={event.type === 'ENTRY' || event.type === 'entry' ? 'blue' : 'orange'}
                    radius="xl"
                  >
                    {event.type === 'ENTRY' || event.type === 'entry' 
                      ? <IconLogin size={16} /> 
                      : <IconLogout size={16} />
                    }
                  </ThemeIcon>
                }
                title={
                  <Badge 
                    variant="light" 
                    color={event.type === 'ENTRY' || event.type === 'entry' ? 'blue' : 'orange'}
                  >
                    {event.type === 'ENTRY' || event.type === 'entry' ? 'Entrada' : 'Saída'}
                  </Badge>
                }
              >
                <Text size="sm" c="dimmed" mt={4}>
                  <IconClock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {event.receivedAt 
                    ? formatTime(event.receivedAt)
                    : `${(event.timestamp / 1000).toFixed(0)}s`
                  }
                </Text>
                <Text size="sm" mt={4}>
                  👥 {event.people} {event.people === 1 ? 'pessoa' : 'pessoas'}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </ScrollArea>
    </Card>
  );
};
