import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  EvStation,
  Notifications,
  Help,
  Info,
  Logout,
  Edit,
  ArrowForwardIos,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const profileOptions = [
    {
      icon: <Edit />,
      title: 'Edit Profile',
      description: 'Update your personal information',
      action: () => console.log('Edit profile'),
    },
    {
      icon: <EvStation />,
      title: 'Vehicle Settings',
      description: 'Manage your EV preferences',
      action: () => console.log('Vehicle settings'),
    },
    {
      icon: <Notifications />,
      title: 'Notifications',
      description: 'Manage notification preferences',
      action: () => console.log('Notifications'),
    },
    {
      icon: <Help />,
      title: 'Help & Support',
      description: 'Get help and contact support',
      action: () => console.log('Help & Support'),
    },
    {
      icon: <Info />,
      title: 'About',
      description: 'App version and information',
      action: () => console.log('About'),
    },
  ];

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
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<Edit />}
              onClick={() => console.log('Edit profile')}
              sx={{ px: 4, py: 1.5 }}
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Profile Options */}
        <Card sx={{ mb: 4 }}>
          <List>
            {profileOptions.map((option, index) => (
              <React.Fragment key={option.title}>
                <ListItemButton 
                  onClick={option.action}
                  sx={{ py: 2 }}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        backgroundColor: '#f0f8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4CAF50',
                      }}
                    >
                      {option.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={option.title}
                    secondary={option.description}
                    sx={{ 
                      ml: 2,
                      '& .MuiListItemText-primary': {
                        fontSize: '1.1rem',
                        fontWeight: 500,
                      },
                    }}
                  />
                  <ArrowForwardIos sx={{ color: '#ccc', fontSize: 18 }} />
                </ListItemButton>
                {index < profileOptions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
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
            EV Finder v1.0.0
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