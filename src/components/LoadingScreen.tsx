import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import EvStationIcon from '@mui/icons-material/EvStation';

const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        gap: 3,
      }}
    >
      {/* App Icon */}
      <Box
        sx={{
          width: 120,
          height: 120,
          backgroundColor: '#4CAF50',
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
        }}
      >
        <EvStationIcon sx={{ fontSize: 60, color: 'white' }} />
      </Box>

      {/* App Title */}
      <Typography variant="h4" sx={{ color: '#333', fontWeight: 'bold' }}>
        ChargeMate
      </Typography>

      {/* Loading Indicator */}
      <CircularProgress size={40} sx={{ color: '#4CAF50' }} />

      {/* Loading Text */}
      <Typography variant="body1" sx={{ color: '#666' }}>
        Loading your EV charging companion...
      </Typography>
    </Box>
  );
};

export default LoadingScreen; 