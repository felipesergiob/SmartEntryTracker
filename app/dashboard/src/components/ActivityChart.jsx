import React, { useMemo } from 'react';
import { Card, Title, Text, Group, ThemeIcon } from '@mantine/core';
import { IconChartLine } from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ActivityChart = ({ events }) => {
  const chartData = useMemo(() => {
    if (!events || events.length === 0) return [];

    const groupedByMinute = events.reduce((acc, event) => {
      if (!event.receivedAt) return acc;
      
      const date = new Date(event.receivedAt);
      const minute = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      if (!acc[minute]) {
        acc[minute] = { time: minute, entradas: 0, saidas: 0, passagens: 0 };
      }
      
      if (event.type === 'ENTRY' || event.type === 'entry') {
        acc[minute].entradas++;
      } else if (event.type === 'EXIT' || event.type === 'exit') {
        acc[minute].saidas++;
      } else if (event.type === 'PASSED_BY' || event.type === 'passed_by') {
        acc[minute].passagens++;
      }
      
      return acc;
    }, {});

    return Object.values(groupedByMinute).reverse().slice(0, 20).reverse();
  }, [events]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card shadow="md" padding="lg" radius="md" withBorder>
      <Group gap="xs" mb="md">
        <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
          <IconChartLine size={20} />
        </ThemeIcon>
        <Title order={3}>Atividade em Tempo Real</Title>
      </Group>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c2e33" />
          <XAxis 
            dataKey="time" 
            stroke="#909296"
            tick={{ fill: '#909296' }}
          />
          <YAxis 
            stroke="#909296"
            tick={{ fill: '#909296' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#25262b',
              border: '1px solid #373a40',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="passagens" 
            stroke="#9775fa" 
            strokeWidth={2}
            dot={{ fill: '#9775fa', r: 4 }}
            activeDot={{ r: 6 }}
            name="Passagens"
          />
          <Line 
            type="monotone" 
            dataKey="entradas" 
            stroke="#339af0" 
            strokeWidth={2}
            dot={{ fill: '#339af0', r: 4 }}
            activeDot={{ r: 6 }}
            name="Entradas"
          />
          <Line 
            type="monotone" 
            dataKey="saidas" 
            stroke="#ff922b" 
            strokeWidth={2}
            dot={{ fill: '#ff922b', r: 4 }}
            activeDot={{ r: 6 }}
            name="Saídas"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
