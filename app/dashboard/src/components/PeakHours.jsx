import React from 'react';
import { Card, Title, Grid, Text, ThemeIcon, Stack, Group, Progress } from '@mantine/core';
import { IconTrendingUp, IconClock } from '@tabler/icons-react';

export const PeakHours = ({ peakHours }) => {
  if (!peakHours || peakHours.length === 0) {
    return null;
  }

  const maxCount = Math.max(...peakHours.map(h => h.count));

  return (
    <Card shadow="md" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>⏰ Horários de Pico</Title>
        <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
          <IconTrendingUp size={20} />
        </ThemeIcon>
      </Group>

      <Grid>
        {peakHours.slice(0, 6).map((hourData) => (
          <Grid.Col key={hourData.hour} span={{ base: 12, sm: 6, md: 4 }}>
            <Card padding="md" radius="md" withBorder bg="dark.6">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconClock size={18} style={{ color: '#ffd43b' }} />
                    <Text fw={600}>{hourData.hour}h</Text>
                  </Group>
                  <Text size="xl" fw={700} c="blue">
                    {hourData.count}
                  </Text>
                </Group>
                
                <Progress 
                  value={(hourData.count / maxCount) * 100} 
                  color="blue"
                  size="sm"
                  radius="xl"
                />
                
                <Text size="xs" c="dimmed">
                  {hourData.count} {hourData.count === 1 ? 'evento' : 'eventos'}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Card>
  );
};
