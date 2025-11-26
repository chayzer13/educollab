import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import CreateProject from './pages/CreateProject';
import EditProject from './pages/EditProject';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import CreateTeam from './pages/CreateTeam';
import Invitations from './pages/Invitations';
import Profile from './pages/Profile';
import Statistics from './pages/Statistics';
import ActivityHistory from './pages/ActivityHistory';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppRoutes() {
  const { user, loading } = useAuth();

  // Показываем загрузку, чтобы избежать редиректа во время проверки аутентификации
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route
          path="/projects/:id/edit"
          element={user ? <EditProject /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects/create"
          element={user ? <CreateProject /> : <Navigate to="/login" />}
        />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route
          path="/teams/create"
          element={user ? <CreateTeam /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/invitations"
          element={user ? <Invitations /> : <Navigate to="/login" />}
        />
        <Route
          path="/statistics"
          element={user ? <Statistics /> : <Navigate to="/login" />}
        />
        <Route
          path="/activity"
          element={user ? <ActivityHistory /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <Admin />
            ) : user ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/users/:id"
          element={user ? <UserDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/users"
          element={user ? <Users /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

