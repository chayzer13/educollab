import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationSystem from './NotificationSystem';
import { getAvatarUrl } from '../utils/avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
        <AppBar
          position="static"
          sx={{
            boxShadow: 'none'
          }}
        >
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '20px'
              }}
            >
              EduCollab
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                component={Link}
                to="/projects"
                sx={{
                  textTransform: 'none',
                  fontSize: '14px'
                }}
              >
                Проекты
              </Button>
              <Button
                component={Link}
                to="/teams"
                sx={{
                  textTransform: 'none',
                  fontSize: '14px'
                }}
              >
                Команды
              </Button>
              {user && (
                <Button
                  component={Link}
                  to="/users"
                  sx={{
                    textTransform: 'none',
                    fontSize: '14px'
                  }}
                >
                  Пользователи
                </Button>
              )}
              {user && user.role === 'admin' && (
                <Button
                  component={Link}
                  to="/admin"
                  sx={{
                    textTransform: 'none',
                    fontSize: '14px',
                    color: '#cf222e',
                    fontWeight: 600
                  }}
                >
                  Администрирование
                </Button>
              )}
          {user && (
            <>
                  <Button
                    component={Link}
                    to="/statistics"
                    sx={{
                      textTransform: 'none',
                      fontSize: '14px'
                    }}
                  >
                    Статистика
                  </Button>
                  <Button
                    component={Link}
                    to="/activity"
                    sx={{
                      textTransform: 'none',
                      fontSize: '14px'
                    }}
                  >
                    История
                  </Button>
              <NotificationSystem />
            </>
          )}
          <IconButton onClick={toggleTheme} sx={{ ml: 1 }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          {user ? (
            <>
              <Button 
                variant="contained"
                component={Link} 
                to="/projects/create"
                sx={{ 
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Создать проект
              </Button>
              <Button 
                variant="outlined"
                component={Link} 
                to="/teams/create"
                sx={{ 
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Создать команду
              </Button>
              <Button 
                component={Link} 
                to="/profile"
                sx={{ 
                  textTransform: 'none',
                  fontSize: '14px'
                }}
              >
                <Avatar 
                  src={getAvatarUrl(user.avatar)}
                  sx={{ 
                    width: 20, 
                    height: 20, 
                    mr: 1, 
                    fontSize: '12px',
                    bgcolor: user.avatar ? 'transparent' : 'primary.main'
                  }}
                >
                  {!user.avatar && user.firstName?.[0]}
                </Avatar>
                {user.firstName}
              </Button>
              <Button 
                onClick={handleLogout}
                sx={{ 
                  textTransform: 'none',
                  fontSize: '14px'
                }}
              >
                Выйти
              </Button>
            </>
          ) : (
            <>
                  <Button
                    component={Link}
                    to="/login"
                    sx={{
                      textTransform: 'none',
                      fontSize: '14px'
                    }}
                  >
                    Войти
                  </Button>
                  <Button
                    variant="contained"
                    component={Link}
                    to="/register"
                    sx={{
                      textTransform: 'none',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    Регистрация
                  </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

