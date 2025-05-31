import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Schedule,
  EvStation,
  LocationOn,
  Cancel,
  PlayArrow,
  CheckCircle,
} from '@mui/icons-material';
import ApiService from '../services/api';

interface Reservation {
  _id: string;
  stationId: {
    _id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  connectorType: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalCost?: number;
  estimatedCost?: number;
  energyDelivered?: number;
}

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; reservation: Reservation | null }>({
    open: false,
    reservation: null,
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setError(null);
      const response = await ApiService.getUserReservations();
      if (response.success) {
        setReservations(response.data);
      } else {
        setError(response.message || 'Failed to fetch reservations');
      }
    } catch (err: any) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservation: Reservation) => {
    try {
      const response = await ApiService.cancelReservation(reservation._id);
      if (response.success) {
        fetchReservations(); // Refresh the list
        setCancelDialog({ open: false, reservation: null });
      } else {
        setError(response.message || 'Failed to cancel reservation');
      }
    } catch (err: any) {
      console.error('Error cancelling reservation:', err);
      setError('Failed to cancel reservation. Please try again.');
    }
  };

  const handleStartCharging = async (reservation: Reservation) => {
    try {
      const response = await ApiService.startChargingSession(reservation._id);
      if (response.success) {
        fetchReservations(); // Refresh the list
      } else {
        setError(response.message || 'Failed to start charging session');
      }
    } catch (err: any) {
      console.error('Error starting charging session:', err);
      setError('Failed to start charging session. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#4CAF50';
      case 'active':
        return '#2196F3';
      case 'completed':
        return '#666';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Schedule />;
      case 'confirmed':
        return <CheckCircle />;
      case 'active':
        return <PlayArrow />;
      case 'completed':
        return <CheckCircle />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <Schedule />;
    }
  };

  // Filter reservations based on status
  const upcomingReservations = reservations.filter(r => 
    ['pending', 'confirmed'].includes(r.status) && new Date(r.startTime) > new Date()
  );
  const activeReservations = reservations.filter(r => r.status === 'active');
  const pastReservations = reservations.filter(r => 
    ['completed', 'cancelled'].includes(r.status) || 
    (r.status === 'confirmed' && new Date(r.endTime) < new Date())
  );

  const upcomingTabData = [...activeReservations, ...upcomingReservations];

  const getTabData = () => {
    switch (activeTab) {
      case 0:
        return upcomingTabData;
      case 1:
        return pastReservations;
      default:
        return [];
    }
  };

  const renderReservationCard = (reservation: Reservation) => {
    try {
      return (
        <Card key={reservation._id}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <EvStation sx={{ mr: 1, color: '#4CAF50' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', mb: 0.5 }}>
                  {reservation.stationId?.name || 'Unknown Station'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                  {reservation.stationId?.address 
                    ? `${reservation.stationId.address.street}, ${reservation.stationId.address.city}, ${reservation.stationId.address.state}`
                    : 'Unknown Address'
                  }
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(reservation.status)}
                label={reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                size="small"
                sx={{ color: getStatusColor(reservation.status) }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Date:</strong> {formatDate(reservation.startTime)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Time:</strong> {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Connector:</strong> {reservation.connectorType}
              </Typography>
              {(reservation.totalCost || reservation.estimatedCost) && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Cost:</strong> ${(reservation.totalCost || reservation.estimatedCost)?.toFixed(2)}
                </Typography>
              )}
              {reservation.energyDelivered && (
                <Typography variant="body2">
                  <strong>Energy:</strong> {reservation.energyDelivered.toFixed(1)} kWh
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {reservation.status === 'confirmed' && new Date(reservation.startTime) <= new Date() && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayArrow />}
                  onClick={() => handleStartCharging(reservation)}
                  sx={{ flex: 1 }}
                >
                  Start
                </Button>
              )}
              
              {['pending', 'confirmed'].includes(reservation.status) && new Date(reservation.startTime) > new Date() && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => setCancelDialog({ open: true, reservation })}
                  sx={{ flex: 1 }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      );
    } catch (error) {
      console.error('Error rendering reservation card:', error);
      return (
        <Card key={reservation._id || Math.random()}>
          <CardContent>
            <Alert severity="error">
              Error displaying reservation details
            </Alert>
          </CardContent>
        </Card>
      );
    }
  };

  const renderEmptyState = (type: string) => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <EvStation sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        No {type} reservations
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {type === 'upcoming' 
          ? 'Book your first charging session to get started!'
          : 'Your completed and cancelled reservations will appear here.'
        }
      </Typography>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
          My Reservations
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 4 }}
        >
          <Tab label={`Upcoming (${upcomingTabData.length})`} />
          <Tab label={`Past (${pastReservations.length})`} />
        </Tabs>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            md: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)',
          }, 
          gap: 3,
        }}>
          {getTabData().length > 0 ? (
            getTabData().map(renderReservationCard)
          ) : (
            <Box sx={{ gridColumn: '1 / -1' }}>
              {renderEmptyState(activeTab === 0 ? 'upcoming' : 'past')}
            </Box>
          )}
        </Box>

        {/* Cancel Confirmation Dialog */}
        <Dialog
          open={cancelDialog.open}
          onClose={() => setCancelDialog({ open: false, reservation: null })}
        >
          <DialogTitle>Cancel Reservation</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel your reservation at{' '}
              <strong>{cancelDialog.reservation?.stationId?.name}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialog({ open: false, reservation: null })}>
              Keep Reservation
            </Button>
            <Button
              onClick={() => cancelDialog.reservation && handleCancelReservation(cancelDialog.reservation)}
              color="error"
              variant="contained"
            >
              Cancel Reservation
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ReservationsPage; 