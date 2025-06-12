import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
} from '@mui/material';
import {
  Logout,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          Profile
        </Typography>

        {/* User Profile Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Avatar
              src={user?.picture}
              alt={user?.name}
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 3,
                border: '4px solid #4CAF50',
              }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              {user?.name || 'EV Driver'}
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              {user?.email || 'user@example.com'}
            </Typography>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              size="large"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                borderColor: '#ffebee',
                backgroundColor: '#fff5f5',
                '&:hover': {
                  borderColor: '#ffcdd2',
                  backgroundColor: '#ffebee',
                },
              }}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Box sx={{ textAlign: 'center', mt: 6, mb: 2 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            ChargeMate v1.0.0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your EV Charging Companion
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ProfilePage; 