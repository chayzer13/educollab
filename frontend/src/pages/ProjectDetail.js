import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Rating,
  Divider,
  Avatar,
  IconButton,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  LinearProgress,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import FolderIcon from '@mui/icons-material/Folder';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { format, formatDistanceToNow } from 'date-fns';
import ru from 'date-fns/locale/ru';
import { getAvatarUrl } from '../utils/avatar';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode } = useTheme();
  const queryClient = useQueryClient();
  const isDark = mode === 'dark';
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', dueDate: '' });
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [searchMember, setSearchMember] = useState('');

  const { data: project, isLoading } = useQuery(
    ['project', id],
    async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    }
  );

  const { data: milestones = [], refetch: refetchMilestones } = useQuery(
    ['milestones', id],
    async () => {
      const response = await api.get(`/milestones/project/${id}`);
      return response.data;
    },
    { enabled: !!project }
  );

  // Files are included in project data, no need for separate query
  const projectFiles = project?.files || [];

  // Инициализация прогресса при загрузке проекта
  React.useEffect(() => {
    if (project) {
      setProgressValue(project.progress || 0);
    }
  }, [project]);

  const commentMutation = useMutation(
    ({ content, parentId }) => api.post('/comments', { content, projectId: id, parentId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.refetchQueries(['project', id]); // Принудительно обновляем
        setCommentText('');
        setReplyText('');
        setReplyingTo(null);
      }
    }
  );

  const deleteCommentMutation = useMutation(
    (commentId) => api.delete(`/comments/${commentId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.refetchQueries(['project', id]); // Принудительно обновляем
      }
    }
  );

  const deleteProjectMutation = useMutation(
    (projectId) => api.delete(`/projects/${projectId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        navigate('/projects');
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
        queryClient.invalidateQueries(['project', id]);
        queryClient.invalidateQueries('projects');
        queryClient.refetchQueries(['project', id]);
        alert('Проект успешно архивирован');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при архивировании проекта');
      }
    }
  );

  // Запрос для поиска пользователей
  const { data: searchUsers = [], isLoading: searchUsersLoading } = useQuery(
    ['searchUsers', searchMember],
    async () => {
      if (!searchMember || searchMember.length < 2) return [];
      const response = await api.get('/users', { params: { search: searchMember } });
      // Исключаем владельца и уже добавленных участников
      const memberIds = project?.members?.map(m => m.id) || [];
      return response.data.filter(u => 
        u.id !== user?.id && 
        u.id !== project?.ownerId &&
        !memberIds.includes(u.id)
      );
    },
    { enabled: membersDialogOpen && searchMember.length >= 2 }
  );

  // Мутация для отправки приглашения
  const inviteMemberMutation = useMutation(
    (userId) => api.post(`/projects/${id}/invite`, { userId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.refetchQueries(['project', id]);
        setSearchMember('');
        alert('Приглашение успешно отправлено');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при отправке приглашения');
      }
    }
  );

  // Мутация для удаления участника
  const removeMemberMutation = useMutation(
    (userId) => api.delete(`/projects/${id}/members/${userId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.refetchQueries(['project', id]);
        alert('Участник успешно удален');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при удалении участника');
      }
    }
  );

  const unarchiveProjectMutation = useMutation(
    (projectId) => api.post(`/projects/${projectId}/unarchive`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.invalidateQueries('projects');
        queryClient.refetchQueries(['project', id]);
        alert('Проект успешно разархивирован');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при разархивировании проекта');
      }
    }
  );

  const updateProgressMutation = useMutation(
    (progress) => api.put(`/projects/${id}`, { progress }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.refetchQueries(['project', id]); // Принудительно обновляем
        setProgressDialogOpen(false);
      }
    }
  );

  const ratingMutation = useMutation(
    (value) => api.post('/ratings', { projectId: id, value }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.refetchQueries(['project', id]); // Принудительно обновляем
      }
    }
  );

  const createMilestoneMutation = useMutation(
    (data) => api.post('/milestones', { ...data, projectId: id }),
    {
      onSuccess: () => {
        refetchMilestones();
        setMilestoneDialogOpen(false);
        setMilestoneForm({ title: '', description: '', dueDate: '' });
      }
    }
  );

  const updateMilestoneMutation = useMutation(
    ({ milestoneId, ...data }) => api.put(`/milestones/${milestoneId}`, data),
    {
      onSuccess: () => {
        refetchMilestones();
        setMilestoneDialogOpen(false);
        setEditingMilestone(null);
        setMilestoneForm({ title: '', description: '', dueDate: '' });
      }
    }
  );

  const deleteMilestoneMutation = useMutation(
    (milestoneId) => api.delete(`/milestones/${milestoneId}`),
    {
      onSuccess: () => {
        refetchMilestones();
      }
    }
  );

  const toggleMilestoneMutation = useMutation(
    ({ milestoneId, completed }) => api.put(`/milestones/${milestoneId}`, { completed }),
    {
      onSuccess: () => {
        refetchMilestones();
      }
    }
  );

  const uploadFileMutation = useMutation(
    (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/files/upload/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.refetchQueries(['project', id]);
        setFileUploadDialogOpen(false);
        setSelectedFile(null);
        alert('Файл успешно загружен');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при загрузке файла');
      }
    }
  );

  const deleteFileMutation = useMutation(
    (fileId) => api.delete(`/files/${fileId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.refetchQueries(['project', id]);
        alert('Файл успешно удален');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Ошибка при удалении файла');
      }
    }
  );

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadFileMutation.mutate(selectedFile);
    }
  };

  const handleFileDownload = async (fileId, originalName) => {
    try {
      const response = await api.get(`/files/${fileId}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Создаем URL для blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(error.response?.data?.message || 'Ошибка при скачивании файла');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      commentMutation.mutate({ content: commentText });
    }
  };

  const handleReplySubmit = (parentId) => {
    if (replyText.trim()) {
      commentMutation.mutate({ content: replyText, parentId });
    }
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleProgressChange = () => {
    updateProgressMutation.mutate(progressValue);
  };

  // Функция для группировки комментариев (родительские и ответы)
  const groupComments = React.useMemo(() => {
    if (!project?.comments || !Array.isArray(project.comments)) return [];
    
    // Фильтруем родительские комментарии (без parentId)
    const parentComments = project.comments.filter(c => !c.parentId);
    // Фильтруем ответы (с parentId)
    const replies = project.comments.filter(c => c.parentId);
    
    // Группируем ответы по родительским комментариям
    return parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(r => r.parentId === parent.id)
    }));
  }, [project?.comments]);

  const handleRatingSubmit = () => {
    if (ratingValue > 0) {
      ratingMutation.mutate(ratingValue);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5">Проект не найден</Typography>
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
              ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'
              : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isDark 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <FolderIcon sx={{ fontSize: 32, color: '#ffffff' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {project.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={project.status === 'draft' ? 'Черновик' : project.status === 'active' ? 'Активный' : project.status === 'completed' ? 'Завершен' : 'Архив'}
                color={project.status === 'active' ? 'primary' : project.status === 'completed' ? 'success' : 'default'}
              />
              {project.averageRating > 0 && (
                <Chip
                  label={`⭐ ${project.averageRating.toFixed(1)} (${project.ratingCount})`}
                />
              )}
              <Chip 
                label={`Прогресс: ${project.progress}%`}
                onClick={() => project.ownerId === user?.id && setProgressDialogOpen(true)}
                sx={{ cursor: project.ownerId === user?.id ? 'pointer' : 'default' }}
              />
              {project.visibility && (
                <Chip
                  label={project.visibility === 'public' ? 'Публичный' : 'Закрытый'}
                  color={project.visibility === 'public' ? 'default' : 'secondary'}
                />
              )}
            </Box>
            <Typography variant="body1" paragraph>
              {project.description}
            </Typography>
            {project.teams && project.teams.length > 0 && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Команды проекта:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {project.teams.map((team) => (
                    <Chip
                      key={team.id}
                      label={team.name}
                      color="primary"
                      variant="outlined"
                      onClick={() => navigate(`/teams/${team.id}`)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 0 }}>
                  Участники проекта:
                </Typography>
                {user && (project.ownerId === user.id || user.role === 'teacher' || user.role === 'admin') && (
                  <Button
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setMembersDialogOpen(true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Пригласить
                  </Button>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Владелец */}
                {project.owner && (
                  <Chip
                    avatar={
                      <Avatar src={getAvatarUrl(project.owner.avatar)}>
                        {project.owner.firstName?.[0]}
                      </Avatar>
                    }
                    label={`${project.owner.firstName} ${project.owner.lastName} (владелец)`}
                    color="primary"
                    variant="outlined"
                    onClick={() => navigate(`/users/${project.owner.id}`)}
                    sx={{ cursor: 'pointer' }}
                  />
                )}
                {/* Участники */}
                {project.members && project.members.length > 0 ? (
                  project.members.map((member) => (
                    <Chip
                      key={member.id}
                      avatar={
                        <Avatar src={getAvatarUrl(member.avatar)}>
                          {member.firstName?.[0]}
                        </Avatar>
                      }
                      label={`${member.firstName} ${member.lastName}`}
                      variant="outlined"
                      onClick={() => navigate(`/users/${member.id}`)}
                      onDelete={
                        user && (project.ownerId === user.id || user.role === 'teacher' || user.role === 'admin' || member.id === user.id)
                          ? () => {
                              if (window.confirm(`Удалить ${member.firstName} ${member.lastName} из проекта?`)) {
                                removeMemberMutation.mutate(member.id);
                              }
                            }
                          : undefined
                      }
                      sx={{ cursor: 'pointer' }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Нет участников
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Создан: {format(new Date(project.createdAt), 'dd MMM yyyy в HH:mm', { locale: ru })}
              </Typography>
              {project.updatedAt && project.updatedAt !== project.createdAt && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Обновлен: {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: ru })}
                </Typography>
              )}
              <Typography 
                variant="caption" 
                color="text.secondary" 
                display="block"
                onClick={() => project.owner?.id && navigate(`/users/${project.owner.id}`)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline'
                  }
                }}
              >
                Автор: {project.owner?.firstName} {project.owner?.lastName}
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            {project.repositoryUrl && (
              <Button
                variant="outlined"
                href={project.repositoryUrl}
                target="_blank"
              >
                Репозиторий
              </Button>
            )}
            {project.deployUrl && (
              <Button
                variant="outlined"
                color="success"
                href={project.deployUrl}
                target="_blank"
              >
                Демо
              </Button>
            )}
            {user && (project.ownerId === user.id || user.role === 'teacher' || user.role === 'admin') && (
              <>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/projects/${id}/edit`)}
                >
                  Редактировать
                </Button>
                {project.status === 'archived' ? (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => {
                      if (window.confirm('Вы уверены, что хотите разархивировать этот проект?')) {
                        unarchiveProjectMutation.mutate(id);
                      }
                    }}
                    disabled={unarchiveProjectMutation.isLoading}
                  >
                    {unarchiveProjectMutation.isLoading ? 'Разархивирование...' : 'Разархивировать'}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => {
                      if (window.confirm('Вы уверены, что хотите архивировать этот проект? Проект будет скрыт из основного списка.')) {
                        archiveProjectMutation.mutate(id);
                      }
                    }}
                    disabled={archiveProjectMutation.isLoading}
                  >
                    {archiveProjectMutation.isLoading ? 'Архивирование...' : 'Архивировать'}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
                      deleteProjectMutation.mutate(id);
                    }
                  }}
                  disabled={deleteProjectMutation.isLoading}
                >
                  {deleteProjectMutation.isLoading ? 'Удаление...' : 'Удалить'}
                </Button>
              </>
            )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Майлстоуны */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Майлстоуны ({milestones.filter(m => m.completed).length}/{milestones.length})
            </Typography>
            {user && (project.ownerId === user.id || user.role === 'teacher' || user.role === 'admin') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingMilestone(null);
                  setMilestoneForm({ title: '', description: '', dueDate: '' });
                  setMilestoneDialogOpen(true);
                }}
              >
                Добавить майлстоун
              </Button>
            )}
          </Box>
          {milestones.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(milestones.filter(m => m.completed).length / milestones.length) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
          {milestones.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Майлстоуны не добавлены
            </Typography>
          ) : (
            <List>
              {milestones.map((milestone) => (
                <ListItem
                  key={milestone.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: milestone.completed ? 'action.selected' : 'background.paper'
                  }}
                >
                  <Checkbox
                    checked={milestone.completed}
                    onChange={(e) => {
                      if (user && (project.ownerId === user.id || user.role === 'teacher')) {
                        toggleMilestoneMutation.mutate({
                          milestoneId: milestone.id,
                          completed: e.target.checked
                        });
                      }
                    }}
                    disabled={!user || (project.ownerId !== user.id && user.role !== 'teacher')}
                    icon={<RadioButtonUncheckedIcon />}
                    checkedIcon={<CheckCircleIcon />}
                  />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            textDecoration: milestone.completed ? 'line-through' : 'none',
                            opacity: milestone.completed ? 0.6 : 1
                          }}
                        >
                          {milestone.title}
                        </Typography>
                        {milestone.dueDate && (
                          <Chip
                            label={format(new Date(milestone.dueDate), 'dd MMM yyyy', { locale: ru })}
                            size="small"
                            color={new Date(milestone.dueDate) < new Date() && !milestone.completed ? 'error' : 'default'}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        {milestone.description && (
                          <Typography
                            variant="body2"
                            sx={{
                              textDecoration: milestone.completed ? 'line-through' : 'none',
                              opacity: milestone.completed ? 0.6 : 1
                            }}
                          >
                            {milestone.description}
                          </Typography>
                        )}
                        {milestone.completedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Завершен: {format(new Date(milestone.completedAt), 'dd MMM yyyy', { locale: ru })}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  {user && (project.ownerId === user.id || user.role === 'teacher' || user.role === 'admin') && (
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingMilestone(milestone);
                          setMilestoneForm({
                            title: milestone.title,
                            description: milestone.description || '',
                            dueDate: milestone.dueDate ? format(new Date(milestone.dueDate), 'yyyy-MM-dd') : ''
                          });
                          setMilestoneDialogOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (window.confirm('Удалить майлстоун?')) {
                            deleteMilestoneMutation.mutate(milestone.id);
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Файлы проекта */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Файлы ({projectFiles.length})
            </Typography>
            {user && (project.ownerId === user.id || user.role === 'teacher' || user.role === 'admin') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadIcon />}
                onClick={() => setFileUploadDialogOpen(true)}
              >
                Загрузить файл
              </Button>
            )}
          </Box>
          {projectFiles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Файлы не загружены
            </Typography>
          ) : (
            <List>
              {projectFiles.map((file) => (
                <ListItem
                  key={file.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <AttachFileIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText
                    primary={file.originalName}
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatFileSize(file.size)} •{' '}
                          <Typography
                            component="span"
                            variant="caption"
                            onClick={() => file.uploader?.id && navigate(`/users/${file.uploader.id}`)}
                            sx={{
                              cursor: 'pointer',
                              color: 'text.secondary',
                              '&:hover': {
                                color: 'primary.main',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {file.uploader?.firstName} {file.uploader?.lastName}
                          </Typography>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(file.createdAt), 'dd MMM yyyy в HH:mm', { locale: ru })}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleFileDownload(file.id, file.originalName)}
                      color="primary"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    {user && (file.uploadedBy === user.id || project.ownerId === user.id || user.role === 'teacher' || user.role === 'admin') && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (window.confirm('Вы уверены, что хотите удалить этот файл?')) {
                            deleteFileMutation.mutate(file.id);
                          }
                        }}
                        color="error"
                        disabled={deleteFileMutation.isLoading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {user && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Оценить проект
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Rating
                value={ratingValue}
                onChange={(e, newValue) => setRatingValue(newValue)}
              />
              <Button
                variant="contained"
                onClick={handleRatingSubmit}
                disabled={ratingValue === 0 || ratingMutation.isLoading}
              >
                Отправить оценку
              </Button>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Комментарии ({project.comments?.length || 0})
          </Typography>
          {user && (
            <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Оставьте комментарий..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" disabled={!commentText.trim()}>
                Отправить
              </Button>
            </Box>
          )}
          {groupComments?.map((comment) => (
            <Box key={comment.id} sx={{ mb: 2 }}>
              <Box sx={{ 
                p: 2, 
                bgcolor: isDark ? '#21262d' : 'grey.100', 
                borderRadius: 1,
                border: isDark ? '1px solid #30363d' : 'none'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar 
                    src={getAvatarUrl(comment.author?.avatar)} 
                    sx={{ 
                      mr: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s'
                      }
                    }}
                    onClick={() => comment.author?.id && navigate(`/users/${comment.author.id}`)}
                  >
                    {!comment.author?.avatar && comment.author?.firstName?.[0]}
                  </Avatar>
                  <Typography 
                    variant="subtitle2"
                    onClick={() => comment.author?.id && navigate(`/users/${comment.author.id}`)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {comment.author?.firstName} {comment.author?.lastName}
                  </Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {user && (
                      <IconButton
                        size="small"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      >
                        <ReplyIcon fontSize="small" />
                      </IconButton>
                    )}
                    {(user?.id === comment.author?.id || user?.role === 'teacher' || user?.role === 'admin') && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteComment(comment.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Typography variant="caption">
                      {format(new Date(comment.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2">{comment.content}</Typography>
                
                {/* Ответы на комментарий */}
                {comment.replies && comment.replies.length > 0 && (
                  <Box sx={{ mt: 2, ml: 4 }}>
                    {comment.replies.map((reply) => (
                      <Box key={reply.id} sx={{ 
                        mb: 1, 
                        p: 1.5, 
                        bgcolor: isDark ? '#161b22' : 'grey.50', 
                        borderRadius: 1,
                        border: isDark ? '1px solid #30363d' : 'none'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Avatar 
                            src={getAvatarUrl(reply.author?.avatar)} 
                            sx={{ 
                              mr: 1, 
                              width: 24, 
                              height: 24,
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.8,
                                transform: 'scale(1.1)',
                                transition: 'all 0.2s'
                              }
                            }}
                            onClick={() => reply.author?.id && navigate(`/users/${reply.author.id}`)}
                          >
                            {!reply.author?.avatar && reply.author?.firstName?.[0]}
                          </Avatar>
                          <Typography 
                            variant="caption" 
                            fontWeight="bold"
                            onClick={() => reply.author?.id && navigate(`/users/${reply.author.id}`)}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': {
                                color: 'primary.main',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {reply.author?.firstName} {reply.author?.lastName}
                          </Typography>
                          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            {(user?.id === reply.author?.id || user?.role === 'teacher') && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteComment(reply.id)}
                                color="error"
                                sx={{ width: 20, height: 20 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                            <Typography variant="caption" fontSize="0.7rem">
                              {format(new Date(reply.createdAt), 'dd MMM HH:mm', { locale: ru })}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" fontSize="0.875rem">{reply.content}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Форма ответа */}
                {user && replyingTo === comment.id && (
                  <Box sx={{ mt: 2, ml: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Написать ответ..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={!replyText.trim()}
                      >
                        Отправить
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                      >
                        Отмена
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Диалог изменения прогресса */}
      <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)}>
        <DialogTitle>Изменить прогресс проекта</DialogTitle>
        <DialogContent>
          <Box sx={{ width: 300, pt: 2 }}>
            <Typography gutterBottom>Прогресс: {progressValue}%</Typography>
            <Slider
              value={progressValue}
              onChange={(e, newValue) => setProgressValue(newValue)}
              min={0}
              max={100}
              step={5}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleProgressChange}
            variant="contained"
            disabled={updateProgressMutation.isLoading}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог создания/редактирования майлстоуна */}
      <Dialog open={milestoneDialogOpen} onClose={() => {
        setMilestoneDialogOpen(false);
        setEditingMilestone(null);
        setMilestoneForm({ title: '', description: '', dueDate: '' });
      }}>
        <DialogTitle>
          {editingMilestone ? 'Редактировать майлстоун' : 'Создать майлстоун'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={milestoneForm.title}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            value={milestoneForm.description}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Срок выполнения"
            type="date"
            value={milestoneForm.dueDate}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setMilestoneDialogOpen(false);
            setEditingMilestone(null);
            setMilestoneForm({ title: '', description: '', dueDate: '' });
          }}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editingMilestone) {
                updateMilestoneMutation.mutate({
                  milestoneId: editingMilestone.id,
                  ...milestoneForm
                });
              } else {
                createMilestoneMutation.mutate(milestoneForm);
              }
            }}
            disabled={!milestoneForm.title.trim() || createMilestoneMutation.isLoading || updateMilestoneMutation.isLoading}
          >
            {editingMilestone ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог загрузки файла */}
      <Dialog open={fileUploadDialogOpen} onClose={() => {
        setFileUploadDialogOpen(false);
        setSelectedFile(null);
      }}>
        <DialogTitle>Загрузить файл</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ mb: 2, textTransform: 'none', fontWeight: 500 }}
            >
              {selectedFile ? 'Изменить файл' : 'Выбрать файл'}
              <input
                type="file"
                hidden
                onChange={handleFileSelect}
              />
            </Button>
            {selectedFile && (
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFileIcon sx={{ color: 'text.secondary' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(selectedFile.size)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFileUploadDialogOpen(false);
              setSelectedFile(null);
            }}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={!selectedFile || uploadFileMutation.isLoading}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            {uploadFileMutation.isLoading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог управления участниками */}
      <Dialog 
        open={membersDialogOpen} 
        onClose={() => {
          setMembersDialogOpen(false);
          setSearchMember('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon />
            Пригласить участника
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={searchUsers}
              loading={searchUsersLoading}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
              onInputChange={(event, newInputValue) => {
                setSearchMember(newInputValue);
              }}
              onChange={(event, newValue) => {
                if (newValue) {
                  inviteMemberMutation.mutate(newValue.id);
                  setSearchMember('');
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Поиск пользователя"
                  placeholder="Начните вводить имя или email"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {searchUsersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <Avatar src={getAvatarUrl(option.avatar)} sx={{ width: 32, height: 32 }}>
                    {option.firstName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {option.firstName} {option.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText={searchMember.length < 2 ? "Введите минимум 2 символа для поиска" : "Пользователи не найдены"}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setMembersDialogOpen(false);
              setSearchMember('');
            }}
            sx={{ textTransform: 'none' }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDetail;

