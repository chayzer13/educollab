import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Folder,
  Add,
  Description,
  Visibility,
  Code,
  RocketLaunch,
  LocalOffer
} from '@mui/icons-material';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const CreateProject = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft',
    visibility: 'public',
    repositoryUrl: '',
    deployUrl: '',
    tags: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const mutation = useMutation(
    (data) => api.post('/projects', data),
    {
      onSuccess: (response) => {
        // Инвалидируем все запросы проектов (включая с фильтрами)
        // invalidateQueries с префиксом инвалидирует все запросы, начинающиеся с этого ключа
        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'projects' });
        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'userProjects' });
        queryClient.invalidateQueries({ queryKey: ['project', response.data.id] });
        // Принудительно обновляем списки
        queryClient.refetchQueries({ predicate: (query) => query.queryKey[0] === 'projects' });
        queryClient.refetchQueries({ predicate: (query) => query.queryKey[0] === 'userProjects' });
        navigate(`/projects/${response.data.id}`);
      },
      onError: (err) => {
        const errorData = err.response?.data;
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(e => e.msg || e.message).join(', ');
          setError(errorMessages || errorData.message || 'Ошибка создания проекта');
        } else {
          setError(errorData?.message || 'Ошибка создания проекта');
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
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    mutation.mutate(projectData);
  };

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
            <Add sx={{ fontSize: 32, color: '#ffffff' }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Создать проект
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Заполните форму для создания нового проекта
            </Typography>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        
        <Divider sx={{ mb: 4 }} />
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Folder sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Основная информация
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Название проекта"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              startAdornment: <Description sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <TextField
            fullWidth
            label="Описание"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            required
            placeholder="Опишите ваш проект..."
          />
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Visibility sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Настройки
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
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
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Code sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Ссылки (необязательно)
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="URL репозитория"
            name="repositoryUrl"
            value={formData.repositoryUrl}
            onChange={handleChange}
            margin="normal"
            placeholder="https://github.com/username/repo"
            InputProps={{
              startAdornment: <Code sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <TextField
            fullWidth
            label="URL деплоя"
            name="deployUrl"
            value={formData.deployUrl}
            onChange={handleChange}
            margin="normal"
            placeholder="https://your-project.com"
            InputProps={{
              startAdornment: <RocketLaunch sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocalOffer sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Теги
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Теги (через запятую)"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            margin="normal"
            placeholder="например: React, Node.js, PostgreSQL"
            InputProps={{
              startAdornment: <LocalOffer sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/projects')}
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 2,
                px: 3
              }}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={mutation.isLoading}
              startIcon={<Add />}
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 2,
                px: 4,
                boxShadow: isDark 
                  ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                  : '0 4px 12px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: isDark 
                    ? '0 6px 16px rgba(0, 0, 0, 0.4)'
                    : '0 6px 16px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              {mutation.isLoading ? 'Создание...' : 'Создать проект'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateProject;

