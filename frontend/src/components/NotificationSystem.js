import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import {
  Snackbar,
  Alert,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Box,
  Button,
  Chip,
  Card,
  CardContent,
  Paper,
  Avatar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Group as GroupIcon,
  Person,
  Folder as FolderIcon
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const NotificationSystem = () => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const isDark = mode === 'dark';

  const { data: teamInvitations, refetch: refetchTeamInvitations } = useQuery(
    'teamInvitations',
    async () => {
      const response = await api.get('/teams/invitations');
      return response.data;
    },
    {
      enabled: !!user,
      refetchInterval: 30000
    }
  );

  const { data: projectInvitations, refetch: refetchProjectInvitations } = useQuery(
    'projectInvitations',
    async () => {
      const response = await api.get('/projects/invitations');
      return response.data;
    },
    {
      enabled: !!user,
      refetchInterval: 30000
    }
  );

  // Объединяем приглашения с мемоизацией
  const invitations = useMemo(() => [
    ...(teamInvitations || []).map(inv => ({ ...inv, type: 'team' })),
    ...(projectInvitations || []).map(inv => ({ ...inv, type: 'project' }))
  ], [teamInvitations, projectInvitations]);

  // Отслеживаем уже показанные приглашения
  const shownInvitationsRef = useRef(new Set());

  React.useEffect(() => {
    if (invitations && invitations.length > 0) {
      const newInvitations = invitations.filter(inv => 
        inv.status === 'pending' && !shownInvitationsRef.current.has(inv.id)
      );
      
      if (newInvitations.length > 0) {
        // Добавляем ID показанных приглашений
        newInvitations.forEach(inv => {
          shownInvitationsRef.current.add(inv.id);
        });
        
        // Показываем snackbar только если он еще не открыт
        setSnackbar(prev => {
          if (!prev.open) {
            return {
              open: true,
              message: `У вас ${newInvitations.length} нов${newInvitations.length === 1 ? 'ое' : 'ых'} приглашение${newInvitations.length === 1 ? '' : 'я'}`,
              severity: 'info'
            };
          }
          return prev;
        });
        
        // Автоматически закрываем через 4 секунды
        const timer = setTimeout(() => {
          setSnackbar(prev => ({ ...prev, open: false }));
        }, 4000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [invitations]);

  const pendingCount = invitations?.filter(inv => inv.status === 'pending').length || 0;

  const refetch = () => {
    refetchTeamInvitations();
    refetchProjectInvitations();
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAccept = async (invitationId, type) => {
    try {
      const endpoint = type === 'team' 
        ? `/teams/invitations/${invitationId}/accept`
        : `/projects/invitations/${invitationId}/accept`;
      await api.post(endpoint);
      queryClient.invalidateQueries('teamInvitations');
      queryClient.invalidateQueries('projectInvitations');
      queryClient.invalidateQueries('teams');
      queryClient.invalidateQueries('projects');
      setSnackbar({
        open: true,
        message: 'Приглашение принято!',
        severity: 'success'
      });
      refetch();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Ошибка при принятии приглашения',
        severity: 'error'
      });
    }
  };

  const handleReject = async (invitationId, type) => {
    try {
      const endpoint = type === 'team'
        ? `/teams/invitations/${invitationId}/reject`
        : `/projects/invitations/${invitationId}/reject`;
      await api.post(endpoint);
      queryClient.invalidateQueries('teamInvitations');
      queryClient.invalidateQueries('projectInvitations');
      setSnackbar({
        open: true,
        message: 'Приглашение отклонено',
        severity: 'info'
      });
      refetch();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Ошибка при отклонении приглашения',
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!user) return null;

  return (
    <>
      <IconButton
        onClick={handleMenuOpen}
        sx={{ 
          color: isDark ? '#f0f0f0' : '#24292f',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }
        }}
        aria-label="notifications"
      >
        <Badge 
          badgeContent={pendingCount} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontWeight: 600,
              fontSize: '0.7rem'
            }
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()} // Предотвращаем всплытие событий
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            mt: 1.5,
            borderRadius: 3,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        disableScrollLock={true} // Не блокирует прокрутку страницы
      >
        <Box sx={{
          p: 2.5,
          pb: 2,
          background: isDark 
            ? 'linear-gradient(135deg, #0969da 0%, #218bff 50%, #0969da 100%)'
            : 'linear-gradient(135deg, #0969da 0%, #218bff 50%, #0969da 100%)',
          color: 'white',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark 
              ? 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
            pointerEvents: 'none'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <NotificationsIcon sx={{ fontSize: 22, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>
                  Уведомления
                </Typography>
                {pendingCount > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.9, textShadow: '0 1px 4px rgba(0, 0, 0, 0.2)' }}>
                    {pendingCount} нов{pendingCount === 1 ? 'ое' : 'ых'} приглашени{pendingCount === 1 ? 'е' : 'я'}
                  </Typography>
                )}
              </Box>
            </Box>
            {pendingCount > 0 && (
              <Chip
                label={pendingCount}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontWeight: 700,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              />
            )}
          </Box>
        </Box>
        <Divider />
        {!invitations || invitations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              background: isDark 
                ? 'linear-gradient(135deg, rgba(9, 105, 218, 0.2) 0%, rgba(33, 139, 255, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(9, 105, 218, 0.1) 0%, rgba(33, 139, 255, 0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}>
              <NotificationsIcon sx={{ fontSize: 32, color: 'text.secondary', opacity: 0.5 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Нет новых приглашений
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 450, overflow: 'auto', p: 1.5 }}>
            {invitations.map((invitation) => (
              <Card
                key={invitation.id}
                sx={{
                  mb: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: invitation.status === 'pending' 
                    ? (isDark 
                      ? 'linear-gradient(135deg, rgba(9, 105, 218, 0.15) 0%, rgba(33, 139, 255, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(9, 105, 218, 0.1) 0%, rgba(33, 139, 255, 0.05) 100%)')
                    : 'transparent',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDark 
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                      : '0 4px 12px rgba(0, 0, 0, 0.1)'
                  },
                  ...(invitation.status === 'pending' && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #0969da 0%, #218bff 100%)',
                      opacity: 0.8
                    }
                  })
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      background: invitation.type === 'project'
                        ? (isDark 
                          ? 'linear-gradient(135deg, #0969da 0%, #218bff 100%)'
                          : 'linear-gradient(135deg, #0969da 0%, #218bff 100%)')
                        : (isDark 
                          ? 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)'
                          : 'linear-gradient(135deg, #656d76 0%, #8b949e 100%)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {invitation.type === 'project' ? (
                        <FolderIcon sx={{ fontSize: 20, color: 'white' }} />
                      ) : (
                        <GroupIcon sx={{ fontSize: 20, color: 'white' }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ 
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {invitation.type === 'project' ? invitation.project?.title : invitation.team?.name}
                        </Typography>
                        {invitation.status === 'pending' && (
                          <Chip
                            label="Новое"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: 'primary.main',
                              color: 'white'
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                          {invitation.invitedBy?.firstName?.[0]}
                        </Avatar>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          onClick={() => invitation.invitedBy?.id && navigate(`/users/${invitation.invitedBy.id}`)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              color: 'primary.main',
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {invitation.invitedBy?.firstName} {invitation.invitedBy?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          пригласил вас {invitation.type === 'project' ? 'в проект' : 'в команду'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {invitation.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => {
                          handleAccept(invitation.id, invitation.type);
                          handleMenuClose();
                        }}
                        sx={{
                          flex: 1,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 1.5,
                          bgcolor: 'success.main',
                          '&:hover': {
                            bgcolor: 'success.dark'
                          }
                        }}
                      >
                        Принять
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          handleReject(invitation.id, invitation.type);
                          handleMenuClose();
                        }}
                        sx={{
                          flex: 1,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 1.5
                        }}
                      >
                        Отклонить
                      </Button>
                    </Box>
                  )}
                  {invitation.status === 'accepted' && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                      label="Принято"
                      size="small"
                      color="success"
                      sx={{
                        height: 24,
                        fontWeight: 600
                      }}
                    />
                  )}
                  {invitation.status === 'rejected' && (
                    <Chip
                      icon={<CancelIcon sx={{ fontSize: 14 }} />}
                      label="Отклонено"
                      size="small"
                      sx={{
                        height: 24,
                        fontWeight: 600,
                        bgcolor: isDark ? 'rgba(139, 148, 158, 0.2)' : 'rgba(139, 148, 158, 0.1)',
                        color: isDark ? '#8b949e' : '#656d76'
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
        <Divider />
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            size="medium"
            onClick={() => {
              navigate('/invitations');
              handleMenuClose();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              py: 1
            }}
          >
            Показать все приглашения
          </Button>
        </Box>
      </Menu>

      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1400,
          pointerEvents: 'none',
          maxWidth: '400px'
        }}
      >
        {snackbar.open && (
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              pointerEvents: 'auto',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              animation: 'slideIn 0.3s ease-out'
            }}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSnackbarClose();
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {snackbar.message}
          </Alert>
        )}
      </Box>
    </>
  );
};

export default NotificationSystem;

