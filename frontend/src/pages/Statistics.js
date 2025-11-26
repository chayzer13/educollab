import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Paper,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  People,
  Folder,
  Comment,
  Star,
  Visibility,
  VisibilityOff,
  TrendingUp,
  BarChart,
  Assessment,
  EmojiEvents,
  Timeline
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Statistics = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const { data: generalStats, isLoading: generalLoading } = useQuery(
    'statistics',
    async () => {
      const response = await api.get('/statistics');
      return response.data;
    }
  );

  const { data: userStats, isLoading: userLoading } = useQuery(
    ['statistics', 'user'],
    async () => {
      const response = await api.get('/statistics/user');
      return response.data;
    },
    { enabled: !!user }
  );

  const { data: projectStats, isLoading: projectLoading } = useQuery(
    ['statistics', 'projects'],
    async () => {
      const response = await api.get('/statistics/projects');
      return response.data;
    }
  );

  const { data: teamStats, isLoading: teamLoading } = useQuery(
    ['statistics', 'teams'],
    async () => {
      const response = await api.get('/statistics/teams');
      return response.data;
    }
  );

  if (generalLoading || projectLoading || teamLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Улучшенная карточка статистики с градиентами
  const StatCard = ({ icon, title, value, subtitle, color = 'primary', onClick }) => {
    const gradientColors = {
      primary: isDark ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)' : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
      secondary: isDark ? 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)' : 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)',
      info: isDark ? 'linear-gradient(135deg, #58a6ff 0%, #79c0ff 100%)' : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
      success: isDark ? 'linear-gradient(135deg, #3fb950 0%, #56d364 100%)' : 'linear-gradient(135deg, #1a7f37 0%, #2da44e 100%)',
      warning: isDark ? 'linear-gradient(135deg, #d29922 0%, #e3b341 100%)' : 'linear-gradient(135deg, #9a6700 0%, #bf8700 100%)'
    };

    return (
      <Card 
        sx={{ 
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': onClick ? { 
            transform: 'translateY(-8px)',
            boxShadow: isDark 
              ? '0 12px 24px rgba(0, 0, 0, 0.5), 0 6px 12px rgba(0, 0, 0, 0.3)'
              : '0 12px 24px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)'
          } : {},
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: gradientColors[color],
            opacity: 0.8
          }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ 
              width: 56, 
              height: 56, 
              borderRadius: 2,
              background: gradientColors[color],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isDark 
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              {React.cloneElement(icon, { sx: { fontSize: 28, color: '#ffffff' } })}
            </Box>
            {onClick && (
              <Chip 
                label="Открыть" 
                size="small" 
                sx={{ 
                  fontSize: '0.7rem',
                  height: 20,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                }} 
              />
            )}
          </Box>
          <Typography variant="h3" component="div" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
            {value?.toLocaleString('ru-RU') || 0}
          </Typography>
          <Typography variant="body1" fontWeight={500} color="text.secondary" sx={{ mb: 1 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  // Функция для расчета процентов
  const getPercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const totalProjects = projectStats?.byStatus ? 
    Object.values(projectStats.byStatus).reduce((a, b) => a + b, 0) : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Заголовок с иконкой */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
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
          boxShadow: isDark 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <Assessment sx={{ fontSize: 32, color: '#ffffff' }} />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Статистика платформы
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Обзор активности и метрик EduCollab
          </Typography>
        </Box>
      </Box>

      {/* Общая статистика с улучшенным дизайном */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Folder />}
            title="Проектов"
            value={generalStats?.overview?.totalProjects || 0}
            color="primary"
            onClick={() => navigate('/projects')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<People />}
            title="Команд"
            value={generalStats?.overview?.totalTeams || 0}
            color="secondary"
            onClick={() => navigate('/teams')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<People />}
            title="Пользователей"
            value={generalStats?.overview?.totalUsers || 0}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Comment />}
            title="Комментариев"
            value={generalStats?.overview?.totalComments || 0}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Визуализация распределения проектов по статусам */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: isDark 
                ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                : '0 8px 16px rgba(0, 0, 0, 0.12)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <BarChart sx={{ fontSize: 28, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Распределение проектов по статусам
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Stack spacing={2.5}>
                {projectStats?.byStatus && Object.entries(projectStats.byStatus).map(([status, count]) => {
                  const percentage = getPercentage(count, totalProjects);
                  const statusConfig = {
                    active: { label: 'Активные', color: 'primary', icon: <Timeline /> },
                    completed: { label: 'Завершенные', color: 'success', icon: <EmojiEvents /> },
                    draft: { label: 'Черновики', color: 'default', icon: <Folder /> },
                    archived: { label: 'Архив', color: 'secondary', icon: <Folder /> }
                  };
                  const config = statusConfig[status] || { label: status, color: 'default', icon: <Folder /> };
                  
                  return (
                    <Box key={status}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {React.cloneElement(config.icon, { sx: { fontSize: 18, color: `${config.color}.main` } })}
                          <Typography variant="body2" fontWeight={500}>
                            {config.label}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {count}
                          </Typography>
                          <Chip 
                            label={`${percentage}%`} 
                            size="small" 
                            sx={{ 
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                            }} 
                          />
                        </Box>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={parseFloat(percentage)} 
                        sx={{ 
                          height: 10, 
                          borderRadius: 5,
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            bgcolor: `${config.color}.main`
                          }
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Распределение по видимости */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: isDark 
                ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                : '0 8px 16px rgba(0, 0, 0, 0.12)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Visibility sx={{ fontSize: 28, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Распределение по видимости
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(9, 105, 218, 0.2) 0%, rgba(33, 139, 255, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(9, 105, 218, 0.1) 0%, rgba(33, 139, 255, 0.05) 100%)',
                      border: `2px solid ${isDark ? 'rgba(9, 105, 218, 0.3)' : 'rgba(9, 105, 218, 0.2)'}`,
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <Visibility sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight={700} color="primary" sx={{ mb: 0.5 }}>
                      {projectStats?.byVisibility?.public || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Публичных проектов
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(101, 109, 118, 0.2) 0%, rgba(139, 148, 158, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(101, 109, 118, 0.1) 0%, rgba(139, 148, 158, 0.05) 100%)',
                      border: `2px solid ${isDark ? 'rgba(101, 109, 118, 0.3)' : 'rgba(101, 109, 118, 0.2)'}`,
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: 'secondary.main'
                      }
                    }}
                  >
                    <VisibilityOff sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight={700} color="secondary" sx={{ mb: 0.5 }}>
                      {projectStats?.byVisibility?.private || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Закрытых проектов
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Топ проектов */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: isDark 
                ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                : '0 8px 16px rgba(0, 0, 0, 0.12)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <EmojiEvents sx={{ fontSize: 28, color: 'warning.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Топ проектов по рейтингу
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {projectStats?.topRated && projectStats.topRated.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {projectStats.topRated.slice(0, 5).map((project, index) => (
                    <ListItem 
                      key={project.id} 
                      sx={{ 
                        px: 0,
                        py: 1.5,
                        mb: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: 'transparent',
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          transform: 'translateX(4px)'
                        }
                      }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'secondary.main' : index === 2 ? 'info.main' : 'default',
                          width: 32,
                          height: 32,
                          mr: 2,
                          fontWeight: 700,
                          fontSize: '0.875rem'
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                              {project.title}
                            </Typography>
                            <Chip
                              icon={<Star sx={{ fontSize: 16 }} />}
                              label={project.averageRating}
                              size="small"
                              color="warning"
                              sx={{ height: 24 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {project.ratingCount} {project.ratingCount === 1 ? 'оценка' : project.ratingCount < 5 ? 'оценки' : 'оценок'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Пока нет проектов с рейтингами
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Топ команд */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: isDark 
                ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                : '0 8px 16px rgba(0, 0, 0, 0.12)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <People sx={{ fontSize: 28, color: 'secondary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Топ команд по проектам
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {teamStats?.topByProjects && teamStats.topByProjects.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {teamStats.topByProjects.slice(0, 5).map((team, index) => (
                    <ListItem 
                      key={team.id} 
                      sx={{ 
                        px: 0,
                        py: 1.5,
                        mb: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: 'transparent',
                        '&:hover': { 
                          bgcolor: 'action.hover',
                          transform: 'translateX(4px)'
                        }
                      }}
                      onClick={() => navigate(`/teams/${team.id}`)}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'secondary.main' : index === 2 ? 'info.main' : 'default',
                          width: 32,
                          height: 32,
                          mr: 2,
                          fontWeight: 700,
                          fontSize: '0.875rem'
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {team.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {team.projectCount} {team.projectCount === 1 ? 'проект' : team.projectCount < 5 ? 'проекта' : 'проектов'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Пока нет команд с проектами
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Общая информация */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: isDark 
                ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                : '0 8px 16px rgba(0, 0, 0, 0.12)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <TrendingUp sx={{ fontSize: 28, color: 'success.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Общая информация
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Stack spacing={2}>
                <Paper 
                  sx={{ 
                    p: 2.5,
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(211, 153, 34, 0.15) 0%, rgba(227, 179, 65, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(211, 153, 34, 0.1) 0%, rgba(227, 179, 65, 0.05) 100%)',
                    border: `1px solid ${isDark ? 'rgba(211, 153, 34, 0.3)' : 'rgba(211, 153, 34, 0.2)'}`,
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Средний рейтинг проектов
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star sx={{ color: 'warning.main' }} />
                        <Typography variant="h5" fontWeight={700} color="warning.main">
                          {generalStats?.ratings?.average || '0.00'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      icon={<Star />}
                      label={`${generalStats?.ratings?.total || 0} оценок`}
                      size="small"
                      color="warning"
                      sx={{ height: 28 }}
                    />
                  </Box>
                </Paper>
                <Paper 
                  sx={{ 
                    p: 2.5,
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(9, 105, 218, 0.15) 0%, rgba(33, 139, 255, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(9, 105, 218, 0.1) 0%, rgba(33, 139, 255, 0.05) 100%)',
                    border: `1px solid ${isDark ? 'rgba(9, 105, 218, 0.3)' : 'rgba(9, 105, 218, 0.2)'}`,
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Новых проектов (30 дней)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp sx={{ color: 'success.main' }} />
                        <Typography variant="h5" fontWeight={700} color="primary">
                          {generalStats?.projects?.recent || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
                <Paper 
                  sx={{ 
                    p: 2.5,
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(101, 109, 118, 0.15) 0%, rgba(139, 148, 158, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(101, 109, 118, 0.1) 0%, rgba(139, 148, 158, 0.05) 100%)',
                    border: `1px solid ${isDark ? 'rgba(101, 109, 118, 0.3)' : 'rgba(101, 109, 118, 0.2)'}`,
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Новых команд (30 дней)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People sx={{ color: 'info.main' }} />
                        <Typography variant="h5" fontWeight={700} color="secondary">
                          {generalStats?.teams?.recent || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Статистика пользователя */}
        {user && !userLoading && userStats && (
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: isDark 
                  ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                  : '0 8px 16px rgba(0, 0, 0, 0.12)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: isDark
                        ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'
                        : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      boxShadow: isDark 
                        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                        : '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {user.firstName?.[0]}
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    Ваша статистика
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Stack spacing={2.5}>
                  {/* Проекты */}
                  <Paper 
                    sx={{ 
                      p: 2.5,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(9, 105, 218, 0.15) 0%, rgba(33, 139, 255, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(9, 105, 218, 0.1) 0%, rgba(33, 139, 255, 0.05) 100%)',
                      border: `1px solid ${isDark ? 'rgba(9, 105, 218, 0.3)' : 'rgba(9, 105, 218, 0.2)'}`,
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isDark 
                          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                          : '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Folder sx={{ fontSize: 24, color: 'primary.main' }} />
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                        Проекты
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: '100px' }}>
                        <Typography variant="h4" fontWeight={700} color="primary">
                          {userStats.projects?.total || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Всего
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: '100px' }}>
                        <Typography variant="h4" fontWeight={700} color="primary.main">
                          {userStats.projects?.active || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Активные
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: '100px' }}>
                        <Typography variant="h4" fontWeight={700} color="success.main">
                          {userStats.projects?.completed || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Завершенные
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Команды */}
                  <Paper 
                    sx={{ 
                      p: 2.5,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(101, 109, 118, 0.15) 0%, rgba(139, 148, 158, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(101, 109, 118, 0.1) 0%, rgba(139, 148, 158, 0.05) 100%)',
                      border: `1px solid ${isDark ? 'rgba(101, 109, 118, 0.3)' : 'rgba(101, 109, 118, 0.2)'}`,
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isDark 
                          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                          : '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <People sx={{ fontSize: 24, color: 'secondary.main' }} />
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                        Команды
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: '100px' }}>
                        <Typography variant="h4" fontWeight={700} color="secondary">
                          {userStats.teams?.total || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Всего
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: '100px' }}>
                        <Typography variant="h4" fontWeight={700} color="primary.main">
                          {userStats.teams?.asLeader || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Как лидер
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: '100px' }}>
                        <Typography variant="h4" fontWeight={700} color="secondary.main">
                          {userStats.teams?.asMember || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Как участник
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Активность */}
                  <Paper 
                    sx={{ 
                      p: 2.5,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(63, 185, 80, 0.15) 0%, rgba(86, 211, 100, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(26, 127, 55, 0.1) 0%, rgba(45, 164, 78, 0.05) 100%)',
                      border: `1px solid ${isDark ? 'rgba(63, 185, 80, 0.3)' : 'rgba(26, 127, 55, 0.2)'}`,
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isDark 
                          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                          : '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <TrendingUp sx={{ fontSize: 24, color: 'success.main' }} />
                      <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                        Активность
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: '120px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Comment sx={{ fontSize: 20, color: 'success.main' }} />
                          <Typography variant="h5" fontWeight={700} color="success.main">
                            {userStats.activity?.comments || 0}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Комментариев
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: '120px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Star sx={{ fontSize: 20, color: 'warning.main' }} />
                          <Typography variant="h5" fontWeight={700} color="warning.main">
                            {userStats.activity?.ratings || 0}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Оценок
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Statistics;
