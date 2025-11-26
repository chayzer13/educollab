import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Обновляем данные при монтировании компонента
      refetchOnReconnect: true, // Обновляем при восстановлении соединения
      retry: 1,
      staleTime: 0, // Данные сразу считаются устаревшими, чтобы обновляться после мутаций
      cacheTime: 5 * 60 * 1000 // 5 минут - кэш хранится
    },
    mutations: {
      // Автоматически инвалидируем связанные запросы после мутаций
      onSettled: () => {
        // Это будет переопределяться в каждой мутации индивидуально
      }
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CssBaseline />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

