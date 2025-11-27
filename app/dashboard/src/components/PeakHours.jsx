import React, { useState, useMemo } from 'react';
import { Card, Title, Group, ThemeIcon, SegmentedControl, Text, Center } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PeakHours = ({ events }) => {
  const [filter, setFilter] = useState('all');

  const chartData = useMemo(() => {
    if (!events || events.length === 0) return [];

    const hourlyData = {};

    events.forEach(event => {
      if (!event.receivedAt) return;

      const shouldInclude = 
        filter === 'all' ||
        (filter === 'entries' && (event.type === 'ENTRY' || event.type === 'entry')) ||
        (filter === 'exits' && (event.type === 'EXIT' || event.type === 'exit')) ||
        (filter === 'passedby' && (event.type === 'PASSED_BY' || event.type === 'passed_by'));

      if (!shouldInclude) return;

      const date = new Date(event.receivedAt);
      const hour = date.getHours();

      if (!hourlyData[hour]) {
        hourlyData[hour] = { hour: `${hour}h`, count: 0, hourNum: hour };
      }
      hourlyData[hour].count++;
    });

    return Object.values(hourlyData).sort((a, b) => {
      return a.hourNum - b.hourNum;
    });
  }, [events, filter]);

  const getBarColor = () => {
    if (filter === 'entries') return '#339af0';
    if (filter === 'exits') return '#ff922b';
    if (filter === 'passedby') return '#9775fa';
    return '#20c997';
  };

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <Card shadow="md" padding="lg" radius="md" withBorder>
      <Group gap="xs" mb="xs">
        <ThemeIcon size="lg" radius="md" variant="light" color="teal">
          <IconClock size={20} />
        </ThemeIcon>
        <Title order={3}>Horários de Pico</Title>
      </Group>

      <SegmentedControl
        value={filter}
        onChange={setFilter}
        data={[
          { label: 'Todos', value: 'all' },
          { label: 'Entradas', value: 'entries' },
          { label: 'Saídas', value: 'exits' },
          { label: 'Passagens', value: 'passedby' }
        ]}
        color={filter === 'entries' ? 'blue' : filter === 'exits' ? 'orange' : filter === 'passedby' ? 'violet' : 'teal'}
        mb="md"
      />

      {chartData.length === 0 ? (
        <Center h={300}>
          <Text c="dimmed" size="sm">
            Nenhum evento registrado para este filtro
          </Text>
        </Center>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2c2e33" />
            <XAxis 
              dataKey="hour" 
              stroke="#909296"
              tick={{ fill: '#909296' }}
            />
            <YAxis 
              stroke="#909296"
              tick={{ fill: '#909296' }}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#25262b',
                border: '1px solid #373a40',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#c1c2c5' }}
            />
            <Bar 
              dataKey="count" 
              fill={getBarColor()}
              radius={[8, 8, 0, 0]}
              name="Eventos"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
