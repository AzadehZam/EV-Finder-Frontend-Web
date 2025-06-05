import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  EvStation,
  LocationOn,
  Schedule,
  ArrowBack,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import ApiService from '../services/api';

interface Station {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  connectorTypes: Array<{
    type: string;
    power: number;
    count: number;
    available: number;
  }>;
  pricing: {
    perKwh: number;
    perMinute?: number;
    sessionFee?: number;
    currency: string;
  };
  totalPorts: number;
  availablePorts: number;
}

const ReservationPage: React.FC = () => {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [startTime, setStartTime] = useState<Dayjs | null>(dayjs().add(1, 'hour'));
  const [endTime, setEndTime] = useState<Dayjs | null>(dayjs().add(2, 'hour'));
  const [connectorType, setConnectorType] = useState('');
  const [estimatedEnergy, setEstimatedEnergy] = useState(30);

  useEffect(() => {
    if (stationId) {
      fetchStationDetails();
    }
  }, [stationId]);

  const fetchStationDetails = async () => {
    try {
      // Workaround: Get station from stations list since getStationById has issues
      const response = await ApiService.getStations();
      if (response.success) {
        const foundStation = response.data.find((station: any) => station.id === stationId);
        if (foundStation) {
          setStation(foundStation);
          if (foundStation.connectorTypes.length > 0) {
            setConnectorType(foundStation.connectorTypes[0].type);
          }
        } else {
          setError('Station not found');
        }
      } else {
        setError('Failed to load station details');
      }
    } catch (err) {
      console.error('Error fetching station details:', err);
      setError('Failed to load station details');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (startTime && endTime) {
      return endTime.diff(startTime, 'hour', true);
    }
    return 0;
  };

  const calculateEstimatedCost = () => {
    if (station && startTime && endTime) {
      const duration = calculateDuration();
      const durationInMinutes = duration * 60;
      
      // Energy cost (kWh * perKwh)
      const energyCost = estimatedEnergy * station.pricing.perKwh;
      
      // Time-based cost (minutes * perMinute)
      const timeCost = station.pricing.perMinute ? durationInMinutes * station.pricing.perMinute : 0;
      
      // Session fee (one-time charge)
      const sessionFee = station.pricing.sessionFee || 0;
      
      return energyCost + timeCost + sessionFee;
    }
    return 0;
  };

  const handleSubmitReservation = async () => {
    if (!station || !startTime || !endTime || !connectorType) {
      setError('Please fill in all required fields');
      return;
    }

    if (endTime.isBefore(startTime)) {
      setError('End time must be after start time');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reservationData = {
        stationId: station.id,
        connectorType,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        estimatedEnergy,
        estimatedCost: calculateEstimatedCost(),
      };

      const response = await ApiService.createReservation(reservationData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/reservations');
        }, 2000);
      } else {
        setError(response.message || 'Failed to create reservation');
      }
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      setError('Failed to create reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!station) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error">
          Charging station not found
        </Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          Reservation created successfully! Redirecting to your reservations...
        </Alert>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/chargers')}
              sx={{ mr: 3 }}
            >
              Back to Chargers
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Book Charging Session
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Station Info */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                <EvStation sx={{ mr: 3, color: '#4CAF50', fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                    {station.name}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                    <LocationOn sx={{ fontSize: 20, mr: 1 }} />
                    {station.address.street}, {station.address.city}, {station.address.state} {station.address.zipCode}, {station.address.country}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                    <Chip label={`${station.connectorTypes[0].type} - ${station.connectorTypes[0].power} kW`} size="medium" />
                    <Chip label={`${station.pricing.currency} ${station.pricing.perKwh}/kWh`} size="medium" />
                    {station.pricing.perMinute && (
                      <Chip label={`${station.pricing.currency} ${station.pricing.perMinute}/min`} size="medium" />
                    )}
                    {station.pricing.sessionFee && (
                      <Chip label={`${station.pricing.currency} ${station.pricing.sessionFee} session fee`} size="medium" />
                    )}
                  </Box>
                  <Typography variant="h6">
                    Available: {station.availablePorts}/{station.totalPorts} chargers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Reservation Form */}
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
                Reservation Details
              </Typography>

              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                gap: 4,
                mb: 4,
              }}>
                {/* Connector Type */}
                <FormControl fullWidth>
                  <InputLabel>Connector Type</InputLabel>
                  <Select
                    value={connectorType}
                    label="Connector Type"
                    onChange={(e) => setConnectorType(e.target.value)}
                  >
                    {station.connectorTypes.map((type: any) => (
                      <MenuItem key={type.type} value={type.type}>
                        {type.type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Estimated Energy */}
                <TextField
                  fullWidth
                  label="Estimated Energy (kWh)"
                  type="number"
                  value={estimatedEnergy}
                  onChange={(e) => setEstimatedEnergy(Number(e.target.value))}
                  inputProps={{ min: 1, max: 100 }}
                />

                {/* Start Time */}
                <DateTimePicker
                  label="Start Time"
                  value={startTime}
                  onChange={(newValue) => setStartTime(newValue)}
                  minDateTime={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                {/* End Time */}
                <DateTimePicker
                  label="End Time"
                  value={endTime}
                  onChange={(newValue) => setEndTime(newValue)}
                  minDateTime={startTime || dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Summary */}
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Reservation Summary
              </Typography>

              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                gap: 3,
                mb: 4,
              }}>
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    Duration:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {calculateDuration().toFixed(1)} hours
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    Estimated Cost:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                    {station.pricing.currency} {calculateEstimatedCost().toFixed(2)}
                  </Typography>
                  {station && startTime && endTime && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Energy: {station.pricing.currency} {(estimatedEnergy * station.pricing.perKwh).toFixed(2)}
                      </Typography>
                      {station.pricing.perMinute && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Time: {station.pricing.currency} {(calculateDuration() * 60 * station.pricing.perMinute).toFixed(2)}
                        </Typography>
                      )}
                      {station.pricing.sessionFee && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Session fee: {station.pricing.currency} {station.pricing.sessionFee.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, maxWidth: 600 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/chargers')}
                  sx={{ flex: 1, py: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmitReservation}
                  disabled={submitting || !startTime || !endTime || !connectorType}
                  startIcon={submitting ? <CircularProgress size={20} /> : <Schedule />}
                  sx={{ flex: 1, py: 2 }}
                >
                  {submitting ? 'Booking...' : 'Book Reservation'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default ReservationPage; 