import React, { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Group,
  ThemeIcon,
  Table,
  Select,
  Stack,
  Text,
  Badge,
  Pagination,
  LoadingOverlay
} from '@mantine/core';
import { IconHistory, IconCalendar, IconFilter } from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import { PeakHours } from './PeakHours';

const API_URL = 'http://localhost:3001/api';

export const History = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [lastUpdate, setLastUpdate] = useState(null);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchEvents();

    const interval = setInterval(() => {
      fetchEvents();
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedDate, typeFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        params.append('date', dateStr);
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      params.append('limit', '500');

      const response = await fetch(`${API_URL}/events?${params}`);
      const data = await response.json();
      setEvents(data);
      setPage(1);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const getEventColor = (type) => {
    if (type === 'entry') return 'blue';
    if (type === 'exit') return 'orange';
    return 'violet';
  };

  const getEventLabel = (type) => {
    if (type === 'entry') return 'Entrada';
    if (type === 'exit') return 'Saída';
    return 'Passou';
  };

  const paginatedEvents = events.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(events.length / itemsPerPage);

  const formattedEventsForChart = events.map(event => ({
    ...event,
    receivedAt: event.received_at,
    type: event.type.toUpperCase()
  }));

  return (
    <Stack gap="md">
      {events.length > 0 && (
        <PeakHours events={formattedEventsForChart} />
      )}

      <Card shadow="md" padding="lg" radius="md" withBorder>
        <Group gap="xs" mb="md">
          <ThemeIcon size="lg" radius="md" variant="light" color="grape">
            <IconHistory size={20} />
          </ThemeIcon>
          <Title order={3}>Histórico de Eventos</Title>
        </Group>

        <Group gap="md" mb="lg" wrap="wrap">
          <DatePickerInput
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Filtrar por data"
            leftSection={<IconCalendar size={14} stroke={1.5} />}
            clearable
            size="sm"
            locale="pt-br"
            valueFormat="DD/MM/YYYY"
            firstDayOfWeek={0}
            maxDate={new Date()}
            dropdownType="popover"
            popoverProps={{ 
              withinPortal: true,
              shadow: 'md',
              radius: 'md'
            }}
            style={{ minWidth: 200, maxWidth: 250 }}
          />

          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            data={[
              { value: 'all', label: 'Todos os tipos' },
              { value: 'entry', label: 'Entradas' },
              { value: 'exit', label: 'Saídas' },
              { value: 'passed_by', label: 'Passagens' }
            ]}
            leftSection={<IconFilter size={14} stroke={1.5} />}
            size="sm"
            style={{ minWidth: 180, maxWidth: 200 }}
          />
        </Group>

        <Group justify="space-between" mb="md">
          <Text size="sm" c="dimmed">
            Total: {events.length} eventos
          </Text>
          {lastUpdate && (
            <Text size="xs" c="dimmed">
              Atualizado pela última vez em {lastUpdate.toLocaleTimeString('pt-BR')}
            </Text>
          )}
        </Group>

        <div style={{ position: 'relative', minHeight: 400 }}>
          <LoadingOverlay visible={loading} />
          
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Data/Hora</Table.Th>
                <Table.Th>Pessoas</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Ocupado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedEvents.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="xl">
                      Nenhum evento encontrado
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedEvents.map((event) => (
                  <Table.Tr key={event.id}>
                    <Table.Td>{event.id}</Table.Td>
                    <Table.Td>
                      <Badge color={getEventColor(event.type)} size="sm">
                        {getEventLabel(event.type)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(event.received_at)}</Table.Td>
                    <Table.Td>{event.people || '-'}</Table.Td>
                    <Table.Td>{event.total || '-'}</Table.Td>
                    <Table.Td>
                      {event.occupied ? (
                        <Badge color="green" size="xs">Sim</Badge>
                      ) : (
                        <Badge color="gray" size="xs">Não</Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>

        {totalPages > 1 && (
          <Group justify="center" mt="lg">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}
      </Card>
    </Stack>
  );
};
