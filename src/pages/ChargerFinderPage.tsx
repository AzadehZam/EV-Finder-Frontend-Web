import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Card,
  CardContent,
  Chip,
  Button,
  InputAdornment,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  EvStation,
  LocationOn,
  Navigation,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

// Add custom styles for EV charger icons
const customStyles = `
  .custom-ev-charger {
    background: none !important;
    border: none !important;
  }
  .custom-ev-charger svg {
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
    transition: all 0.3s ease;
  }
  .custom-ev-charger:hover svg {
    transform: scale(1.2);
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5));
  }
  
  /* Make sure default leaflet markers look different */
  .leaflet-marker-icon:not(.custom-ev-charger) {
    filter: drop-shadow(0 2px 4px rgba(0,100,255,0.4));
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom EV charger icons
const createEvChargerIcon = (availability: 'available' | 'limited' | 'unavailable') => {
  const colors = {
    available: '#059669',   // Dark emerald green
    limited: '#FF9800',     // Orange  
    unavailable: '#F44336'  // Red
  };

  const color = colors[availability];
  
  // Create a distinctive square/rectangular EV charger icon
  const svgIcon = `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer border -->
      <rect x="2" y="2" width="32" height="32" rx="4" fill="white" stroke="${color}" stroke-width="3"/>
      
      <!-- Inner background -->
      <rect x="5" y="5" width="26" height="26" rx="2" fill="${color}"/>
      
      <!-- EV Text -->
      <text x="18" y="16" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">EV</text>
      
      <!-- Charging plug symbol -->
      <rect x="14" y="19" width="8" height="3" rx="1" fill="white"/>
      <rect x="16" y="22" width="4" height="2" rx="1" fill="white"/>
      
      <!-- Small lightning bolt -->
      <path d="M17 26 L19 26 L18 28 L20 28 L17 31 L16 29 L18 29 L17 26 Z" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-ev-charger',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Get availability status based on available/total ports ratio
const getAvailabilityStatus = (available: number, total: number): 'available' | 'limited' | 'unavailable' => {
  if (available === 0) return 'unavailable';
  const ratio = available / total;
  if (ratio > 0.5) return 'available';
  return 'limited';
};

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
  location: {
    coordinates: [number, number];
  };
  connectorTypes: Array<{
    type: string;
    power: number;
    count: number;
    available: number;
  }>;
  pricing: {
    perKwh: number;
    currency: string;
  };
  totalPorts: number;
  availablePorts: number;
  rating: number;
  amenities: string[];
}

const ChargerFinderPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null); // Start with null
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsError, setStationsError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true); // Add separate loading state for location

  useEffect(() => {
    getCurrentLocation();
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await ApiService.getStations();
      if (response.success) {
        setStations(response.data);
        setStationsError(null);
      } else {
        setStationsError('Failed to load charging stations');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setStationsError('Failed to load charging stations');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setLocationError(null);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your exact location. Showing Vancouver area.');
          // Fall back to Vancouver if location fails
          setUserLocation({ lat: 49.2827, lng: -123.1207 });
          setLocationLoading(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser. Showing Vancouver area.');
      // Fall back to Vancouver if geolocation not supported
      setUserLocation({ lat: 49.2827, lng: -123.1207 });
      setLocationLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; 
    
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.5) return '#4CAF50';
    if (ratio > 0.2) return '#FF9800';
    return '#F44336';
  };

  const handleReserveCharger = (chargerId: string) => {
    navigate(`/reservation/${chargerId}`);
  };

  const filteredChargers = stations
    .filter(charger =>
      charger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      charger.address.street.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map((charger) => {
      if (!userLocation) return { ...charger, distance: Infinity, distanceValue: Infinity };
      
      // Calculate distance from user location
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        charger.location.coordinates[1], // lat
        charger.location.coordinates[0]  // lng
      );
      
      // Extract numeric value for filtering and sorting
      const distanceValue = parseFloat(distance.replace(/[^\d.]/g, ''));
      
      return { ...charger, distance, distanceValue };
    })
    .filter((charger) => {
      // Only show stations within 100km
      return charger.distanceValue <= 100;
    })
    .sort((a, b) => {
      // Sort by distance (closest first)
      return a.distanceValue - b.distanceValue;
    });

  if (loading || locationLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          {locationLoading ? 'Getting your location...' : 'Loading charging stations...'}
        </Typography>
      </Box>
    );
  }

  if (stationsError) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {stationsError}
        </Alert>
        <Button variant="contained" onClick={fetchStations}>
          Retry Loading Stations
        </Button>
      </Container>
    );
  }

  if (isMobile) {
    // Mobile layout - vertical stack
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Search Header */}
        <Box sx={{ p: 2, backgroundColor: 'white', borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            placeholder="Search charging stations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />
          
          {locationError && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {locationError}
            </Alert>
          )}
        </Box>

        {/* Map Container */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {userLocation && (
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* User Location Marker */}
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>Your Location</Popup>
              </Marker>
              
              {/* Charging Station Markers */}
              {filteredChargers.map((charger) => {
                const availabilityStatus = getAvailabilityStatus(charger.availablePorts, charger.totalPorts);
                // Fix coordinate order: backend gives [lng, lat] but Leaflet expects [lat, lng]
                const lat = charger.location.coordinates[1];
                const lng = charger.location.coordinates[0];
                const customIcon = createEvChargerIcon(availabilityStatus);
                
                return (
                  <Marker
                    key={charger.id}
                    position={[lat, lng]}
                    icon={customIcon}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 200 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {charger.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {charger.address.street}, {charger.address.city}, {charger.address.state}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          {charger.connectorTypes.map((connector) => (
                            <Chip key={connector.type} label={connector.type} size="small" />
                          ))}
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Available: {charger.availablePorts}/{charger.totalPorts}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          onClick={() => handleReserveCharger(charger.id)}
                        >
                          Reserve
                        </Button>
                      </Box>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </Box>

        {/* Charger List */}
        <Box sx={{ maxHeight: '40vh', overflow: 'auto', backgroundColor: 'white' }}>
          <Container sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Nearby Charging Stations ({filteredChargers.length})
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {filteredChargers.map((charger) => (
                <Box key={charger.id} sx={{ flex: '1 1 300px', minWidth: 300 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <EvStation sx={{ mr: 1, color: '#4CAF50' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: '1rem', mb: 0.5 }}>
                            {charger.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                            {charger.address.street}, {charger.address.city}, {charger.address.state}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {charger.connectorTypes.map((connector) => (
                          <Chip key={connector.type} label={connector.type} size="small" />
                        ))}
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2">
                          Available: <span style={{ color: getAvailabilityColor(charger.availablePorts, charger.totalPorts) }}>
                            {charger.availablePorts}/{charger.totalPorts}
                          </span>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {charger.pricing.currency} {charger.pricing.perKwh.toFixed(2)}/kWh
                        </Typography>
                      </Box>
                      
                      {userLocation && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          <Navigation sx={{ fontSize: 16, mr: 0.5 }} />
                          {charger.distance}
                        </Typography>
                      )}
                      
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleReserveCharger(charger.id)}
                        disabled={charger.availablePorts === 0}
                      >
                        {charger.availablePorts === 0 ? 'Unavailable' : 'Reserve'}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      </Box>
    );
  }

  // Desktop layout - side by side
  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Sidebar space */}
      <Box sx={{ width: 280, flexShrink: 0 }} />
      
      {/* Map Section - Left Side */}
      <Box sx={{ 
        flex: 1, 
        height: '100vh',
        position: 'relative',
      }}>
        {userLocation && (
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={12}
            style={{ 
              height: '100%', 
              width: '100%',
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User Location Marker */}
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Your Location</Popup>
            </Marker>
            
            {/* Charging Station Markers */}
            {filteredChargers.map((charger) => {
              const availabilityStatus = getAvailabilityStatus(charger.availablePorts, charger.totalPorts);
              // Fix coordinate order: backend gives [lng, lat] but Leaflet expects [lat, lng]
              const lat = charger.location.coordinates[1];
              const lng = charger.location.coordinates[0];
              const customIcon = createEvChargerIcon(availabilityStatus);
              
              return (
                <Marker
                  key={charger.id}
                  position={[lat, lng]}
                  icon={customIcon}
                >
                  <Popup>
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {charger.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {charger.address.street}, {charger.address.city}, {charger.address.state}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {charger.connectorTypes.map((connector) => (
                          <Chip key={connector.type} label={connector.type} size="small" />
                        ))}
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Available: {charger.availablePorts}/{charger.totalPorts}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => handleReserveCharger(charger.id)}
                      >
                        Reserve
                      </Button>
                    </Box>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </Box>

      {/* Charger List Section - Right Side */}
      <Box sx={{ 
        width: 400, 
        height: '100vh',
        backgroundColor: 'white',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Nearby Stations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredChargers.length} charging stations found
          </Typography>
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredChargers.map((charger) => (
              <Card key={charger.id} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <EvStation sx={{ mr: 1, color: '#4CAF50' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', mb: 0.5 }}>
                        {charger.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                        {charger.address.street}, {charger.address.city}, {charger.address.state}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                    {charger.connectorTypes.map((connector) => (
                      <Chip key={connector.type} label={connector.type} size="small" />
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2">
                      Available: <span style={{ color: getAvailabilityColor(charger.availablePorts, charger.totalPorts), fontWeight: 600 }}>
                        {charger.availablePorts}/{charger.totalPorts}
                      </span>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {charger.pricing.currency} {charger.pricing.perKwh.toFixed(2)}/kWh
                    </Typography>
                  </Box>
                  
                  {userLocation && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <Navigation sx={{ fontSize: 16, mr: 0.5 }} />
                      {charger.distance}
                    </Typography>
                  )}
                  
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleReserveCharger(charger.id)}
                    disabled={charger.availablePorts === 0}
                    sx={{ 
                      py: 1,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    {charger.availablePorts === 0 ? 'Unavailable' : 'Reserve'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ChargerFinderPage; 