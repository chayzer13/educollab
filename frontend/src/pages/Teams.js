import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  CircularProgress,
  Avatar,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  People,
  Add,
  Group,
  Visibility,
  VisibilityOff,
  AccessTime,
  Person,
  Folder
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import ru from 'date-fns/locale/ru';
import { useTheme } from '../context/ThemeContext';

const Teams = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDark = mode === 'dark';

  const { data: teams, isLoading } = useQuery('teams', async () => {
    const response = await api.get('/teams');
    return response.data;
  });

  const joinMutation = useMutation(
    (teamId) => api.post(`/teams/${teamId}/join`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
        queryClient.refetchQueries('teams');
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
                <People sx={{ fontSize: 32, color: '#ffffff' }} />
              </Box>
              <Box>
                <Typography variant="h3" component="h1" fontWeight={700} sx={{ mb: 1, textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>
                  Команды
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.95, textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)' }}>
                  Присоединяйтесь к командам и работайте вместе над проектами
                </Typography>
              </Box>
            </Box>
            {user && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/teams/create')}
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
                Создать команду
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Список команд */}
      <Grid container spacing={3}>
        {teams?.map((team) => {
          const isMember = team.members?.some(m => m.id === user?.id);
          const memberCount = team.members?.length || 0;
          const isFull = memberCount >= team.maxMembers;
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
                      {team.name}
                    </Typography>
                    {team.visibility === 'private' && (
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
                    {team.description}
                  </Typography>

                  {/* Прогресс заполненности команды */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
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
                      color={isFull ? 'error' : 'primary'}
                    />
                  </Box>

                  {/* Чипы */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
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

                  {/* Информация о лидере и дате */}
                  <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Лидер: {team.leader?.firstName} {team.leader?.lastName}
                      </Typography>
                    </Box>
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
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    Открыть
                  </Button>
                  {user && !isMember && !isFull && (
                    <Button
                      size="small"
                      onClick={() => joinMutation.mutate(team.id)}
                      disabled={joinMutation.isLoading}
                      variant="outlined"
                      fullWidth
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 500
                      }}
                    >
                      Присоединиться
                    </Button>
                  )}
                  {isMember && (
                    <Chip 
                      label="Вы участник" 
                      color="primary" 
                      size="small" 
                      sx={{ 
                        height: 32,
                        fontWeight: 500
                      }} 
                    />
                  )}
                  {isFull && !isMember && (
                    <Chip 
                      label="Команда заполнена" 
                      size="small" 
                      sx={{ 
                        height: 32,
                        fontWeight: 500
                      }} 
                    />
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      
      {teams?.length === 0 && (
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
            Команды не найдены
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Создайте первую команду или дождитесь появления новых
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Teams;
