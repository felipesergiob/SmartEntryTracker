export const calculatePeakHours = (events) => {
  if (!events || events.length === 0) return [];

  const hourlyEntries = {};

  events.forEach(event => {
    if (event.type === 'ENTRY' || event.type === 'entry') {
      const date = new Date(event.receivedAt);
      const hour = date.getHours();
      
      if (!hourlyEntries[hour]) {
        hourlyEntries[hour] = 0;
      }
      hourlyEntries[hour]++;
    }
  });

  const peakHours = Object.entries(hourlyEntries)
    .map(([hour, count]) => ({
      hour: parseInt(hour, 10),
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return peakHours;
};

export const formatHour = (hour) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

export const prepareChartData = (events) => {
  if (!events || events.length === 0) return [];

  const dataByMinute = {};

  events.forEach(event => {
    const date = new Date(event.receivedAt);
    const timeKey = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    if (!dataByMinute[timeKey]) {
      dataByMinute[timeKey] = { time: timeKey, entries: 0, exits: 0 };
    }

    if (event.type === 'ENTRY' || event.type === 'entry') {
      dataByMinute[timeKey].entries++;
    } else if (event.type === 'EXIT' || event.type === 'exit') {
      dataByMinute[timeKey].exits++;
    }
  });

  return Object.values(dataByMinute)
    .sort((a, b) => {
      const [aH, aM] = a.time.split(':').map(Number);
      const [bH, bM] = b.time.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    })
    .slice(-20);
};

export const formatTimestamp = (timestamp) => {
  const seconds = Math.floor(timestamp / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

