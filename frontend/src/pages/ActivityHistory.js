import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Avatar,
  TextField,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Group as GroupIcon,
  Folder as FolderIcon,
  Comment as CommentIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Cancel as CancelIcon,
  Create as CreateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import ru from 'date-fns/locale/ru';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import Paper from '@mui/material/Paper';

const ActivityHistory = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const isDark = mode === 'dark';
  const [teamFilter, setTeamFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Загружаем команды пользователя
  const { data: userTeams } = useQuery(
    ['userTeams', user?.id],
    async () => {
      if (!user?.id) return [];
      const response = await api.get('/users/me/teams');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Загружаем проекты пользователя
  const { data: userProjects } = useQuery(
    ['userProjects', user?.id],
    async () => {
      if (!user?.id) return [];
      const response = await api.get('/projects', { params: { ownerId: user.id } });
      return response.data;
    },
    { enabled: !!user?.id }
  );

  const { data, isLoading, error } = useQuery(
    ['activities', teamFilter, projectFilter, typeFilter],
    async () => {
      const params = {};
      if (teamFilter) params.teamId = teamFilter;
      if (projectFilter) params.projectId = projectFilter;
      if (typeFilter) params.type = typeFilter;
      const response = await api.get('/activities', { params });
      console.log('Activities response:', response.data);
      return response.data;
    },
    { 
      enabled: !!user,
      onError: (err) => {
        console.error('Error fetching activities:', err);
      }
    }
  );

  const getActivityIcon = (type) => {
    if (type.includes('invitation')) {
      return type.includes('accepted') || type.includes('sent') ? <PersonAddIcon /> : <CancelIcon />;
    }
    if (type.includes('member')) {
      return type.includes('joined') || type.includes('added') ? <PersonAddIcon /> : <PersonRemoveIcon />;
    }
    if (type.includes('project')) {
      return type.includes('created') ? <CreateIcon /> : type.includes('deleted') ? <DeleteIcon /> : <EditIcon />;
    }
    if (type.includes('comment')) {
      return <CommentIcon />;
    }
    if (type.includes('team')) {
      return <GroupIcon />;
    }
    return <FolderIcon />;
  };

  const getActivityColor = (type) => {
    if (type.includes('created') || type.includes('accepted') || type.includes('joined')) {
      return 'success';
    }
    if (type.includes('deleted') || type.includes('rejected') || type.includes('left') || type.includes('removed')) {
      return 'error';
    }
    if (type.includes('updated') || type.includes('sent')) {
      return 'primary';
    }
    return 'default';
  };

  const getActivityLabel = (type) => {
    const labels = {
      team_invitation_sent: 'Приглашение отправлено',
      team_invitation_accepted: 'Приглашение принято',
      team_invitation_rejected: 'Приглашение отклонено',
      team_invitation_cancelled: 'Приглашение отменено',
      team_member_joined: 'Участник присоединился',
      team_member_left: 'Участник покинул',
      team_member_removed: 'Участник удален',
      team_project_added: 'Проект добавлен',
      team_project_removed: 'Проект удален',
      team_created: 'Команда создана',
      team_updated: 'Команда обновлена',
      project_created: 'Проект создан',
      project_updated: 'Проект обновлен',
      project_deleted: 'Проект удален',
      comment_created: 'Комментарий создан',
      comment_deleted: 'Комментарий удален',
      user_joined_team: 'Присоединение к команде',
      user_left_team: 'Выход из команды'
    };
    return labels[type] || type;
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
          <TimelineIcon sx={{ fontSize: 32, color: '#ffffff' }} />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            История активности
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Просмотр всех событий и изменений в системе
          </Typography>
        </Box>
      </Box>

      {/* Фильтры с улучшенным дизайном */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2,
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: isDark 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Тип активности"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            size="small"
          >
            <MenuItem value="">Все типы</MenuItem>
            <MenuItem value="team_invitation_sent">Приглашение отправлено</MenuItem>
            <MenuItem value="team_invitation_accepted">Приглашение принято</MenuItem>
            <MenuItem value="team_invitation_rejected">Приглашение отклонено</MenuItem>
            <MenuItem value="team_member_joined">Участник присоединился</MenuItem>
            <MenuItem value="team_member_left">Участник покинул</MenuItem>
            <MenuItem value="project_created">Проект создан</MenuItem>
            <MenuItem value="project_updated">Проект обновлен</MenuItem>
            <MenuItem value="comment_created">Комментарий создан</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Команда"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            size="small"
          >
            <MenuItem value="">Все команды</MenuItem>
            {userTeams?.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label="Проект"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            size="small"
          >
            <MenuItem value="">Все проекты</MenuItem>
            {userProjects?.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.title}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data?.activities?.map((activity) => (
          <Card 
            key={activity.id}
            sx={{
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDark 
                  ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                  : '0 8px 16px rgba(0, 0, 0, 0.12)'
              },
              borderRadius: 2,
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              boxShadow: isDark 
                ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: activity.type.includes('created') || activity.type.includes('accepted')
                      ? '#ddfbe4'
                      : activity.type.includes('deleted') || activity.type.includes('rejected')
                      ? '#ffebe9'
                      : '#eef1f4',
                    color: activity.type.includes('created') || activity.type.includes('accepted')
                      ? '#1a7f37'
                      : activity.type.includes('deleted') || activity.type.includes('rejected')
                      ? '#cf222e'
                      : '#24292f'
                  }}
                >
                  {getActivityIcon(activity.type)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={getActivityLabel(activity.type)}
                      color={getActivityColor(activity.type)}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ru })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {activity.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {activity.user && (
                      <Chip
                        label={`${activity.user.firstName} ${activity.user.lastName}`}
                        size="small"
                        variant="outlined"
                        avatar={<Avatar sx={{ width: 20, height: 20 }}>{activity.user.firstName?.[0]}</Avatar>}
                        onClick={() => navigate(`/users/${activity.user.id}`)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      />
                    )}
                    {activity.team && (
                      <Chip
                        label={activity.team.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onClick={() => navigate(`/teams/${activity.team.id}`)}
                        sx={{ cursor: 'pointer' }}
                        title={`ID команды: ${activity.team.id}`}
                      />
                    )}
                    {activity.project && (
                      <Chip
                        label={activity.project.title}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        onClick={() => navigate(`/projects/${activity.project.id}`)}
                        sx={{ cursor: 'pointer' }}
                        title={`ID проекта: ${activity.project.id}`}
                      />
                    )}
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      mt: 1, 
                      display: 'block',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      opacity: 0.7
                    }}
                  >
                    ID активности: {activity.id}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {error && (
        <Typography variant="body2" color="error" align="center" sx={{ mt: 4 }}>
          Ошибка при загрузке истории: {error.message}
        </Typography>
      )}
      {!isLoading && !error && data?.activities?.length === 0 && (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          История активности пуста
        </Typography>
      )}
      {!isLoading && !error && data && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Всего записей: {data.total || 0}
        </Typography>
      )}
    </Container>
  );
};

export default ActivityHistory;

