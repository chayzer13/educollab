import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Divider,
  Badge
} from '@mui/material';
import {
  Folder,
  People,
  AccessTime,
  Circle,
  ArrowBack,
  Person
} from '@mui/icons-material';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { format, formatDistanceToNow } from 'date-fns';
import ru from 'date-fns/locale/ru';
import { getAvatarUrl } from '../utils/avatar';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  // Логирование для отладки
  React.useEffect(() => {
    console.log('UserDetail mounted with id:', id);
  }, [id]);

  const { data: user, isLoading, error } = useQuery(
    ['user', id],
    async () => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    {
      enabled: !!id,
      retry: 1,
      onError: (err) => {
        console.error('Error fetching user:', err);
      }
    }
  );

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Ошибка при загрузке профиля
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error.response?.data?.message || error.message || 'Неизвестная ошибка'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/users')}
            sx={{ textTransform: 'none' }}
          >
            Вернуться к списку пользователей
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Пользователь не найден
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/users')}
            sx={{ mt: 2, textTransform: 'none' }}
          >
            Вернуться к списку пользователей
          </Button>
        </Paper>
      </Container>
    );
  }

  // Определяем статус онлайн/офлайн
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const isOnline = user.lastActivity ? new Date(user.lastActivity) > fiveMinutesAgo : false;

  const getRoleLabel = (role) => {
    const labels = {
      student: 'Студент',
      teacher: 'Преподаватель',
      mentor: 'Ментор',
      admin: 'Администратор'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      student: 'default',
      teacher: 'primary',
      mentor: 'secondary',
      admin: 'primary'
    };
    return colors[role] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/users')}
        sx={{ mb: 3, textTransform: 'none', fontWeight: 500 }}
      >
        Назад к списку пользователей
      </Button>

      {/* Градиентный баннер профиля */}
      <Paper 
        sx={{ 
          mb: 4,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          background: isDark 
            ? 'linear-gradient(135deg, #0969da 0%, #218bff 50%, #0969da 100%)'
            : 'linear-gradient(135deg, #0969da 0%, #218bff 50%, #0969da 100%)',
          boxShadow: isDark 
            ? '0 8px 24px rgba(0, 0, 0, 0.4)'
            : '0 8px 24px rgba(9, 105, 218, 0.2)'
        }}
      >
        <Box sx={{ 
          p: 4,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark 
              ? 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
            pointerEvents: 'none'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <Box sx={{ position: 'relative', mr: 3 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Circle
                    sx={{
                      color: isOnline ? '#3fb950' : '#8b949e',
                      fontSize: 18,
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%',
                      border: '3px solid',
                      borderColor: isDark ? '#0969da' : '#0969da',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                }
              >
                <Avatar
                  src={getAvatarUrl(user.avatar)}
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '3rem',
                    fontWeight: 700,
                    background: user.avatar ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {!user.avatar && user.firstName?.[0]}
                </Avatar>
              </Badge>
            </Box>
            <Box sx={{ flex: 1, color: 'white' }}>
              <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mb: 1, textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.95, textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)' }}>
                {user.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  label={getRoleLabel(user.role)}
                  size="small"
                  sx={{ 
                    height: 28, 
                    fontWeight: 600,
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    ...(user.role === 'admin' && {
                      bgcolor: 'rgba(207, 34, 46, 0.9)',
                      border: '1px solid rgba(207, 34, 46, 1)',
                      '&:hover': {
                        bgcolor: 'rgba(164, 14, 38, 0.95)'
                      }
                    })
                  }}
                />
                <Chip
                  icon={<Circle sx={{ fontSize: 10, color: isOnline ? '#3fb950' : '#8b949e' }} />}
                  label={isOnline ? 'Онлайн' : 'Офлайн'}
                  size="small"
                  sx={{
                    height: 28,
                    fontWeight: 600,
                    bgcolor: isOnline
                      ? 'rgba(63, 185, 80, 0.3)'
                      : 'rgba(139, 148, 158, 0.3)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isOnline ? 'rgba(63, 185, 80, 0.5)' : 'rgba(139, 148, 158, 0.5)'}`
                  }}
                />
                {user.lastActivity && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.9 }}>
                    <AccessTime sx={{ fontSize: 16, color: 'white' }} />
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                      {isOnline
                        ? 'Активен сейчас'
                        : `Был в сети ${formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true, locale: ru })}`
                      }
                    </Typography>
                  </Box>
                )}
                {user.createdAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.9 }}>
                    <AccessTime sx={{ fontSize: 16, color: 'white' }} />
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ru })}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper 
        sx={{ 
          p: 4,
          borderRadius: 3,
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: isDark 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        {user.bio && (
          <Box sx={{ 
            mb: 4, 
            p: 3, 
            borderRadius: 2,
            background: isDark 
              ? 'linear-gradient(135deg, rgba(9, 105, 218, 0.1) 0%, rgba(33, 139, 255, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(9, 105, 218, 0.05) 0%, rgba(33, 139, 255, 0.02) 100%)',
            border: `1px solid ${isDark ? 'rgba(9, 105, 218, 0.2)' : 'rgba(9, 105, 218, 0.1)'}`
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 24, color: 'primary.main' }} />
              О себе
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>{user.bio}</Typography>
          </Box>
        )}

        {/* Статистика с улучшенным дизайном */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper 
              sx={{ 
                p: 3,
                textAlign: 'center',
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(9, 105, 218, 0.2) 0%, rgba(33, 139, 255, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(9, 105, 218, 0.15) 0%, rgba(33, 139, 255, 0.1) 100%)',
                border: `1px solid ${isDark ? 'rgba(9, 105, 218, 0.4)' : 'rgba(9, 105, 218, 0.3)'}`,
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #0969da 0%, #218bff 100%)',
                  opacity: 0.8
                },
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: isDark 
                    ? '0 12px 24px rgba(9, 105, 218, 0.4)'
                    : '0 12px 24px rgba(9, 105, 218, 0.2)'
                }
              }}
            >
              <Box sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 4px 12px rgba(9, 105, 218, 0.3)'
              }}>
                <Folder sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="primary" sx={{ mb: 0.5 }}>
                {user.projects?.length || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary" fontWeight={600}>
                Проектов
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper 
              sx={{ 
                p: 3,
                textAlign: 'center',
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(101, 109, 118, 0.2) 0%, rgba(139, 148, 158, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(101, 109, 118, 0.15) 0%, rgba(139, 148, 158, 0.1) 100%)',
                border: `1px solid ${isDark ? 'rgba(101, 109, 118, 0.4)' : 'rgba(101, 109, 118, 0.3)'}`,
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)',
                  opacity: 0.8
                },
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: isDark 
                    ? '0 12px 24px rgba(101, 109, 118, 0.4)'
                    : '0 12px 24px rgba(101, 109, 118, 0.2)'
                }
              }}
            >
              <Box sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 4px 12px rgba(101, 109, 118, 0.3)'
              }}>
                <People sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h3" fontWeight={700} color="secondary" sx={{ mb: 0.5 }}>
                {user.teams?.length || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary" fontWeight={600}>
                Команд
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper 
              sx={{ 
                p: 3,
                textAlign: 'center',
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(63, 185, 80, 0.2) 0%, rgba(86, 211, 100, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(26, 127, 55, 0.15) 0%, rgba(45, 164, 78, 0.1) 100%)',
                border: `1px solid ${isDark ? 'rgba(63, 185, 80, 0.4)' : 'rgba(26, 127, 55, 0.3)'}`,
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                },
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: isDark 
                    ? '0 12px 24px rgba(63, 185, 80, 0.4)'
                    : '0 12px 24px rgba(26, 127, 55, 0.2)'
                }
              }}
            >
              <Box sx={{ 
                width: 64, 
                height: 64, 
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
                  ? '0 4px 12px rgba(63, 185, 80, 0.3)'
                  : '0 4px 12px rgba(26, 127, 55, 0.3)'
              }}>
                <Person sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="success.main" sx={{ mb: 0.5 }}>
                {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ru }) : '-'}
              </Typography>
              <Typography variant="body1" color="text.secondary" fontWeight={600}>
                Дата регистрации
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Проекты пользователя */}
        {user.projects && user.projects.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Folder sx={{ fontSize: 28, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>
                Проекты ({user.projects.length})
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {user.projects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
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
                      <Typography variant="h6" fontWeight={600} gutterBottom sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {project.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={project.status === 'draft' ? 'Черновик' : project.status === 'active' ? 'Активный' : project.status === 'completed' ? 'Завершен' : 'Архив'}
                          size="small"
                          color={project.status === 'active' ? 'primary' : project.status === 'completed' ? 'success' : 'default'}
                          sx={{ height: 24, fontWeight: 500 }}
                        />
                        {project.progress !== undefined && (
                          <Chip 
                            label={`Прогресс: ${project.progress}%`} 
                            size="small"
                            sx={{ height: 24, fontWeight: 500 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: ru })}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        {/* Команды пользователя */}
        {user.teams && user.teams.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <People sx={{ fontSize: 28, color: 'secondary.main' }} />
              <Typography variant="h6" fontWeight={600}>
                Команды ({user.teams.length})
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {user.teams.map((team) => (
                <Grid item xs={12} sm={6} md={4} key={team.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
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
                        background: team.visibility === 'public'
                          ? (isDark ? 'linear-gradient(90deg, #0969da 0%, #218bff 100%)' : 'linear-gradient(90deg, #0969da 0%, #218bff 100%)')
                          : (isDark ? 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)' : 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)'),
                        opacity: 0.8
                      }
                    }}
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    <CardContent sx={{ p: 3, flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {team.name}
                      </Typography>
                      {team.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {team.description}
                        </Typography>
                      )}
                      {team.leader && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            Лидер: {team.leader.firstName} {team.leader.lastName}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true, locale: ru })}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UserDetail;

