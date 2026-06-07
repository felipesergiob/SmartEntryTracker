import React, { useMemo } from 'react';
import {
  Card,
  Title,
  Text,
  Group,
  ThemeIcon,
  Stack,
  Grid,
  Badge,
  Table,
} from '@mantine/core';
import { IconChartLine, IconActivity, IconStack2, IconCpu } from '@tabler/icons-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: '#25262b',
  border: '1px solid #373a40',
  borderRadius: '8px',
};

/**
 * Gráfico de Dados — amostras (em lote) recebidas via MQTT (telemetry/batch).
 * Reconstrói cada sensor como uma série para visualizar o sinal capturado.
 */
const SamplesChart = ({ samples }) => {
  const data = useMemo(() => {
    if (!samples || samples.length === 0) return [];
    // Mostra as últimas ~120 amostras, organizando por sensor.
    const recent = samples.slice(-120);
    return recent.map((s, i) => ({
      i,
      [`sensor${s.sensor}`]: s.value,
    }));
  }, [samples]);

  if (data.length === 0) {
    return (
      <Card shadow="md" padding="lg" radius="md" withBorder>
        <Group gap="xs" mb="md">
          <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
            <IconActivity size={20} />
          </ThemeIcon>
          <Title order={3}>Amostras (lote via MQTT)</Title>
        </Group>
        <Text c="dimmed" size="sm">
          Aguardando lotes em <code>telemetry/batch</code>... rode o simulador de
          telemetria.
        </Text>
      </Card>
    );
  }

  return (
    <Card shadow="md" padding="lg" radius="md" withBorder>
      <Group gap="xs" mb="md">
        <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
          <IconActivity size={20} />
        </ThemeIcon>
        <Title order={3}>Amostras (lote via MQTT)</Title>
      </Group>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c2e33" />
          <XAxis dataKey="i" stroke="#909296" tick={{ fill: '#909296' }} />
          <YAxis stroke="#909296" tick={{ fill: '#909296' }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line type="monotone" dataKey="sensor1" stroke="#339af0" dot={false} name="Sensor 1" />
          <Line type="monotone" dataKey="sensor2" stroke="#51cf66" dot={false} name="Sensor 2" />
          <Line type="monotone" dataKey="sensor3" stroke="#ff922b" dot={false} name="Sensor 3" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

/**
 * Gráfico de Performance — latência (μs) por inserção das duas vertentes
 * conforme N cresce (telemetry/perf).
 */
const PerformanceChart = ({ perf }) => {
  const data = useMemo(() => {
    if (!perf || !perf.results) return [];
    return perf.results.map((r) => ({
      n: r.n,
      'Vertente 1 (shift/realloc)': r.shift_per_insert_us ?? r.shift_us / r.n,
      'Vertente 2 (ring buffer)': r.ring_per_insert_us ?? r.ring_us / r.n,
      shift_us: r.shift_us,
      ring_us: r.ring_us,
    }));
  }, [perf]);

  if (data.length === 0) {
    return (
      <Card shadow="md" padding="lg" radius="md" withBorder>
        <Group gap="xs" mb="md">
          <ThemeIcon size="lg" radius="md" variant="light" color="grape">
            <IconChartLine size={20} />
          </ThemeIcon>
          <Title order={3}>Performance: Latência × N</Title>
        </Group>
        <Text c="dimmed" size="sm">
          Aguardando o benchmark em <code>telemetry/perf</code>...
        </Text>
      </Card>
    );
  }

  return (
    <Card shadow="md" padding="lg" radius="md" withBorder>
      <Group gap="xs" mb="md" justify="space-between">
        <Group gap="xs">
          <ThemeIcon size="lg" radius="md" variant="light" color="grape">
            <IconChartLine size={20} />
          </ThemeIcon>
          <Title order={3}>Performance: Latência por inserção (μs) × N</Title>
        </Group>
        <Badge color="grape" variant="light">
          O(n) vs O(1)
        </Badge>
      </Group>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c2e33" />
          <XAxis
            dataKey="n"
            stroke="#909296"
            tick={{ fill: '#909296' }}
            label={{ value: 'N (amostras)', position: 'insideBottom', offset: -4, fill: '#909296' }}
          />
          <YAxis
            stroke="#909296"
            tick={{ fill: '#909296' }}
            label={{ value: 'μs / inserção', angle: -90, position: 'insideLeft', fill: '#909296' }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            type="monotone"
            dataKey="Vertente 1 (shift/realloc)"
            stroke="#ff6b6b"
            strokeWidth={2}
            dot={{ fill: '#ff6b6b', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Vertente 2 (ring buffer)"
            stroke="#51cf66"
            strokeWidth={2}
            dot={{ fill: '#51cf66', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <Table mt="lg" striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>N</Table.Th>
            <Table.Th>V1 total (μs)</Table.Th>
            <Table.Th>V2 total (μs)</Table.Th>
            <Table.Th>Ganho (×)</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((r) => (
            <Table.Tr key={r.n}>
              <Table.Td>{r.n.toLocaleString('pt-BR')}</Table.Td>
              <Table.Td>{Math.round(r.shift_us).toLocaleString('pt-BR')}</Table.Td>
              <Table.Td>{Math.round(r.ring_us).toLocaleString('pt-BR')}</Table.Td>
              <Table.Td>
                <Badge color="teal" variant="light">
                  {r.ring_us > 0 ? (r.shift_us / r.ring_us).toFixed(1) : '—'}×
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
};

export const TelemetryPanel = ({ samples, perf, status }) => {
  return (
    <Stack gap="xl">
      <Card shadow="md" padding="lg" radius="md" withBorder>
        <Group gap="xs">
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <IconCpu size={20} />
          </ThemeIcon>
          <div>
            <Title order={3}>Telemetria com Buffer Circular</Title>
            <Text size="sm" c="dimmed">
              Comparativo empírico: realocação dinâmica/deslocamento (O(n)) vs.
              Ring Buffer de tamanho fixo (O(1)).
            </Text>
          </div>
          {status && (
            <Badge ml="auto" color="blue" variant="light" leftSection={<IconStack2 size={12} />}>
              {status}
            </Badge>
          )}
        </Group>
      </Card>

      <Grid>
        <Grid.Col span={{ base: 12 }}>
          <PerformanceChart perf={perf} />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <SamplesChart samples={samples} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};
