import React from 'react';
import { Card, Title, Timeline, Text, Badge, ScrollArea, ThemeIcon } from '@mantine/core';
import { IconLogin, IconLogout, IconClock, IconWalk } from '@tabler/icons-react';

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
            {events.map((event) => {
              const isEntry = event.type === 'ENTRY' || event.type === 'entry';
              const isExit = event.type === 'EXIT' || event.type === 'exit';
              const isPassedBy = event.type === 'PASSED_BY' || event.type === 'passed_by';
              
              const eventColor = isEntry ? 'blue' : isExit ? 'orange' : 'violet';
              const eventLabel = isEntry ? 'Entrada' : isExit ? 'Saída' : 'Passou na Frente';
              const eventIcon = isEntry ? <IconLogin size={16} /> : isExit ? <IconLogout size={16} /> : <IconWalk size={16} />;
              
              return (
                <Timeline.Item
                  key={event.id}
                  bullet={
                    <ThemeIcon
                      size={24}
                      variant="filled"
                      color={eventColor}
                      radius="xl"
                    >
                      {eventIcon}
                    </ThemeIcon>
                  }
                  title={
                    <Badge variant="light" color={eventColor}>
                      {eventLabel}
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
                  {!isPassedBy && event.people !== undefined && (
                    <Text size="sm" mt={4}>
                      👥 {event.people} {event.people === 1 ? 'pessoa' : 'pessoas'}
                    </Text>
                  )}
                  {isPassedBy && event.total !== undefined && (
                    <Text size="sm" mt={4}>
                      🚶 Total: {event.total}
                    </Text>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </ScrollArea>
    </Card>
  );
};
