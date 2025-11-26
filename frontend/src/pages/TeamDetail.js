import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { People as PeopleIcon } from '@mui/icons-material';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [assignProjectDialogOpen, setAssignProjectDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [projectForm, setProjectForm] = useState({ 
    title: '', 
    description: '', 
    status: 'draft',
    visibility: 'public',
    repositoryUrl: '',
    deployUrl: '',
    tags: []
  });
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const { data: team, isLoading } = useQuery(
    ['team', id],
    async () => {
      const response = await api.get(`/teams/${id}`);
      return response.data;
    }
  );

  const { data: users, isLoading: usersLoading } = useQuery(
    ['users', searchUsers],
    async () => {
      if (!searchUsers || searchUsers.length < 2) return [];
      try {
        const response = await api.get('/users', { params: { search: searchUsers } });
        // Фильтруем: исключаем текущего пользователя и уже состоящих в команде
        const memberIds = team?.members?.map(m => m.id) || [];
        return response.data.filter(u => 
          u.id !== user?.id && 
          !memberIds.includes(u.id)
        );
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    { 
      enabled: inviteDialogOpen && searchUsers.length >= 2,
      staleTime: 5000 // Кэшируем на 5 секунд
    }
  );

  const { data: userProjects } = useQuery(
    ['userProjects', user?.id],
    async () => {
      if (!user?.id) return [];
      const response = await api.get('/projects', { params: { ownerId: user.id } });
      return response.data;
    },
    { enabled: assignProjectDialogOpen && !!user?.id }
  );

  const inviteMutation = useMutation(
    (userId) => api.post(`/teams/${id}/invite`, { userId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['team', id]);
        queryClient.invalidateQueries('invitations');
        queryClient.refetchQueries(['team', id]); // Принудительно обновляем
        setInviteDialogOpen(false);
        setSelectedUserId(null);
        setSearchUsers('');
        alert('Приглашение отправлено!');
      },
      onError: (error) => {
        console.error('Error inviting user:', error);
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || 'Ошибка при отправке приглашения';
        
        // Если приглашение уже отправлено, предлагаем отменить его
        if (errorMessage.includes('Приглашение уже отправлено') && errorData?.invitationId) {
          const cancelInvitation = window.confirm(
            'Приглашение уже отправлено этому пользователю. Хотите отменить предыдущее приглашение и отправить новое?'
          );
          if (cancelInvitation) {
            // Отправляем запрос на отмену приглашения
            api.delete(`/teams/invitations/${errorData.invitationId}`)
              .then(() => {
                // После отмены отправляем новое приглашение
                inviteMutation.mutate(selectedUserId);
              })
              .catch((cancelError) => {
                console.error('Error canceling invitation:', cancelError);
                alert('Ошибка при отмене предыдущего приглашения');
              });
            return;
          }
        }
        
        // Переводим другие сообщения на русский
        let translatedMessage = errorMessage;
        if (errorMessage.includes('User is already a member')) {
          translatedMessage = 'Пользователь уже является участником команды';
        } else if (errorMessage.includes('Team is full')) {
          translatedMessage = 'Команда заполнена';
        } else if (errorMessage.includes('Only team leader can invite')) {
          translatedMessage = 'Только лидер команды может приглашать участников';
        }
        alert(translatedMessage);
      }
    }
  );

  const removeMemberMutation = useMutation(
    (userId) => api.delete(`/teams/${id}/members/${userId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['team', id]);
      }
    }
  );

  const cancelInvitationMutation = useMutation(
    (invitationId) => api.delete(`/teams/invitations/${invitationId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['team', id]);
        queryClient.refetchQueries(['team', id]); // Принудительно обновляем
        alert('Приглашение отменено');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при отмене приглашения');
      }
    }
  );

  const createProjectMutation = useMutation(
    (data) => {
      // Используем видимость команды для проекта
      const projectVisibility = team?.visibility || 'public';
      const projectData = {
        title: data.title.trim(),
        description: data.description.trim(),
        status: data.status || 'draft',
        visibility: projectVisibility, // Видимость проекта = видимость команды
        repositoryUrl: data.repositoryUrl || null,
        deployUrl: data.deployUrl || null,
        tags: data.tags || [],
        teamId: id
      };
      console.log('Creating project with data:', projectData);
      return api.post('/projects', projectData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['team', id]);
        queryClient.invalidateQueries('projects');
        queryClient.refetchQueries(['team', id]); // Принудительно обновляем
        queryClient.refetchQueries('projects'); // Принудительно обновляем список проектов
        setCreateProjectDialogOpen(false);
        setProjectForm({ 
          title: '', 
          description: '', 
          status: 'draft',
          visibility: team?.visibility || 'public', // Сохраняем видимость команды
          repositoryUrl: '',
          deployUrl: '',
          tags: []
        });
        alert('Проект успешно создан!');
      },
      onError: (error) => {
        console.error('Error creating project:', error);
        console.error('Error response:', error.response?.data);
        let errorMessage = 'Ошибка при создании проекта';
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.map(e => e.msg || e.message).join(', ');
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        alert(errorMessage);
      }
    }
  );

  const assignProjectMutation = useMutation(
    (projectId) => api.post(`/teams/${id}/projects`, { projectId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['team', id]);
        queryClient.refetchQueries(['team', id]); // Принудительно обновляем
        setAssignProjectDialogOpen(false);
        setSelectedProjectId(null);
      }
    }
  );

  const leaveTeamMutation = useMutation(
    () => api.post(`/teams/${id}/leave`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries(['team', id]);
        queryClient.refetchQueries('teams'); // Принудительно обновляем
        queryClient.refetchQueries(['team', id]); // Принудительно обновляем
        navigate('/teams');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при выходе из команды');
      }
    }
  );

  const deleteTeamMutation = useMutation(
    () => api.delete(`/teams/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
        navigate('/teams');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при удалении команды');
      }
    }
  );

  const isLeader = team?.leaderId === user?.id;
  const isMember = team?.members?.some(m => m.id === user?.id);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!team) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5">Команда не найдена</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        sx={{ 
          p: 4,
          borderRadius: 2,
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: isDark 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Заголовок с иконкой */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
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
            boxShadow: isDark 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <PeopleIcon sx={{ fontSize: 32, color: '#ffffff' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {team.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {team.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`Участников: ${team.members?.length || 0}/${team.maxMembers}`} />
              <Chip label={`Проектов: ${team.projects?.length || 0}`} />
              {team.visibility && (
                <Chip
                  label={team.visibility === 'public' ? 'Публичная' : 'Закрытая'}
                  color={team.visibility === 'public' ? 'default' : 'secondary'}
                />
              )}
            </Box>
            <Typography 
              variant="body2" 
              color="text.secondary"
              onClick={() => team.leader?.id && navigate(`/users/${team.leader.id}`)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline'
                }
              }}
            >
              Лидер: {team.leader?.firstName} {team.leader?.lastName}
            </Typography>
            {isLeader && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите удалить эту команду? Это действие нельзя отменить.')) {
                      deleteTeamMutation.mutate();
                    }
                  }}
                  disabled={deleteTeamMutation.isLoading}
                >
                  {deleteTeamMutation.isLoading ? 'Удаление...' : 'Удалить команду'}
                </Button>
              </Box>
            )}
            {isMember && !isLeader && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите покинуть эту команду?')) {
                      leaveTeamMutation.mutate();
                    }
                  }}
                  disabled={leaveTeamMutation.isLoading}
                >
                  {leaveTeamMutation.isLoading ? 'Выход...' : 'Покинуть команду'}
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Участники */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Участники</Typography>
            {isLeader && (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setInviteDialogOpen(true)}
                disabled={team.members?.length >= team.maxMembers}
              >
                Пригласить
              </Button>
            )}
          </Box>
          <Grid container spacing={2}>
            {team.members?.map((member) => (
              <Grid item xs={12} sm={6} md={4} key={member.id}>
                <Card>
                  <CardContent>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8
                        }
                      }}
                      onClick={() => navigate(`/users/${member.id}`)}
                    >
                      <Avatar sx={{ mr: 2 }}>
                        {member.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="subtitle1"
                          sx={{
                            '&:hover': {
                              color: 'primary.main',
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {member.firstName} {member.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.email}
                        </Typography>
                      </Box>
                      {isLeader && member.id !== team.leaderId && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm('Удалить участника из команды?')) {
                              removeMemberMutation.mutate(member.id);
                            }
                          }}
                          sx={{ ml: 'auto' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {/* Приглашения (только для лидера) */}
          {isLeader && team.pendingInvitations && team.pendingInvitations.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Ожидающие приглашения:
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {team.pendingInvitations.map((invitation) => (
                  <Grid item xs={12} sm={6} md={4} key={invitation.id}>
                    <Card sx={{ bgcolor: 'warning.light' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              mr: 2,
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.8,
                                transform: 'scale(1.05)',
                                transition: 'all 0.2s'
                              }
                            }}
                            onClick={() => invitation.user?.id && navigate(`/users/${invitation.user.id}`)}
                          >
                            {invitation.user?.firstName?.[0]}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography 
                              variant="subtitle2"
                              onClick={() => invitation.user?.id && navigate(`/users/${invitation.user.id}`)}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  color: 'primary.main',
                                  textDecoration: 'underline'
                                }
                              }}
                            >
                              {invitation.user?.firstName} {invitation.user?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {invitation.user?.email}
                            </Typography>
                            <Chip
                              label="Ожидает ответа"
                              size="small"
                              color="warning"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (window.confirm('Отменить приглашение?')) {
                                cancelInvitationMutation.mutate(invitation.id);
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Проекты команды */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Проекты команды</Typography>
            {isMember && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Устанавливаем видимость проекта на основе видимости команды
                    setProjectForm(prev => ({
                      ...prev,
                      visibility: team?.visibility || 'public'
                    }));
                    setCreateProjectDialogOpen(true);
                  }}
                >
                  Создать проект
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setAssignProjectDialogOpen(true)}
                >
                  Присвоить проект
                </Button>
              </Box>
            )}
          </Box>
          <Grid container spacing={2}>
            {team.projects?.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {project.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.status} • Прогресс: {project.progress}%
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Открыть
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          {(!team.projects || team.projects.length === 0) && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              У команды пока нет проектов
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Диалог приглашения */}
      <Dialog open={inviteDialogOpen} onClose={() => {
        setInviteDialogOpen(false);
        setSearchUsers('');
        setSelectedUserId(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Пригласить пользователя</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={users || []}
            getOptionLabel={(option) => {
              if (!option) return '';
              if (typeof option === 'string') return option;
              return `${option.firstName || ''} ${option.lastName || ''} (${option.email || ''})`.trim();
            }}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={selectedUserId ? (users?.find(u => u.id === selectedUserId) || null) : null}
            onChange={(e, newValue) => {
              console.log('Autocomplete onChange:', newValue);
              setSelectedUserId(newValue?.id || null);
            }}
            onInputChange={(e, newInputValue, reason) => {
              console.log('onInputChange:', newInputValue, reason);
              if (reason === 'input' || reason === 'clear') {
                setSearchUsers(newInputValue);
                if (reason === 'clear') {
                  setSelectedUserId(null);
                }
              }
            }}
            loading={usersLoading}
            filterOptions={(x) => x} // Отключаем встроенную фильтрацию, так как фильтруем на сервере
            renderInput={(params) => (
              <TextField
                {...params}
                label="Поиск пользователя"
                placeholder="Введите имя или email (минимум 2 символа)"
                fullWidth
                margin="normal"
                helperText={
                  searchUsers.length < 2 
                    ? "Введите минимум 2 символа для поиска" 
                    : usersLoading 
                      ? "Поиск..." 
                      : users && users.length > 0 
                        ? `Найдено: ${users.length}` 
                        : "Пользователи не найдены"
                }
              />
            )}
            noOptionsText={
              searchUsers.length < 2 
                ? "Введите минимум 2 символа для поиска" 
                : usersLoading 
                  ? "Поиск..." 
                  : "Пользователи не найдены"
            }
            loadingText="Поиск пользователей..."
          />
          {selectedUserId && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'action.selected', borderRadius: 1 }}>
              <Typography variant="body2">
                Выбран: {users?.find(u => u.id === selectedUserId)?.firstName} {users?.find(u => u.id === selectedUserId)?.lastName}
              </Typography>
            </Box>
          )}
          {inviteMutation.isError && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error">
                {inviteMutation.error?.response?.data?.message || 'Ошибка при отправке приглашения'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setInviteDialogOpen(false);
            setSearchUsers('');
            setSelectedUserId(null);
            inviteMutation.reset();
          }}>Отмена</Button>
          <Button
            onClick={() => {
              console.log('Invite button clicked');
              console.log('selectedUserId:', selectedUserId);
              console.log('users:', users);
              if (selectedUserId) {
                console.log('Sending invitation for userId:', selectedUserId);
                inviteMutation.mutate(selectedUserId);
              } else {
                alert('Пожалуйста, выберите пользователя из списка');
              }
            }}
            variant="contained"
            disabled={!selectedUserId || inviteMutation.isLoading || usersLoading}
          >
            {inviteMutation.isLoading ? 'Отправка...' : 'Пригласить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог создания проекта */}
      <Dialog open={createProjectDialogOpen} onClose={() => setCreateProjectDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Создать проект для команды</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={projectForm.title}
            onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
            margin="normal"
            required
            helperText={projectForm.title.length > 0 && projectForm.title.length < 3 ? 'Название должно быть минимум 3 символа' : ''}
            error={projectForm.title.length > 0 && projectForm.title.length < 3}
          />
          <TextField
            fullWidth
            label="Описание"
            multiline
            rows={4}
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            margin="normal"
            required
            helperText={projectForm.description.length > 0 && projectForm.description.length < 10 ? 'Описание должно быть минимум 10 символов' : ''}
            error={projectForm.description.length > 0 && projectForm.description.length < 10}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateProjectDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => createProjectMutation.mutate(projectForm)}
            variant="contained"
            disabled={!projectForm.title || !projectForm.description || projectForm.description.length < 10 || createProjectMutation.isLoading}
          >
            {createProjectMutation.isLoading ? 'Создание...' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог присваивания проекта */}
      <Dialog open={assignProjectDialogOpen} onClose={() => setAssignProjectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Присвоить проект команде</DialogTitle>
        <DialogContent>
          <List>
            {userProjects?.map((project) => (
              <ListItem
                key={project.id}
                button
                selected={selectedProjectId === project.id}
                onClick={() => setSelectedProjectId(project.id)}
              >
                <ListItemText
                  primary={project.title}
                  secondary={`${project.status} • Прогресс: ${project.progress}%`}
                />
              </ListItem>
            ))}
          </List>
          {(!userProjects || userProjects.length === 0) && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              У вас нет проектов для присваивания
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignProjectDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => selectedProjectId && assignProjectMutation.mutate(selectedProjectId)}
            variant="contained"
            disabled={!selectedProjectId || assignProjectMutation.isLoading}
          >
            Присвоить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamDetail;

