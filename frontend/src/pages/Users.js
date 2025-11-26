import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Avatar,
  Chip,
  MenuItem,
  Paper,
  Badge
} from '@mui/material';
import {
  People,
  Search,
  FilterList,
  Circle,
  AccessTime
} from '@mui/icons-material';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { format, formatDistanceToNow } from 'date-fns';
import ru from 'date-fns/locale/ru';
import { getAvatarUrl } from '../utils/avatar';

const Users = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { mode } = useTheme();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const { data: users, isLoading } = useQuery(
    ['users', search, roleFilter],
    async () => {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const response = await api.get('/users', { params });
      return response.data;
    },
    {
      refetchInterval: 30000 // Обновлять каждые 30 секунд для актуального статуса
    }
  );

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

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Градиентный заголовок */}
      <Paper 
        sx={{ 
          mb: 4,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          background: isDark 
            ? 'linear-gradient(135deg, #656d76 0%, #8b949e 50%, #656d76 100%)'
            : 'linear-gradient(135deg, #656d76 0%, #8b949e 50%, #656d76 100%)',
          boxShadow: isDark 
            ? '0 8px 24px rgba(0, 0, 0, 0.4)'
            : '0 8px 24px rgba(101, 109, 118, 0.2)'
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1, color: 'white' }}>
            <Box sx={{ 
              width: 64, 
              height: 64, 
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}>
              <People sx={{ fontSize: 32, color: '#ffffff' }} />
            </Box>
            <Box>
              <Typography variant="h3" component="h1" fontWeight={700} sx={{ mb: 1, textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>
                Пользователи
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)' }}>
                Список всех пользователей платформы
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Фильтры */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 3,
          background: isDark 
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: isDark 
            ? '0 2px 8px rgba(0, 0, 0, 0.2)'
            : '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              placeholder="Поиск по имени, фамилии или email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Роль"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              InputProps={{
                startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
              <MenuItem value="">Все роли</MenuItem>
              <MenuItem value="student">Студент</MenuItem>
              <MenuItem value="teacher">Преподаватель</MenuItem>
              <MenuItem value="mentor">Ментор</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Список пользователей */}
      {users && users.length > 0 ? (
        <Grid container spacing={3}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  boxShadow: isDark 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDark 
                      ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                      : '0 8px 16px rgba(0, 0, 0, 0.12)'
                  }
                }}
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Circle 
                          sx={{ 
                            color: user.isOnline ? '#3fb950' : '#8b949e',
                            fontSize: 12,
                            bgcolor: 'background.paper',
                            borderRadius: '50%',
                            border: `2px solid ${isDark ? '#161b22' : '#ffffff'}`
                          }} 
                        />
                      }
                    >
                      <Avatar
                        src={getAvatarUrl(user.avatar)}
                        sx={{
                          width: 64,
                          height: 64,
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          background: user.avatar ? 'transparent' : (isDark
                            ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'
                            : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'),
                          boxShadow: isDark 
                            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                            : '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {!user.avatar && user.firstName?.[0]}
                      </Avatar>
                    </Badge>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {user.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip
                          label={getRoleLabel(user.role)}
                          size="small"
                          color={getRoleColor(user.role)}
                          sx={{ 
                            height: 24, 
                            fontWeight: 500,
                            ...(user.role === 'admin' && {
                              bgcolor: '#cf222e',
                              color: '#ffffff',
                              '&:hover': {
                                bgcolor: '#a40e26'
                              }
                            })
                          }}
                        />
                        <Chip
                          icon={<Circle sx={{ fontSize: 8, color: user.isOnline ? '#3fb950' : '#8b949e' }} />}
                          label={user.isOnline ? 'Онлайн' : 'Офлайн'}
                          size="small"
                          sx={{ 
                            height: 24, 
                            fontWeight: 500,
                            bgcolor: user.isOnline 
                              ? (isDark ? 'rgba(63, 185, 80, 0.15)' : 'rgba(63, 185, 80, 0.1)')
                              : (isDark ? 'rgba(139, 148, 158, 0.15)' : 'rgba(139, 148, 158, 0.1)'),
                            color: user.isOnline ? '#3fb950' : '#8b949e',
                            border: `1px solid ${user.isOnline ? 'rgba(63, 185, 80, 0.3)' : 'rgba(139, 148, 158, 0.3)'}`
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  {user.bio && (
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
                      {user.bio}
                    </Typography>
                  )}

                  {user.lastActivity && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto' }}>
                      <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {user.isOnline 
                          ? 'Активен сейчас' 
                          : `Был в сети ${formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true, locale: ru })}`
                        }
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: isDark 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Пользователи не найдены
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Users;




