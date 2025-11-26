import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import {
  Delete,
  Edit,
  People,
  Folder,
  Comment,
  Star,
  Warning,
  Storage,
  Refresh
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDark = mode === 'dark';

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [clearDbDialogOpen, setClearDbDialogOpen] = useState(false);
  const [clearDbConfirm, setClearDbConfirm] = useState('');
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');

  // Статистика БД - вызываем всегда, но отключаем если нет прав
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery(
    'adminStats',
    async () => {
      const response = await api.get('/admin/stats');
      return response.data;
    },
    {
      enabled: !authLoading && user && user.role === 'admin',
      retry: 1,
      onError: (error) => {
        console.error('Ошибка при загрузке статистики:', error);
      }
    }
  );

  // Список пользователей - вызываем всегда, но отключаем если нет прав
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers, error: usersError } = useQuery(
    ['adminUsers', search, roleFilter],
    async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const response = await api.get(`/admin/users?${params.toString()}`);
      return response.data;
    },
    {
      enabled: !authLoading && user && user.role === 'admin',
      retry: 1,
      onError: (error) => {
        console.error('Ошибка при загрузке пользователей:', error);
      }
    }
  );

  // Удаление пользователя
  const deleteUserMutation = useMutation(
    (userId) => api.delete(`/admin/users/${userId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        queryClient.invalidateQueries('adminStats');
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при удалении пользователя');
      }
    }
  );

  // Изменение роли
  const changeRoleMutation = useMutation(
    ({ userId, role }) => api.put(`/admin/users/${userId}/role`, { role }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        setRoleChangeDialogOpen(false);
        setSelectedUser(null);
        setNewRole('');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при изменении роли');
      }
    }
  );

  // Очистка БД
  const clearDbMutation = useMutation(
    () => api.post('/admin/clear-db', { confirm: 'CLEAR_ALL_DATA' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setClearDbDialogOpen(false);
        setClearDbConfirm('');
        alert('База данных успешно очищена!');
        // Выходим из системы, так как все пользователи удалены
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при очистке базы данных');
      }
    }
  );

  // Показываем загрузку, пока проверяется аутентификация
  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Проверка прав администратора
  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="error">Доступ запрещен. Требуются права администратора.</Alert>
      </Container>
    );
  }

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
      admin: 'error'
    };
    return colors[role] || 'default';
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleChangeDialogOpen(true);
  };

  const handleClearDb = () => {
    setClearDbDialogOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Заголовок */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          width: 56, 
          height: 56, 
          borderRadius: 2,
          background: isDark 
            ? 'linear-gradient(135deg, #cf222e 0%, #a40e26 100%)'
            : 'linear-gradient(135deg, #cf222e 0%, #a40e26 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDark 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <Storage sx={{ fontSize: 32, color: '#ffffff' }} />
        </Box>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Панель администратора
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Управление базой данных и пользователями
          </Typography>
        </Box>
      </Box>

      {/* Вкладки */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Статистика" />
          <Tab label="Пользователи" />
          <Tab label="Опасная зона" />
        </Tabs>
      </Paper>

      {/* Статистика */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {statsError && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                Ошибка при загрузке статистики: {statsError.response?.data?.message || statsError.message}
              </Alert>
            </Grid>
          )}
          {statsLoading ? (
            <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <People sx={{ fontSize: 32, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {stats?.users?.total || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Пользователей
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Folder sx={{ fontSize: 32, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {stats?.projects?.total || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Проектов
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Comment sx={{ fontSize: 32, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {stats?.comments || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Комментариев
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Star sx={{ fontSize: 32, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h4" fontWeight={700}>
                          {stats?.ratings || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Оценок
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Распределение по ролям
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      {stats?.users?.byRole && Object.entries(stats.users.byRole).map(([role, count]) => (
                        <Chip
                          key={role}
                          label={`${getRoleLabel(role)}: ${count}`}
                          color={getRoleColor(role)}
                          sx={{ 
                            ...(role === 'admin' && { bgcolor: '#cf222e', color: '#ffffff' })
                          }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      )}

      {/* Пользователи */}
      {tab === 1 && (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Поиск пользователей..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Роль</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Роль"
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <MenuItem value="">Все роли</MenuItem>
                    <MenuItem value="student">Студент</MenuItem>
                    <MenuItem value="teacher">Преподаватель</MenuItem>
                    <MenuItem value="mentor">Ментор</MenuItem>
                    <MenuItem value="admin">Администратор</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={5}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => refetchUsers()}
                  fullWidth
                >
                  Обновить
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {usersError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Ошибка при загрузке пользователей: {usersError.response?.data?.message || usersError.message}
            </Alert>
          )}
          {usersLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Имя</TableCell>
                    <TableCell>Роль</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersData?.users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.firstName} {u.lastName}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(u.role)}
                          color={getRoleColor(u.role)}
                          size="small"
                          sx={{ 
                            ...(u.role === 'admin' && { bgcolor: '#cf222e', color: '#ffffff' })
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleChangeRole(u)}
                          disabled={u.id === user.id}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === user.id}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Опасная зона */}
      {tab === 2 && (
        <Card sx={{ border: '2px solid', borderColor: 'error.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Warning sx={{ fontSize: 40, color: 'error.main' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="error">
                  Опасная зона
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Эти действия необратимы. Будьте осторожны!
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<Storage />}
              onClick={handleClearDb}
              sx={{ mt: 2 }}
            >
              Очистить базу данных
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Диалог удаления пользователя */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить пользователя?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить пользователя <strong>{selectedUser?.email}</strong>?
            Это действие удалит все связанные данные пользователя (проекты, комментарии, команды) и не может быть отменено.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => deleteUserMutation.mutate(selectedUser?.id)}
            color="error"
            variant="contained"
            disabled={deleteUserMutation.isLoading}
          >
            {deleteUserMutation.isLoading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог изменения роли */}
      <Dialog open={roleChangeDialogOpen} onClose={() => setRoleChangeDialogOpen(false)}>
        <DialogTitle>Изменить роль пользователя</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Новая роль</InputLabel>
            <Select
              value={newRole}
              label="Новая роль"
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="student">Студент</MenuItem>
              <MenuItem value="teacher">Преподаватель</MenuItem>
              <MenuItem value="mentor">Ментор</MenuItem>
              <MenuItem value="admin">Администратор</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleChangeDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => changeRoleMutation.mutate({ userId: selectedUser?.id, role: newRole })}
            variant="contained"
            disabled={changeRoleMutation.isLoading}
          >
            {changeRoleMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог очистки БД */}
      <Dialog open={clearDbDialogOpen} onClose={() => setClearDbDialogOpen(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>
          <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
          Очистить базу данных?
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Это действие удалит ВСЕ данные из базы данных, включая всех пользователей, проекты, команды и файлы.
            Это действие НЕОБРАТИМО!
          </Alert>
          <DialogContentText>
            Для подтверждения введите <strong>CLEAR_ALL_DATA</strong> в поле ниже:
          </DialogContentText>
          <TextField
            fullWidth
            value={clearDbConfirm}
            onChange={(e) => setClearDbConfirm(e.target.value)}
            placeholder="CLEAR_ALL_DATA"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDbDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => clearDbMutation.mutate()}
            color="error"
            variant="contained"
            disabled={clearDbConfirm !== 'CLEAR_ALL_DATA' || clearDbMutation.isLoading}
          >
            {clearDbMutation.isLoading ? 'Очистка...' : 'Очистить БД'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Admin;

