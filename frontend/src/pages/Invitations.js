import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import api from '../services/api';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import { useTheme } from '../context/ThemeContext';
import { 
  Mail as MailIcon,
  Group as GroupIcon,
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl } from '../utils/avatar';

const Invitations = () => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  // Загружаем активные приглашения в команды
  const { data: teamInvitations, isLoading: teamInvitationsLoading } = useQuery(
    'teamInvitations',
    async () => {
      const response = await api.get('/teams/invitations');
      return response.data;
    },
    {
      refetchInterval: 30000,
      onError: (err) => {
        console.error('Error fetching team invitations:', err);
      }
    }
  );

  // Загружаем активные приглашения в проекты
  const { data: projectInvitations, isLoading: projectInvitationsLoading } = useQuery(
    'projectInvitations',
    async () => {
      const response = await api.get('/projects/invitations');
      return response.data;
    },
    {
      refetchInterval: 30000,
      onError: (err) => {
        console.error('Error fetching project invitations:', err);
      }
    }
  );

  // Загружаем историю приглашений в команды (все статусы)
  const { data: teamInvitationsHistory } = useQuery(
    'teamInvitationsHistory',
    async () => {
      try {
        const response = await api.get('/teams/invitations/all');
        return response.data;
      } catch (error) {
        // Если роут не существует, возвращаем пустой массив
        return [];
      }
    },
    {
      onError: (err) => {
        console.error('Error fetching team invitations history:', err);
      }
    }
  );

  // Загружаем историю приглашений в проекты (все статусы)
  const { data: projectInvitationsHistory } = useQuery(
    'projectInvitationsHistory',
    async () => {
      try {
        const response = await api.get('/projects/invitations/all');
        return response.data;
      } catch (error) {
        // Если роут не существует, возвращаем пустой массив
        return [];
      }
    },
    {
      onError: (err) => {
        console.error('Error fetching project invitations history:', err);
      }
    }
  );

  // Объединяем активные приглашения
  const activeInvitations = [
    ...(teamInvitations || []).map(inv => ({ ...inv, type: 'team' })),
    ...(projectInvitations || []).map(inv => ({ ...inv, type: 'project' }))
  ];

  // Объединяем историю приглашений
  const invitationsHistory = [
    ...(teamInvitationsHistory || []).map(inv => ({ ...inv, type: 'team' })),
    ...(projectInvitationsHistory || []).map(inv => ({ ...inv, type: 'project' }))
  ].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  const isLoading = teamInvitationsLoading || projectInvitationsLoading;

  const acceptMutation = useMutation(
    ({ invitationId, type }) => {
      const endpoint = type === 'team' 
        ? `/teams/invitations/${invitationId}/accept`
        : `/projects/invitations/${invitationId}/accept`;
      return api.post(endpoint);
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries('teamInvitations');
        queryClient.invalidateQueries('projectInvitations');
        queryClient.invalidateQueries('teamInvitationsHistory');
        queryClient.invalidateQueries('projectInvitationsHistory');
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('projects');
        alert(variables.type === 'team' 
          ? 'Приглашение принято! Вы добавлены в команду.'
          : 'Приглашение принято! Вы добавлены в проект.');
      },
      onError: (error) => {
        console.error('Error accepting invitation:', error);
        alert(error.response?.data?.message || 'Ошибка при принятии приглашения');
      }
    }
  );

  const rejectMutation = useMutation(
    ({ invitationId, type }) => {
      const endpoint = type === 'team'
        ? `/teams/invitations/${invitationId}/reject`
        : `/projects/invitations/${invitationId}/reject`;
      return api.post(endpoint);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teamInvitations');
        queryClient.invalidateQueries('projectInvitations');
        queryClient.invalidateQueries('teamInvitationsHistory');
        queryClient.invalidateQueries('projectInvitationsHistory');
        alert('Приглашение отклонено.');
      },
      onError: (error) => {
        console.error('Error rejecting invitation:', error);
        alert(error.response?.data?.message || 'Ошибка при отклонении приглашения');
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
          <MailIcon sx={{ fontSize: 32, color: '#ffffff' }} />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Приглашения
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Управление приглашениями в команды и проекты
          </Typography>
        </Box>
      </Box>

      {/* Вкладки */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}
        >
          <Tab 
            icon={<MailIcon />} 
            iconPosition="start"
            label={`Активные (${activeInvitations.length})`} 
          />
          <Tab 
            icon={<HistoryIcon />} 
            iconPosition="start"
            label={`История (${invitationsHistory.length})`} 
          />
        </Tabs>
      </Paper>

      {/* Активные приглашения */}
      {tabValue === 0 && (
        <>
          {activeInvitations && activeInvitations.length > 0 ? (
            <Grid container spacing={3}>
              {activeInvitations.map((invitation) => (
            <Grid item xs={12} sm={6} md={4} key={invitation.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
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
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {invitation.type === 'project' ? (
                      <FolderIcon sx={{ color: 'primary.main' }} />
                    ) : (
                      <GroupIcon sx={{ color: 'primary.main' }} />
                    )}
                    <Typography variant="h6" gutterBottom sx={{ mb: 0, flex: 1 }}>
                      {invitation.type === 'project' ? invitation.project?.title : invitation.team?.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {invitation.type === 'project' ? invitation.project?.description : invitation.team?.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar 
                      src={getAvatarUrl(invitation.invitedBy?.avatar)} 
                      sx={{ width: 24, height: 24, fontSize: '0.75rem', cursor: 'pointer' }}
                      onClick={() => invitation.invitedBy?.id && navigate(`/users/${invitation.invitedBy.id}`)}
                    >
                      {invitation.invitedBy?.firstName?.[0]}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      Пригласил: {invitation.invitedBy?.firstName} {invitation.invitedBy?.lastName}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {format(new Date(invitation.createdAt), 'dd MMM yyyy в HH:mm', { locale: ru })}
                  </Typography>
                  <Chip
                    label={invitation.type === 'project' ? 'Проект' : 'Команда'}
                    size="small"
                    color={invitation.type === 'project' ? 'primary' : 'default'}
                    sx={{ mt: 1, mr: 1 }}
                  />
                  <Chip
                    label="Ожидает ответа"
                    color="warning"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => acceptMutation.mutate({ invitationId: invitation.id, type: invitation.type })}
                    disabled={acceptMutation.isLoading}
                  >
                    Принять
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => rejectMutation.mutate({ invitationId: invitation.id, type: invitation.type })}
                    disabled={rejectMutation.isLoading}
                  >
                    Отклонить
                  </Button>
                </CardActions>
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
                У вас нет активных приглашений
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* История приглашений */}
      {tabValue === 1 && (
        <>
          {invitationsHistory && invitationsHistory.length > 0 ? (
            <Grid container spacing={3}>
              {invitationsHistory.map((invitation) => (
                <Grid item xs={12} sm={6} md={4} key={invitation.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: isDark 
                          ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                          : '0 8px 16px rgba(0, 0, 0, 0.12)'
                      },
                      borderRadius: 2,
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      boxShadow: isDark 
                        ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.08)',
                      opacity: invitation.status !== 'pending' ? 0.8 : 1
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {invitation.type === 'project' ? (
                          <FolderIcon sx={{ color: 'primary.main' }} />
                        ) : (
                          <GroupIcon sx={{ color: 'primary.main' }} />
                        )}
                        <Typography variant="h6" gutterBottom sx={{ mb: 0, flex: 1 }}>
                          {invitation.type === 'project' ? invitation.project?.title : invitation.team?.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {invitation.type === 'project' ? invitation.project?.description : invitation.team?.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar 
                          src={getAvatarUrl(invitation.invitedBy?.avatar)} 
                          sx={{ width: 24, height: 24, fontSize: '0.75rem', cursor: 'pointer' }}
                          onClick={() => invitation.invitedBy?.id && navigate(`/users/${invitation.invitedBy.id}`)}
                        >
                          {invitation.invitedBy?.firstName?.[0]}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          Пригласил: {invitation.invitedBy?.firstName} {invitation.invitedBy?.lastName}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        {format(new Date(invitation.createdAt), 'dd MMM yyyy в HH:mm', { locale: ru })}
                      </Typography>
                      {invitation.updatedAt && invitation.updatedAt !== invitation.createdAt && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          Обновлено: {format(new Date(invitation.updatedAt), 'dd MMM yyyy в HH:mm', { locale: ru })}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          label={invitation.type === 'project' ? 'Проект' : 'Команда'}
                          size="small"
                          color={invitation.type === 'project' ? 'primary' : 'default'}
                        />
                        <Chip
                          label={
                            invitation.status === 'accepted' ? 'Принято' :
                            invitation.status === 'rejected' ? 'Отклонено' :
                            'Ожидает ответа'
                          }
                          size="small"
                          color={
                            invitation.status === 'accepted' ? 'success' :
                            invitation.status === 'rejected' ? 'error' :
                            'warning'
                          }
                          icon={
                            invitation.status === 'accepted' ? <CheckCircleIcon /> :
                            invitation.status === 'rejected' ? <CancelIcon /> :
                            null
                          }
                        />
                      </Box>
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
                История приглашений пуста
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default Invitations;

