import React from 'react';
import { useQuery } from 'react-query';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Avatar,
  CircularProgress,
  LinearProgress,
  Paper
} from '@mui/material';
import { 
  Link,
  useNavigate
} from 'react-router-dom';
import {
  Folder,
  People,
  Comment,
  Star,
  TrendingUp,
  AccessTime,
  Visibility,
  VisibilityOff,
  RocketLaunch,
  Groups
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import ru from 'date-fns/locale/ru';

const Home = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const { data: stats, isLoading: statsLoading } = useQuery(
    'homeStats',
    async () => {
      const response = await api.get('/statistics');
      return response.data;
    },
    { enabled: !user } // Загружаем только для неавторизованных
  );

  const { data: recentProjects, isLoading: projectsLoading } = useQuery(
    'recentProjects',
    async () => {
      try {
        const response = await api.get('/projects', { 
          params: { 
            visibility: 'public'
          } 
        });
        // Сортируем по дате создания и берем последние 6
        const projects = Array.isArray(response.data) ? response.data : [];
        return projects
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6);
      } catch (error) {
        // Если не авторизован, возвращаем пустой массив
        if (error.response?.status === 401) {
          return [];
        }
        throw error;
      }
    },
    { enabled: true, retry: false }
  );

  const { data: topProjects } = useQuery(
    'topProjects',
    async () => {
      try {
        const response = await api.get('/statistics/projects');
        return response.data?.topRated?.slice(0, 3) || [];
      } catch (error) {
        // Если не авторизован, возвращаем пустой массив
        if (error.response?.status === 401) {
          return [];
        }
        throw error;
      }
    },
    { enabled: true, retry: false }
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Заголовок с улучшенным дизайном */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ 
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: 2,
          background: isDark 
            ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'
            : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
          mb: 3,
          boxShadow: isDark 
            ? '0 8px 16px rgba(0, 0, 0, 0.4)'
            : '0 8px 16px rgba(0, 0, 0, 0.15)'
        }}>
          <RocketLaunch sx={{ fontSize: 40, color: '#ffffff' }} />
        </Box>
        <Typography variant="h2" component="h1" gutterBottom fontWeight={700}>
          Добро пожаловать в EduCollab
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Платформа для совместной работы над учебными проектами
        </Typography>
        {!user && (
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/register"
              sx={{ 
                px: 4,
                py: 1.5,
                height: 48,
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 2,
                boxShadow: isDark 
                  ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                  : '0 4px 12px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: isDark 
                    ? '0 6px 16px rgba(0, 0, 0, 0.4)'
                    : '0 6px 16px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              Начать работу
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/login"
              sx={{ 
                px: 4,
                py: 1.5,
                height: 48,
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 2
              }}
            >
              Войти
            </Button>
          </Box>
        )}
      </Box>

      {/* Статистика платформы (для неавторизованных) */}
      {!user && !statsLoading && stats && (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                textAlign: 'center', 
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: isDark 
                    ? '0 12px 24px rgba(0, 0, 0, 0.5)'
                    : '0 12px 24px rgba(0, 0, 0, 0.15)'
                },
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: isDark 
                    ? 'linear-gradient(90deg, #0969da 0%, #218bff 100%)'
                    : 'linear-gradient(90deg, #0969da 0%, #218bff 100%)',
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 2,
                  background: isDark 
                    ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'
                    : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: isDark 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <Folder sx={{ fontSize: 28, color: '#ffffff' }} />
                </Box>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {stats.overview?.totalProjects || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Проектов
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                textAlign: 'center', 
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: isDark 
                    ? '0 12px 24px rgba(0, 0, 0, 0.5)'
                    : '0 12px 24px rgba(0, 0, 0, 0.15)'
                },
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: isDark 
                    ? 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)'
                    : 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)',
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 2,
                  background: isDark 
                    ? 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)'
                    : 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: isDark 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <Groups sx={{ fontSize: 28, color: '#ffffff' }} />
                </Box>
                <Typography variant="h4" fontWeight={700} color="secondary">
                  {stats.overview?.totalTeams || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Команд
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                textAlign: 'center', 
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: isDark 
                    ? '0 12px 24px rgba(0, 0, 0, 0.5)'
                    : '0 12px 24px rgba(0, 0, 0, 0.15)'
                },
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: isDark 
                    ? 'linear-gradient(90deg, #58a6ff 0%, #79c0ff 100%)'
                    : 'linear-gradient(90deg, #0969da 0%, #218bff 100%)',
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 2,
                  background: isDark 
                    ? 'linear-gradient(135deg, #58a6ff 0%, #79c0ff 100%)'
                    : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: isDark 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <People sx={{ fontSize: 28, color: '#ffffff' }} />
                </Box>
                <Typography variant="h4" fontWeight={700} color="info">
                  {stats.overview?.totalUsers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Пользователей
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                textAlign: 'center', 
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: isDark 
                    ? '0 12px 24px rgba(0, 0, 0, 0.5)'
                    : '0 12px 24px rgba(0, 0, 0, 0.15)'
                },
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: isDark 
                    ? 'linear-gradient(90deg, #3fb950 0%, #56d364 100%)'
                    : 'linear-gradient(90deg, #1a7f37 0%, #2da44e 100%)',
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 2,
                  background: isDark 
                    ? 'linear-gradient(135deg, #3fb950 0%, #56d364 100%)'
                    : 'linear-gradient(135deg, #1a7f37 0%, #2da44e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: isDark 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <Comment sx={{ fontSize: 28, color: '#ffffff' }} />
                </Box>
                <Typography variant="h4" fontWeight={700} color="success">
                  {stats.overview?.totalComments || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Комментариев
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Функциональные карточки */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: isDark 
                  ? '0 12px 24px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.3)'
                  : '0 12px 24px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: isDark 
                  ? 'linear-gradient(90deg, #0969da 0%, #218bff 100%)'
                  : 'linear-gradient(90deg, #0969da 0%, #218bff 100%)',
                opacity: 0.8
              }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 2,
                  background: isDark 
                    ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'
                    : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  boxShadow: isDark 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <Folder sx={{ fontSize: 28, color: '#ffffff' }} />
                </Box>
                <Typography variant="h5" fontWeight={600}>
                  Создавайте проекты
                </Typography>
              </Box>
              <Typography color="text.secondary" paragraph sx={{ mb: 3, flexGrow: 1 }}>
                Публикуйте свои учебные проекты, делитесь идеями и получайте обратную связь от сообщества
              </Typography>
              {user && (
                <Button
                  variant="contained"
                  component={Link}
                  to="/projects/create"
                  fullWidth
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 2,
                    mt: 'auto'
                  }}
                >
                  Создать проект
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: isDark 
                  ? '0 12px 24px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.3)'
                  : '0 12px 24px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: isDark 
                  ? 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)'
                  : 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)',
                opacity: 0.8
              }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 2,
                  background: isDark 
                    ? 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)'
                    : 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  boxShadow: isDark 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <People sx={{ fontSize: 28, color: '#ffffff' }} />
                </Box>
                <Typography variant="h5" fontWeight={600}>
                  Работайте в командах
                </Typography>
              </Box>
              <Typography color="text.secondary" paragraph sx={{ mb: 3, flexGrow: 1 }}>
                Создавайте команды, приглашайте участников и совместно работайте над проектами
              </Typography>
              {user && (
                <Button
                  variant="outlined"
                  component={Link}
                  to="/teams/create"
                  fullWidth
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 2,
                    mt: 'auto'
                  }}
                >
                  Создать команду
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': { 
                transform: 'translateY(-8px)',
                boxShadow: isDark 
                  ? '0 12px 24px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.3)'
                  : '0 12px 24px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: isDark 
                  ? 'linear-gradient(90deg, #3fb950 0%, #56d364 100%)'
                  : 'linear-gradient(90deg, #1a7f37 0%, #2da44e 100%)',
                opacity: 0.8
              }
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 2,
                  background: isDark 
                    ? 'linear-gradient(135deg, #3fb950 0%, #56d364 100%)'
                    : 'linear-gradient(135deg, #1a7f37 0%, #2da44e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  boxShadow: isDark 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <TrendingUp sx={{ fontSize: 28, color: '#ffffff' }} />
                </Box>
                <Typography variant="h5" fontWeight={600}>
                  Отслеживайте прогресс
                </Typography>
              </Box>
              <Typography color="text.secondary" paragraph sx={{ mb: 3, flexGrow: 1 }}>
                Ведите учет прогресса, получайте оценки и комментарии от сообщества
              </Typography>
              {user && (
                <Button
                  variant="outlined"
                  component={Link}
                  to="/statistics"
                  fullWidth
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 2,
                    mt: 'auto'
                  }}
                >
                  Посмотреть статистику
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Последние проекты */}
      {recentProjects && recentProjects.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Folder sx={{ fontSize: 28, color: 'primary.main' }} />
              <Typography variant="h5" fontWeight={600}>
                Последние проекты
              </Typography>
            </Box>
            <Button 
              component={Link} 
              to="/projects" 
              variant="text"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Все проекты →
            </Button>
          </Box>
          {projectsLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {recentProjects.slice(0, 6).map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: isDark 
                          ? '0 12px 24px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.3)'
                          : '0 12px 24px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)'
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: project.status === 'active' 
                          ? (isDark ? 'linear-gradient(90deg, #0969da 0%, #218bff 100%)' : 'linear-gradient(90deg, #0969da 0%, #218bff 100%)')
                          : project.status === 'completed'
                          ? (isDark ? 'linear-gradient(90deg, #3fb950 0%, #56d364 100%)' : 'linear-gradient(90deg, #1a7f37 0%, #2da44e 100%)')
                          : (isDark ? 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)' : 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)'),
                        opacity: 0.8
                      }
                    }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <CardContent sx={{ p: 3, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ 
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {project.title}
                        </Typography>
                        {project.visibility === 'private' && (
                          <VisibilityOff sx={{ fontSize: 20, color: 'text.secondary', ml: 1, flexShrink: 0 }} />
                        )}
                      </Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '3rem'
                        }}
                      >
                        {project.description}
                      </Typography>
                      {project.progress > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Прогресс
                            </Typography>
                            <Typography variant="caption" fontWeight={600} color="primary">
                              {project.progress}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={project.progress} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                            }}
                          />
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={project.status === 'active' ? 'Активный' : project.status === 'completed' ? 'Завершен' : project.status === 'draft' ? 'Черновик' : 'Архив'}
                          size="small"
                          color={project.status === 'active' ? 'primary' : project.status === 'completed' ? 'success' : 'default'}
                          sx={{ height: 24, fontWeight: 500 }}
                        />
                        {project.visibility && (
                          <Chip
                            icon={project.visibility === 'public' ? <Visibility sx={{ fontSize: 14 }} /> : <VisibilityOff sx={{ fontSize: 14 }} />}
                            label={project.visibility === 'public' ? 'Публичный' : 'Закрытый'}
                            size="small"
                            color={project.visibility === 'public' ? 'default' : 'secondary'}
                            sx={{ height: 24, fontWeight: 500 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: ru })}
                            </Typography>
                          </Box>
                          {project.owner && (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.8
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (project.owner?.id) {
                                  navigate(`/users/${project.owner.id}`);
                                }
                              }}
                            >
                              <Avatar sx={{ width: 20, height: 20, fontSize: '10px' }}>
                                {project.owner.firstName?.[0]}
                              </Avatar>
                              <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                fontWeight={500}
                                sx={{
                                  '&:hover': {
                                    color: 'primary.main',
                                    textDecoration: 'underline'
                                  }
                                }}
                              >
                                {project.owner.firstName}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Топ проектов */}
      {topProjects && topProjects.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Star sx={{ fontSize: 28, color: 'warning.main' }} />
              <Typography variant="h5" fontWeight={600}>
                Популярные проекты
              </Typography>
            </Box>
            <Button 
              component={Link} 
              to="/statistics" 
              variant="text"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Подробнее →
            </Button>
          </Box>
          <Grid container spacing={3}>
            {topProjects.map((project, index) => (
              <Grid item xs={12} md={4} key={project.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': { 
                      transform: 'translateY(-8px)',
                      boxShadow: isDark 
                        ? '0 12px 24px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.3)'
                        : '0 12px 24px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: isDark 
                        ? 'linear-gradient(90deg, #d29922 0%, #e3b341 100%)'
                        : 'linear-gradient(90deg, #9a6700 0%, #bf8700 100%)',
                      opacity: 0.8
                    }
                  }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'secondary.main' : index === 2 ? 'info.main' : 'default',
                          mr: 2, 
                          width: 40, 
                          height: 40,
                          fontWeight: 700,
                          fontSize: '1rem',
                          boxShadow: isDark 
                            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                            : '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <Typography variant="h6" fontWeight={600} sx={{ 
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {project.title}
                      </Typography>
                    </Box>
                    <Paper 
                      sx={{ 
                        p: 2,
                        mb: 2,
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(211, 153, 34, 0.15) 0%, rgba(227, 179, 65, 0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(211, 153, 34, 0.1) 0%, rgba(227, 179, 65, 0.05) 100%)',
                        border: `1px solid ${isDark ? 'rgba(211, 153, 34, 0.3)' : 'rgba(211, 153, 34, 0.2)'}`,
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <Star sx={{ color: 'warning.main', fontSize: 24 }} />
                        <Typography variant="h5" fontWeight={700} color="warning.main">
                          {project.averageRating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({project.ratingCount} {project.ratingCount === 1 ? 'оценка' : project.ratingCount < 5 ? 'оценки' : 'оценок'})
                        </Typography>
                      </Box>
                    </Paper>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}`);
                      }}
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 2
                      }}
                    >
                      Открыть проект
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default Home;

