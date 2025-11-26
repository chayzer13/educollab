/**
 * Формирует полный URL для аватара пользователя
 * @param {string} avatarPath - Путь к аватару (например, "/uploads/filename.jpg")
 * @returns {string|null} - Полный URL или null, если путь не указан
 */
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  
  // Если путь уже полный URL, возвращаем как есть
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // Нормализуем путь
  const normalizedPath = avatarPath.startsWith('/uploads/') 
    ? avatarPath 
    : avatarPath.startsWith('/') 
      ? avatarPath 
      : `/uploads/${avatarPath}`;
  
  // В development используем полный URL к backend (localhost:3001)
  // В production используем относительный путь через Nginx (порт 80)
  if (process.env.NODE_ENV === 'development') {
    // Если есть REACT_APP_API_URL, используем его базовый URL
    if (process.env.REACT_APP_API_URL) {
      const apiBase = process.env.REACT_APP_API_URL.replace('/api', '');
      return `${apiBase}${normalizedPath}`;
    }
    // Иначе используем localhost:3001 напрямую
    return `http://localhost:3001${normalizedPath}`;
  }
  
  // В production используем относительный путь (Nginx проксирует)
  return normalizedPath;
};

