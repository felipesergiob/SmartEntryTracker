import React, { useMemo } from 'react';
import {
  AppShell,
  Container,
  Title,
  Badge,
  Grid,
  Card,
  Text,
  Group,
  Stack,
  RingProgress,
  Center,
  ThemeIcon
} from '@mantine/core';
import {
  IconDoor,
  IconUsers,
  IconLogin,
  IconLogout,
  IconPlugConnected,
  IconPlugConnectedX
} from '@tabler/icons-react';
import { useMqtt } from './hooks/useMqtt';
import { calculatePeakHours } from './utils/analytics';
import { EventsList } from './components/EventsList';
import { ActivityChart } from './components/ActivityChart';
import { PeakHours } from './components/PeakHours';
import { MQTT_CONFIG } from '../config';

function App() {
  const mqttData = useMqtt(MQTT_CONFIG.broker, MQTT_CONFIG.topics);

  const peakHours = useMemo(() => {
    return calculatePeakHours(mqttData.events);
  }, [mqttData.events]);

  const stats = useMemo(() => {
    const entries = mqttData.events.filter(e => 
      e.type === 'ENTRY' || e.type === 'entry'
    ).length;
    
    const exits = mqttData.events.filter(e => 
      e.type === 'EXIT' || e.type === 'exit'
    ).length;

    return { entries, exits };
  }, [mqttData.events]);

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
      style={{ backgroundColor: '#1a1b1e' }}
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" px="md">
            <Group>
              <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                <IconDoor size={24} />
              </ThemeIcon>
              <Title order={2}>Smart Entry Tracker</Title>
            </Group>
            
            <Group>
              <Badge
                size="lg"
                variant="dot"
                color={mqttData.connected ? 'green' : 'red'}
                leftSection={mqttData.connected ? <IconPlugConnected size={16} /> : <IconPlugConnectedX size={16} />}
              >
                {mqttData.connected ? 'Conectado' : 'Desconectado'}
              </Badge>
              
              {mqttData.status && (
                <Badge size="lg" variant="light" color="blue">
                  {mqttData.status}
                </Badge>
              )}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Stack gap="xl">
            {/* Cards de Estatísticas */}
            <Grid>
              {/* Pessoas no Local */}
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card shadow="md" padding="lg" radius="md" withBorder>
                  <Stack gap="xs" align="center">
                    <RingProgress
                      size={120}
                      thickness={12}
                      sections={[
                        { 
                          value: mqttData.occupied ? 100 : 0, 
                          color: mqttData.occupied ? 'green' : 'gray' 
                        }
                      ]}
                      label={
                        <Center>
                          <ThemeIcon
                            size="xl"
                            radius="xl"
                            variant="light"
                            color={mqttData.occupied ? 'green' : 'gray'}
                          >
                            <IconUsers size={28} />
                          </ThemeIcon>
                        </Center>
                      }
                    />
                    <Stack gap={0} align="center">
                      <Text size="xl" fw={700}>{mqttData.count}</Text>
                      <Text size="sm" c="dimmed">Pessoas no Local</Text>
                      <Badge 
                        size="sm" 
                        variant="light" 
                        color={mqttData.occupied ? 'green' : 'gray'}
                        mt="xs"
                      >
                        {mqttData.occupied ? '🟢 Ocupado' : '⚪ Vazio'}
                      </Badge>
                    </Stack>
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Total de Entradas */}
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card shadow="md" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Entradas
                    </Text>
                    <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                      <IconLogin size={20} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700}>{stats.entries}</Text>
                  <Text size="xs" c="dimmed" mt={5}>
                    Total de entradas registradas
                  </Text>
                </Card>
              </Grid.Col>

              {/* Total de Saídas */}
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card shadow="md" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Saídas
                    </Text>
                    <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                      <IconLogout size={20} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700}>{stats.exits}</Text>
                  <Text size="xs" c="dimmed" mt={5}>
                    Total de saídas registradas
                  </Text>
                </Card>
              </Grid.Col>

              {/* Último Evento */}
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card shadow="md" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
                      Último Evento
                    </Text>
                    <ThemeIcon 
                      size="lg" 
                      radius="md" 
                      variant="light" 
                      color={
                        mqttData.lastEvent === 'ENTRY' || mqttData.lastEvent === 'entry' 
                          ? 'blue' 
                          : 'orange'
                      }
                    >
                      {mqttData.lastEvent === 'ENTRY' || mqttData.lastEvent === 'entry' 
                        ? <IconLogin size={20} /> 
                        : <IconLogout size={20} />
                      }
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700}>
                    {mqttData.lastEvent === 'ENTRY' || mqttData.lastEvent === 'entry' 
                      ? '📥' 
                      : mqttData.lastEvent 
                        ? '📤' 
                        : '-'
                    }
                  </Text>
                  <Text size="xs" c="dimmed" mt={5}>
                    {mqttData.lastEvent === 'ENTRY' || mqttData.lastEvent === 'entry' 
                      ? 'Entrada' 
                      : mqttData.lastEvent 
                        ? 'Saída' 
                        : 'Aguardando...'
                    }
                  </Text>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Horários de Pico */}
            <PeakHours peakHours={peakHours} />

            {/* Gráfico de Atividade */}
            <ActivityChart events={mqttData.events} />

            {/* Lista de Eventos */}
            <EventsList events={mqttData.events.slice(0, 15)} />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
