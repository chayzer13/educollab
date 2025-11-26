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
  Slider,
  MenuItem,
  Divider
} from '@mui/material';
import {
  People,
  Add,
  Description,
  Visibility,
  Group
} from '@mui/icons-material';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const CreateTeam = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 10,
    visibility: 'public'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const mutation = useMutation(
    (data) => api.post('/teams', data),
    {
      onSuccess: (response) => {
        // Инвалидируем все запросы команд
        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'teams' });
        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'userTeams' });
        queryClient.invalidateQueries({ queryKey: ['team', response.data.id] });
        // Принудительно обновляем списки
        queryClient.refetchQueries({ predicate: (query) => query.queryKey[0] === 'teams' });
        queryClient.refetchQueries({ predicate: (query) => query.queryKey[0] === 'userTeams' });
        navigate('/teams');
      },
      onError: (err) => {
        const errorData = err.response?.data;
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(e => e.msg || e.message).join(', ');
          setError(errorMessages || errorData.message || 'Ошибка создания команды');
        } else {
          setError(errorData?.message || 'Ошибка создания команды');
        }
      }
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMaxMembersChange = (e, newValue) => {
    setFormData({ ...formData, maxMembers: newValue });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    mutation.mutate(formData);
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
              ? 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)'
              : 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)',
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
              Создать команду
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Заполните форму для создания новой команды
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
            <People sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Основная информация
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Название команды"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
            helperText="Минимум 2 символа"
            InputProps={{
              startAdornment: <Group sx={{ mr: 1, color: 'text.secondary' }} />
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
            placeholder="Опишите вашу команду..."
            InputProps={{
              startAdornment: <Description sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 2 }} />
            }}
          />
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Group sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              Настройки команды
            </Typography>
          </Box>
          <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
            <Typography gutterBottom fontWeight={500} sx={{ mb: 2 }}>
              Максимальное количество участников: <Typography component="span" fontWeight={700} color="primary">{formData.maxMembers}</Typography>
            </Typography>
            <Slider
              value={formData.maxMembers}
              onChange={handleMaxMembersChange}
              min={2}
              max={50}
              step={1}
              marks={[
                { value: 2, label: '2' },
                { value: 10, label: '10' },
                { value: 25, label: '25' },
                { value: 50, label: '50' }
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
          <TextField
            fullWidth
            select
            label="Видимость"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            margin="normal"
            InputProps={{
              startAdornment: <Visibility sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          >
            <MenuItem value="public">Публичная</MenuItem>
            <MenuItem value="private">Закрытая</MenuItem>
          </TextField>
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/teams')}
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
              {mutation.isLoading ? 'Создание...' : 'Создать команду'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateTeam;

