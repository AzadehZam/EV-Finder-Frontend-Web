import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import EvStationIcon from '@mui/icons-material/EvStation';
import { useAuth } from '../contexts/AuthContext';

const WelcomePage: React.FC = () => {
  const { login } = useAuth();

  const handleGetStarted = () => {
    login();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 4, md: 0 },
        overflow: 'hidden',
      }}
    >
      <Container 
        maxWidth={false}
        sx={{ 
          maxWidth: { xs: 'sm', md: 'none' },
          px: { xs: 3, md: 6, lg: 8 },
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: { xs: 'auto', md: '80vh' },
            gap: { xs: 4, md: 6, lg: 12 },
          }}
        >
          {/* Left side - Content */}
          <Box
            sx={{
              flex: { xs: 'none', md: 1 },
              textAlign: { xs: 'center', md: 'left' },
              maxWidth: { xs: '100%', md: '50%', lg: '45%' },
              pr: { md: 4, lg: 8 },
            }}
          >
            {/* App Icon - smaller on desktop */}
            <Box
              sx={{
                width: { xs: 120, md: 80 },
                height: { xs: 120, md: 80 },
                backgroundColor: '#4CAF50',
                borderRadius: 3,
                display: { xs: 'flex', md: 'inline-flex' },
                alignItems: 'center',
                justifyContent: 'center',
                mb: { xs: 4, md: 3 },
                mx: { xs: 'auto', md: 0 },
                boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
              }}
            >
              <EvStationIcon sx={{ fontSize: { xs: 60, md: 40 }, color: 'white' }} />
            </Box>

            {/* App Title */}
            <Typography
              variant="h1"
              sx={{
                fontWeight: 'bold',
                color: '#333',
                mb: { xs: 2, md: 3 },
                fontSize: { 
                  xs: '2.5rem', 
                  sm: '3rem', 
                  md: '4rem', 
                  lg: '5rem',
                  xl: '6rem'
                },
                lineHeight: 1.1,
              }}
            >
              ChargeMate
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="h4"
              sx={{
                color: '#666',
                mb: { xs: 4, md: 6 },
                fontWeight: 400,
                fontSize: { 
                  xs: '1.25rem', 
                  md: '1.75rem',
                  lg: '2rem'
                },
              }}
            >
              Your EV Charging Companion
            </Typography>

            {/* Features list for desktop */}
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                mb: 6,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                Everything you need for EV charging:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#666', fontSize: '1.1rem' }}>
                🔍 Find nearby charging stations
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#666', fontSize: '1.1rem' }}>
                📅 Reserve charging sessions
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#666', fontSize: '1.1rem' }}>
                ⚡ Real-time availability
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#666', fontSize: '1.1rem' }}>
                📊 Manage your charging history
              </Typography>
            </Box>

            {/* Decorative Dots - only on mobile */}
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 6,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#4CAF50',
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#E0E0E0',
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#E0E0E0',
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#E0E0E0',
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#E0E0E0',
                }}
              />
            </Box>

            {/* Get Started Button */}
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                py: { xs: 2, md: 3 },
                px: { xs: 4, md: 8 },
                fontSize: { xs: '1.1rem', md: '1.3rem', lg: '1.4rem' },
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                minWidth: { xs: '100%', sm: 200, md: 300 },
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)',
                  transform: 'translateY(-4px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Get Started
            </Button>
          </Box>

          {/* Right side - Hero Image/Illustration for desktop */}
          <Box
            sx={{
              flex: { xs: 'none', md: 1 },
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              maxWidth: { md: '50%', lg: '55%' },
              position: 'relative',
            }}
          >
            {/* Background decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                width: '120%',
                height: '120%',
                background: 'radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: 0,
              }}
            />
            
            {/* Large decorative EV charging illustration */}
            <Box
              sx={{
                width: { md: 350, lg: 450, xl: 550 },
                height: { md: 350, lg: 450, xl: 550 },
                background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 30px 80px rgba(76, 175, 80, 0.4)',
                position: 'relative',
                zIndex: 1,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: '110%',
                  height: '110%',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(129, 199, 132, 0.1) 100%)',
                  zIndex: -1,
                },
              }}
            >
              <EvStationIcon sx={{ fontSize: { md: 140, lg: 180, xl: 220 }, color: 'white' }} />
            </Box>
          </Box>
        </Box>

        {/* Bottom section for mobile */}
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            textAlign: 'center',
            mt: 4,
          }}
        >
          <Typography variant="body2" sx={{ color: '#999', mb: 1 }}>
            Find charging stations • Make reservations • Track usage
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default WelcomePage; 