import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Avatar,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  Folder,
  Search,
  FilterList,
  Star,
  Visibility,
  VisibilityOff,
  People,
  AccessTime,
  Add
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import ru from 'date-fns/locale/ru';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const isDark = mode === 'dark';

  const { data: projects, isLoading } = useQuery(
    ['projects', search, statusFilter],
    async () => {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/projects', { params });
      return response.data;
    }
  );

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'primary',
      completed: 'success',
      archived: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Черновик',
      active: 'Активный',
      completed: 'Завершен',
      archived: 'Архив'
    };
    return labels[status] || status;
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'white' }}>
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
                <Folder sx={{ fontSize: 32, color: '#ffffff' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3" component="h1" fontWeight={700} sx={{ mb: 1, textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>
                  Проекты
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.95, textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)' }}>
                  Просматривайте и участвуйте в учебных проектах
                </Typography>
              </Box>
            </Box>
            {user && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/projects/create')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)'
                  }
                }}
              >
                Создать проект
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Фильтры с улучшенным дизайном */}
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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Поиск проектов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              flexGrow: 1, 
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <TextField
            select
            label="Статус"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ 
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            InputProps={{
              startAdornment: <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          >
            <MenuItem value="">Все статусы</MenuItem>
            <MenuItem value="draft">Черновик</MenuItem>
            <MenuItem value="active">Активный</MenuItem>
            <MenuItem value="completed">Завершен</MenuItem>
            <MenuItem value="archived">Архив</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Список проектов */}
      <Grid container spacing={3}>
        {projects?.map((project) => (
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
                  background: isDark 
                    ? `linear-gradient(90deg, ${getStatusColor(project.status) === 'primary' ? '#0969da' : getStatusColor(project.status) === 'success' ? '#3fb950' : '#656d76'} 0%, ${getStatusColor(project.status) === 'primary' ? '#218bff' : getStatusColor(project.status) === 'success' ? '#56d364' : '#8b949e'} 100%)`
                    : `linear-gradient(90deg, ${getStatusColor(project.status) === 'primary' ? '#0969da' : getStatusColor(project.status) === 'success' ? '#1a7f37' : '#656d76'} 0%, ${getStatusColor(project.status) === 'primary' ? '#218bff' : getStatusColor(project.status) === 'success' ? '#2da44e' : '#8b949e'} 100%)`,
                  opacity: 0.8
                }
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{ 
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.3
                    }}
                  >
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
                    WebkitLineClamp: 3, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden',
                    minHeight: '4.5rem'
                  }}
                >
                  {project.description}
                </Typography>

                {/* Прогресс */}
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

                {/* Чипы */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={getStatusLabel(project.status)}
                    color={getStatusColor(project.status)}
                    size="small"
                    sx={{ height: 24, fontWeight: 500 }}
                  />
                  {project.averageRating > 0 && (
                    <Chip
                      icon={<Star sx={{ fontSize: 14 }} />}
                      label={project.averageRating.toFixed(1)}
                      size="small"
                      color="warning"
                      sx={{ height: 24, fontWeight: 500 }}
                    />
                  )}
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

                {/* Команды */}
                {project.teams && project.teams.length > 0 && (
                  <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                    {project.teams.map((team) => (
                      <Chip
                        key={team.id}
                        label={team.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/teams/${team.id}`);
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* Информация об авторе и дате */}
                <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 1,
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
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {project.owner?.firstName?.[0]}
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
                      {project.owner?.firstName} {project.owner?.lastName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: ru })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  size="small" 
                  component={Link} 
                  to={`/projects/${project.id}`}
                  variant="contained"
                  fullWidth
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Открыть проект
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {projects?.length === 0 && (
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
            Проекты не найдены
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Попробуйте изменить параметры поиска
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Projects;
