import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import App from './App';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'dayjs/locale/pt-br';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <DatesProvider settings={{ locale: 'pt-br', firstDayOfWeek: 0, weekendDays: [0, 6] }}>
        <App />
      </DatesProvider>
    </MantineProvider>
  </React.StrictMode>
);

