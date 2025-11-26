import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box sx={{ 
            width: 64, 
            height: 64, 
            borderRadius: 2,
            background: isDark 
              ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'
              : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: isDark 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <PersonAddIcon sx={{ fontSize: 36, color: '#ffffff' }} />
          </Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Регистрация
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Создайте аккаунт в EduCollab
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Имя"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Фамилия"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Пароль"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            helperText="Минимум 6 символов"
          />
          <TextField
            fullWidth
            select
            label="Роль"
            name="role"
            value={formData.role}
            onChange={handleChange}
            margin="normal"
          >
            <MenuItem value="student">Студент</MenuItem>
            <MenuItem value="teacher">Преподаватель</MenuItem>
            <MenuItem value="mentor">Ментор</MenuItem>
          </TextField>
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
          >
            Зарегистрироваться
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;

