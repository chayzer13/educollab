import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Не делаем редирект для запросов /auth/me - это нормально при первой загрузке
      const isAuthRequest = error.config?.url?.includes('/auth/me');
      if (!isAuthRequest) {
        // Только для других запросов удаляем токен, но не делаем редирект
        // Редирект будет обработан в компонентах через Navigate
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      }
    }
    // Обработка 429 (Too Many Requests) - не логируем как критическую ошибку
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please wait before making more requests.');
    }
    return Promise.reject(error);
  }
);

export default api;

