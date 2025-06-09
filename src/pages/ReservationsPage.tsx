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
  Delete,
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
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; reservation: Reservation | null }>({
    open: false,
    reservation: null,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000); // Hide after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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
        setError(null);
        setSuccessMessage('Reservation cancelled successfully');
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
        setError(null);
        setSuccessMessage('Charging session started successfully');
      } else {
        setError(response.message || 'Failed to start charging session');
      }
    } catch (err: any) {
      console.error('Error starting charging session:', err);
      setError('Failed to start charging session. Please try again.');
    }
  };

  const handleCompleteReservation = async (reservation: Reservation) => {
    try {
      const response = await ApiService.updateReservation(reservation._id, { status: 'completed' });
      if (response.success) {
        fetchReservations(); // Refresh the list
        setError(null);
        setSuccessMessage('Reservation completed successfully');
      } else {
        setError(response.message || 'Failed to complete reservation');
      }
    } catch (err: any) {
      console.error('Error completing reservation:', err);
      setError('Failed to complete reservation. Please try again.');
    }
  };

  const handleDeleteReservation = async (reservation: Reservation) => {
    try {
      const response = await ApiService.deleteReservation(reservation._id);
      if (response.success) {
        fetchReservations(); // Refresh the list
        setDeleteDialog({ open: false, reservation: null });
        setError(null);
        setSuccessMessage('Reservation was deleted successfully');
      } else {
        setError(response.message || 'Failed to delete reservation');
      }
    } catch (err: any) {
      console.error('Error deleting reservation:', err);
      setError('Failed to delete reservation. Please try again.');
    }
  };

  // Function to normalize status for display - convert pending/confirmed to active
  const getDisplayStatus = (status: string) => {
    if (status === 'pending' || status === 'confirmed') {
      return 'active';
    }
    return status;
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
      case 'active':
        return '#4CAF50';
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
  const upcomingReservations = reservations.filter(r => ['active', 'confirmed', 'pending'].includes(r.status));
  const pastReservations = reservations.filter(r => 
    ['completed', 'cancelled'].includes(r.status)
  );

  const upcomingTabData = upcomingReservations;

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
        <Card key={reservation._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            flex: 1,
            justifyContent: 'space-between'
          }}>
            <Box>
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
                  icon={getStatusIcon(getDisplayStatus(reservation.status))}
                  label={getDisplayStatus(reservation.status).charAt(0).toUpperCase() + getDisplayStatus(reservation.status).slice(1)}
                  size="small"
                  sx={{ color: getStatusColor(getDisplayStatus(reservation.status)) }}
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
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
              {reservation.status === 'active' && new Date(reservation.startTime) <= new Date() && (
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
              
              {['active', 'confirmed', 'pending'].includes(reservation.status) && (
                <>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleCompleteReservation(reservation)}
                    sx={{ flex: 1 }}
                  >
                    Complete
                  </Button>
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
                </>
              )}

              {['completed', 'cancelled'].includes(reservation.status) && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteDialog({ open: true, reservation })}
                  sx={{ flex: 1 }}
                >
                  Delete
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      );
    } catch (error) {
      console.error('Error rendering reservation card:', error);
      return (
        <Card key={reservation._id || Math.random()} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            flex: 1,
            justifyContent: 'center'
          }}>
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

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
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
          alignItems: 'stretch',
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, reservation: null })}
        >
          <DialogTitle>Delete Reservation</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to permanently delete your reservation at{' '}
              <strong>{deleteDialog.reservation?.stationId?.name}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, reservation: null })}>
              Keep Reservation
            </Button>
            <Button
              onClick={() => deleteDialog.reservation && handleDeleteReservation(deleteDialog.reservation)}
              color="error"
              variant="contained"
            >
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ReservationsPage; 