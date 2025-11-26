import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Folder,
  People,
  Person,
  AccessTime,
  Visibility,
  VisibilityOff,
  Settings,
  PhotoCamera
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import ru from 'date-fns/locale/ru';
import { getAvatarUrl } from '../utils/avatar';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDark = mode === 'dark';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl(user?.avatar));

  const { data: userProjects } = useQuery(
    ['userProjects', user?.id],
    async () => {
      if (!user?.id) return [];
      const response = await api.get('/projects', { params: { ownerId: user.id } });
      return response.data;
    },
    { enabled: !!user?.id }
  );

  const { data: userTeams } = useQuery(
    ['userTeams', user?.id],
    async () => {
      if (!user?.id) return [];
      const response = await api.get('/users/me/teams');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  const deleteProjectMutation = useMutation(
    (projectId) => api.delete(`/projects/${projectId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProjects', user?.id]);
        queryClient.invalidateQueries('projects');
        queryClient.refetchQueries(['userProjects', user?.id]); // Принудительно обновляем
        queryClient.refetchQueries('projects'); // Принудительно обновляем
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при удалении проекта');
      }
    }
  );

  const archiveProjectMutation = useMutation(
    (projectId) => api.post(`/projects/${projectId}/archive`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProjects', user?.id]);
        queryClient.invalidateQueries('projects');
        queryClient.refetchQueries(['userProjects', user?.id]);
        alert('Проект успешно архивирован');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при архивировании проекта');
      }
    }
  );

  const unarchiveProjectMutation = useMutation(
    (projectId) => api.post(`/projects/${projectId}/unarchive`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProjects', user?.id]);
        queryClient.invalidateQueries('projects');
        queryClient.refetchQueries(['userProjects', user?.id]);
        alert('Проект успешно разархивирован');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при разархивировании проекта');
      }
    }
  );

  const deleteTeamMutation = useMutation(
    (teamId) => api.delete(`/teams/${teamId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userTeams', user?.id]);
        queryClient.invalidateQueries('teams');
        queryClient.refetchQueries(['userTeams', user?.id]); // Принудительно обновляем
        queryClient.refetchQueries('teams'); // Принудительно обновляем
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при удалении команды');
      }
    }
  );

  const leaveTeamMutation = useMutation(
    (teamId) => api.post(`/teams/${teamId}/leave`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userTeams', user?.id]);
        queryClient.invalidateQueries('teams');
        queryClient.refetchQueries(['userTeams', user?.id]);
        queryClient.refetchQueries('teams');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при выходе из команды');
      }
    }
  );

  const [deleteAccountEmail, setDeleteAccountEmail] = useState('');

  const deleteAccountMutation = useMutation(
    () => api.delete('/users/me'),
    {
      onSuccess: () => {
        logout();
        localStorage.removeItem('token');
        navigate('/');
        alert('Ваш аккаунт был успешно удален');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при удалении аккаунта');
        setDeleteAccountEmail('');
      }
    }
  );

  const handleDeleteAccount = () => {
    if (deleteAccountEmail !== user?.email) {
      alert('Email не совпадает. Пожалуйста, введите ваш email для подтверждения.');
      return;
    }
    if (window.confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие нельзя отменить. Все ваши данные будут безвозвратно удалены.')) {
      deleteAccountMutation.mutate();
    }
  };

  const updateProfileMutation = useMutation(
    (data) => api.put('/users/me', data),
    {
      onSuccess: (response) => {
        setUser(response.data);
        queryClient.invalidateQueries(['userProjects', user?.id]);
        setSettingsOpen(false);
        alert('Профиль успешно обновлен');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при обновлении профиля');
      }
    }
  );

  const uploadAvatarMutation = useMutation(
    (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    {
      onSuccess: (response) => {
        const updatedUser = response.data;
        setUser(updatedUser);
        // Обновляем preview с новым путем к аватару (используем getAvatarUrl для правильного URL)
        setAvatarPreview(getAvatarUrl(updatedUser.avatar));
        setAvatarFile(null);
        alert('Аватар успешно загружен');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при загрузке аватара');
      }
    }
  );

  React.useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || ''
      });
      setAvatarPreview(getAvatarUrl(user.avatar));
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleSaveAvatar = () => {
    if (avatarFile) {
      uploadAvatarMutation.mutate(avatarFile);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box sx={{ position: 'relative', mr: 3 }}>
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
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid',
                    borderColor: isDark ? '#0969da' : '#0969da',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      bgcolor: 'rgba(255, 255, 255, 1)'
                    }
                  }}
                  onClick={() => setSettingsOpen(true)}
                >
                  <PhotoCamera sx={{ fontSize: 18, color: '#0969da' }} />
                </Box>
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
                    label={user.role === 'student' ? 'Студент' : user.role === 'teacher' ? 'Преподаватель' : user.role === 'admin' ? 'Администратор' : 'Ментор'}
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
            <Button
              variant="contained"
              startIcon={<Settings />}
              onClick={() => setSettingsOpen(true)}
              sx={{ 
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              Настройки
            </Button>
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
                {userProjects?.length || 0}
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
                {userTeams?.length || 0}
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

        {/* Проекты */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Folder sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Мои проекты ({userProjects?.length || 0})
            </Typography>
          </Box>
          {userProjects && userProjects.length > 0 ? (
            <Grid container spacing={3}>
              {userProjects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
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
                          label={project.status === 'draft' ? 'Черновик' : project.status === 'active' ? 'Активный' : project.status === 'completed' ? 'Завершен' : 'Архив'}
                          size="small"
                          color={project.status === 'active' ? 'primary' : project.status === 'completed' ? 'success' : project.status === 'archived' ? 'default' : 'default'}
                          sx={{ 
                            height: 24, 
                            fontWeight: 500,
                            ...(project.status === 'archived' && {
                              bgcolor: isDark ? 'rgba(139, 148, 158, 0.2)' : 'rgba(139, 148, 158, 0.1)',
                              color: isDark ? '#8b949e' : '#656d76'
                            })
                          }}
                        />
                        <Chip
                          icon={project.visibility === 'public' ? <Visibility sx={{ fontSize: 14 }} /> : <VisibilityOff sx={{ fontSize: 14 }} />}
                          label={project.visibility === 'public' ? 'Публичный' : 'Закрытый'}
                          size="small"
                          color={project.visibility === 'public' ? 'default' : 'secondary'}
                          sx={{ height: 24, fontWeight: 500 }}
                        />
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
                    <CardActions sx={{ p: 2, pt: 0, gap: 1, flexDirection: 'column' }}>
                      <Button
                        size="small"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        variant="contained"
                        fullWidth
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                      >
                        Открыть
                      </Button>
                      {(project.ownerId === user?.id || user?.role === 'teacher' || user?.role === 'admin') && (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                          {project.status === 'archived' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => {
                                if (window.confirm('Вы уверены, что хотите разархивировать этот проект?')) {
                                  unarchiveProjectMutation.mutate(project.id);
                                }
                              }}
                              disabled={unarchiveProjectMutation.isLoading}
                              sx={{ textTransform: 'none', fontWeight: 500, flex: 1 }}
                            >
                              Разархивировать
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => {
                                if (window.confirm('Вы уверены, что хотите архивировать этот проект?')) {
                                  archiveProjectMutation.mutate(project.id);
                                }
                              }}
                              disabled={archiveProjectMutation.isLoading}
                              sx={{ textTransform: 'none', fontWeight: 500, flex: 1 }}
                            >
                              Архивировать
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (window.confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
                                deleteProjectMutation.mutate(project.id);
                              }
                            }}
                            disabled={deleteProjectMutation.isLoading}
                            sx={{ 
                              border: `1px solid ${isDark ? 'rgba(248, 81, 73, 0.3)' : 'rgba(207, 34, 46, 0.2)'}`,
                              '&:hover': {
                                bgcolor: isDark ? 'rgba(248, 81, 73, 0.1)' : 'rgba(207, 34, 46, 0.05)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                borderRadius: 2,
                background: isDark 
                  ? 'rgba(255, 255, 255, 0.02)'
                  : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
              }}
            >
              <Folder sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                У вас пока нет проектов
              </Typography>
            </Paper>
          )}
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Команды */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <People sx={{ fontSize: 28, color: 'secondary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Мои команды ({userTeams?.length || 0})
            </Typography>
          </Box>
          {userTeams && userTeams.length > 0 ? (
            <Grid container spacing={3}>
              {userTeams.map((team) => {
                const isLeader = team.leaderId === user?.id;
                const memberCount = team.members?.length || 0;
                const memberPercentage = (memberCount / team.maxMembers) * 100;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={team.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
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
                          background: team.visibility === 'public' 
                            ? (isDark ? 'linear-gradient(90deg, #0969da 0%, #218bff 100%)' : 'linear-gradient(90deg, #0969da 0%, #218bff 100%)')
                            : (isDark ? 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)' : 'linear-gradient(90deg, #656d76 0%, #8b949e 100%)'),
                          opacity: 0.8
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" fontWeight={600} sx={{ 
                            flex: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {team.name}
                          </Typography>
                          {team.visibility === 'private' && (
                            <VisibilityOff sx={{ fontSize: 20, color: 'text.secondary', ml: 1, flexShrink: 0 }} />
                          )}
                        </Box>
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
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                Участников
                              </Typography>
                            </Box>
                            <Typography variant="caption" fontWeight={600} color="primary">
                              {memberCount}/{team.maxMembers}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={memberPercentage} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                            }}
                            color={memberPercentage >= 100 ? 'error' : 'primary'}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          {isLeader && (
                            <Chip 
                              label="Лидер" 
                              size="small" 
                              color="primary"
                              sx={{ height: 24, fontWeight: 500 }}
                            />
                          )}
                          {team.projects && team.projects.length > 0 && (
                            <Chip
                              icon={<Folder sx={{ fontSize: 14 }} />}
                              label={`${team.projects.length} ${team.projects.length === 1 ? 'проект' : team.projects.length < 5 ? 'проекта' : 'проектов'}`}
                              size="small"
                              color="secondary"
                              sx={{ height: 24, fontWeight: 500 }}
                            />
                          )}
                          {team.visibility && (
                            <Chip
                              icon={team.visibility === 'public' ? <Visibility sx={{ fontSize: 14 }} /> : <VisibilityOff sx={{ fontSize: 14 }} />}
                              label={team.visibility === 'public' ? 'Публичная' : 'Закрытая'}
                              size="small"
                              color={team.visibility === 'public' ? 'default' : 'secondary'}
                              sx={{ height: 24, fontWeight: 500 }}
                            />
                          )}
                        </Box>
                        <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true, locale: ru })}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => navigate(`/teams/${team.id}`)}
                          variant="contained"
                          fullWidth
                          sx={{ textTransform: 'none', fontWeight: 500 }}
                        >
                          Открыть
                        </Button>
                        {isLeader && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (window.confirm('Вы уверены, что хотите удалить эту команду? Это действие нельзя отменить.')) {
                                deleteTeamMutation.mutate(team.id);
                              }
                            }}
                            disabled={deleteTeamMutation.isLoading}
                            sx={{ 
                              border: `1px solid ${isDark ? 'rgba(248, 81, 73, 0.3)' : 'rgba(207, 34, 46, 0.2)'}`,
                              '&:hover': {
                                bgcolor: isDark ? 'rgba(248, 81, 73, 0.1)' : 'rgba(207, 34, 46, 0.05)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                        {!isLeader && (
                          <Button
                            size="small"
                            color="warning"
                            variant="outlined"
                            onClick={() => {
                              if (window.confirm('Вы уверены, что хотите покинуть эту команду?')) {
                                leaveTeamMutation.mutate(team.id);
                              }
                            }}
                            disabled={leaveTeamMutation.isLoading}
                            fullWidth
                            sx={{ textTransform: 'none', fontWeight: 500 }}
                          >
                            Покинуть
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                borderRadius: 2,
                background: isDark 
                  ? 'rgba(255, 255, 255, 0.02)'
                  : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
              }}
            >
              <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                Вы пока не состоите ни в одной команде
              </Typography>
            </Paper>
          )}
        </Box>
      </Paper>

      {/* Диалог настроек */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 3,
          pb: 2,
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              background: isDark 
                ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'
                : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(9, 105, 218, 0.3)'
            }}>
              <Settings sx={{ fontSize: 22, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Настройки профиля
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Управление личными данными
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, pt: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)} 
              variant="fullWidth"
              sx={{ 
                mb: 0,
                minHeight: 56,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  minHeight: 56,
                  '&.Mui-selected': {
                    color: 'primary.main',
                    fontWeight: 600
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab label="Основная информация" icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="Аватар" icon={<PhotoCamera sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab 
                label="Опасная зона" 
                icon={<DeleteIcon sx={{ fontSize: 18 }} />} 
                iconPosition="start"
                sx={{ 
                  color: tabValue === 2 ? 'error.main' : 'text.secondary',
                  '&.Mui-selected': {
                    color: 'error.main'
                  }
                }}
              />
            </Tabs>
          </Box>
          <Divider />

          {tabValue === 0 && (
            <Box sx={{ px: 3, py: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  ЛИЧНАЯ ИНФОРМАЦИЯ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Обновите ваши личные данные
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Имя"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Фамилия"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="О себе"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  multiline
                  rows={4}
                  placeholder="Расскажите о себе..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ px: 3, py: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  АВАТАР ПРОФИЛЯ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Загрузите новое изображение для вашего профиля
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={avatarPreview || getAvatarUrl(user.avatar)}
                    sx={{
                      width: 140,
                      height: 140,
                      fontSize: '3.5rem',
                      fontWeight: 700,
                      background: avatarPreview || user.avatar ? 'transparent' : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
                      border: `3px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      boxShadow: isDark 
                        ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                        : '0 4px 16px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {!avatarPreview && !user.avatar && user.firstName?.[0]}
                  </Avatar>
                  {avatarPreview && (
                    <Chip
                      icon={<PhotoCamera sx={{ fontSize: 16 }} />}
                      label="Новое"
                      size="small"
                      color="success"
                      sx={{
                        position: 'absolute',
                        bottom: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCamera />}
                    sx={{ 
                      textTransform: 'none', 
                      fontWeight: 600,
                      py: 1.5,
                      borderRadius: 2,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2
                      }
                    }}
                  >
                    {avatarFile ? 'Выбрать другое фото' : 'Выбрать фото'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </Button>
                  {avatarFile && (
                    <Box 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                        {avatarFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Размер: {(avatarFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ px: 3, py: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="error" sx={{ mb: 1, fontWeight: 600 }}>
                  ОПАСНАЯ ЗОНА
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Необратимые действия с вашим аккаунтом
                </Typography>
              </Box>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2,
                border: `1px solid ${isDark ? 'rgba(207, 34, 46, 0.3)' : 'rgba(207, 34, 46, 0.2)'}`,
                bgcolor: isDark ? 'rgba(207, 34, 46, 0.05)' : 'rgba(207, 34, 46, 0.02)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    background: 'linear-gradient(135deg, #cf222e 0%, #a40e26 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <DeleteIcon sx={{ fontSize: 22, color: 'white' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" color="error" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Удаление аккаунта
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      После удаления все ваши данные будут безвозвратно удалены
                    </Typography>
                  </Box>
                </Box>
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      fontSize: 24
                    }
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    Это действие нельзя отменить
                  </Typography>
                  <Typography variant="body2">
                    Все проекты, команды, комментарии и оценки будут удалены навсегда.
                  </Typography>
                </Alert>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
                    Для подтверждения введите ваш email:
                  </Typography>
                  <Chip 
                    label={user?.email} 
                    sx={{ 
                      mb: 2,
                      height: 32,
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Email для подтверждения"
                    value={deleteAccountEmail}
                    onChange={(e) => setDeleteAccountEmail(e.target.value)}
                    placeholder={user?.email}
                    error={deleteAccountEmail !== '' && deleteAccountEmail !== user?.email}
                    helperText={deleteAccountEmail !== '' && deleteAccountEmail !== user?.email ? 'Email не совпадает' : ''}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountEmail !== user?.email || deleteAccountMutation.isLoading}
                  startIcon={<DeleteIcon />}
                  fullWidth
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  {deleteAccountMutation.isLoading ? 'Удаление...' : 'Удалить аккаунт'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ 
          p: 2.5, 
          gap: 1.5
        }}>
          <Button
            onClick={() => {
              setSettingsOpen(false);
              setTabValue(0);
              setAvatarFile(null);
              setAvatarPreview(null);
              setDeleteAccountEmail('');
            }}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 500,
              borderRadius: 2,
              px: 3
            }}
          >
            Отмена
          </Button>
          {tabValue === 0 ? (
            <Button
              onClick={handleSaveProfile}
              variant="contained"
              disabled={updateProfileMutation.isLoading}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                borderRadius: 2,
                px: 4
              }}
            >
              {updateProfileMutation.isLoading ? <CircularProgress size={20} color="inherit" /> : 'Сохранить'}
            </Button>
          ) : tabValue === 1 ? (
            <Button
              onClick={handleSaveAvatar}
              variant="contained"
              disabled={!avatarFile || uploadAvatarMutation.isLoading}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                borderRadius: 2,
                px: 4
              }}
            >
              {uploadAvatarMutation.isLoading ? <CircularProgress size={20} color="inherit" /> : 'Загрузить'}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;

