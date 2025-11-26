import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  CircularProgress
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Edit as EditIcon } from '@mui/icons-material';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: project, isLoading } = useQuery(
    ['project', id],
    async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    }
  );

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft',
    repositoryUrl: '',
    deployUrl: '',
    visibility: 'public',
    tags: ''
  });

  useEffect(() => {
    if (project) {
      if (project.ownerId !== user?.id && user?.role !== 'teacher') {
        navigate('/projects');
        return;
      }
      setFormData({
        title: project.title || '',
        description: project.description || '',
        status: project.status || 'draft',
        repositoryUrl: project.repositoryUrl || '',
        deployUrl: project.deployUrl || '',
        visibility: project.visibility || 'public',
        tags: project.tags ? (Array.isArray(project.tags) ? project.tags.join(', ') : project.tags) : ''
      });
    }
  }, [project, user, navigate]);

  const mutation = useMutation(
    (data) => api.put(`/projects/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['project', id]);
        queryClient.refetchQueries(['project', id]); // Принудительно обновляем
        queryClient.refetchQueries({ predicate: (query) => query.queryKey[0] === 'projects' }); // Обновляем список
        navigate(`/projects/${id}`);
      },
      onError: (err) => {
        const errorData = err.response?.data;
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(e => e.msg || e.message).join(', ');
          setError(errorMessages || errorData.message || 'Ошибка обновления проекта');
        } else {
          setError(errorData?.message || 'Ошибка обновления проекта');
        }
      }
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const projectData = {
      ...formData,
      repositoryUrl: formData.repositoryUrl.trim() || null,
      deployUrl: formData.deployUrl.trim() || null,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    mutation.mutate(projectData);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5">Проект не найден</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={0}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
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
            <EditIcon sx={{ fontSize: 32, color: '#ffffff' }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Редактировать проект
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Обновите информацию о проекте
            </Typography>
          </Box>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Название"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            name="description"
            multiline
            rows={6}
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Статус"
            name="status"
            value={formData.status}
            onChange={handleChange}
            margin="normal"
          >
            <MenuItem value="draft">Черновик</MenuItem>
            <MenuItem value="active">Активный</MenuItem>
            <MenuItem value="completed">Завершен</MenuItem>
            <MenuItem value="archived">Архив</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Видимость"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            margin="normal"
          >
            <MenuItem value="public">Публичный</MenuItem>
            <MenuItem value="private">Закрытый</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="URL репозитория"
            name="repositoryUrl"
            value={formData.repositoryUrl}
            onChange={handleChange}
            margin="normal"
            placeholder="https://github.com/username/repo"
          />
          <TextField
            fullWidth
            label="URL деплоя"
            name="deployUrl"
            value={formData.deployUrl}
            onChange={handleChange}
            margin="normal"
            placeholder="https://myproject.com"
          />
          <TextField
            fullWidth
            label="Теги (через запятую)"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            margin="normal"
            placeholder="React, Node.js, PostgreSQL"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ 
              mt: 3,
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2,
              py: 1.5
            }}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditProject;

