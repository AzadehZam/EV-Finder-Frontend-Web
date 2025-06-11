import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Autocomplete,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
} from '@mui/material';
import {
  Search,
  EvStation,
  LocationOn,
  Navigation,
  FilterList,
  Refresh,
  Clear,
  TuneRounded,
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
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConnectorTypes, setSelectedConnectorTypes] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(100);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1]);
  const [minRating, setMinRating] = useState(0);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating' | 'availability'>('distance');
  
  // Data states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsError, setStationsError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Available options for filters
  const availableConnectorTypes = useMemo(() => {
    const types = new Set<string>();
    stations.forEach(station => {
      station.connectorTypes.forEach(connector => {
        types.add(connector.type);
      });
    });
    return Array.from(types).sort();
  }, [stations]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial data fetch
  useEffect(() => {
    getCurrentLocation();
    fetchStations();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      fetchStations(true); // Silent refresh
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedSearchQuery || selectedConnectorTypes.length > 0) {
      performRealTimeSearch();
    }
  }, [debouncedSearchQuery, selectedConnectorTypes, sortBy]);

  const fetchStations = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const searchParams: Record<string, any> = {};
      
      // Add location-based search if available
      if (userLocation) {
        searchParams.lat = userLocation.lat;
        searchParams.lng = userLocation.lng;
        searchParams.radius = maxDistance;
      }

      const response = await ApiService.getStations(searchParams);
      if (response.success) {
        setStations(response.data);
        setStationsError(null);
        setLastRefresh(new Date());
      } else {
        setStationsError('Failed to load charging stations');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      if (!silent) {
        setStationsError('Failed to load charging stations');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const performRealTimeSearch = useCallback(async () => {
    setSearchLoading(true);
    
    try {
      const searchParams: Record<string, any> = {};
      
      if (debouncedSearchQuery) {
        searchParams.search = debouncedSearchQuery;
      }
      
      if (selectedConnectorTypes.length > 0) {
        searchParams.connectorTypes = selectedConnectorTypes.join(',');
      }
      
      if (userLocation) {
        searchParams.lat = userLocation.lat;
        searchParams.lng = userLocation.lng;
        searchParams.radius = maxDistance;
      }
      
      searchParams.sortBy = sortBy;
      
      const response = await ApiService.getStations(searchParams);
      if (response.success) {
        setStations(response.data);
        setStationsError(null);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error performing real-time search:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [debouncedSearchQuery, selectedConnectorTypes, userLocation, maxDistance, sortBy]);

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

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedConnectorTypes([]);
    setMaxDistance(100);
    setPriceRange([0, 1]);
    setMinRating(0);
    setSortBy('distance');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedConnectorTypes.length > 0) count++;
    if (maxDistance < 100) count++;
    if (priceRange[0] > 0 || priceRange[1] < 1) count++;
    if (minRating > 0) count++;
    return count;
  };

  const refreshStations = () => {
    fetchStations();
  };

  // Enhanced filtering with all criteria
  const filteredChargers = useMemo(() => {
    return stations
      .filter(charger => {
        // Text search
        if (debouncedSearchQuery) {
          const query = debouncedSearchQuery.toLowerCase();
          const matchesName = charger.name.toLowerCase().includes(query);
          const matchesAddress = charger.address.street.toLowerCase().includes(query) ||
                                 charger.address.city.toLowerCase().includes(query) ||
                                 charger.address.state.toLowerCase().includes(query);
          const matchesAmenities = charger.amenities?.some(amenity => 
            amenity.toLowerCase().includes(query)
          );
          
          if (!matchesName && !matchesAddress && !matchesAmenities) {
            return false;
          }
        }

        // Connector type filter
        if (selectedConnectorTypes.length > 0) {
          const hasMatchingConnector = charger.connectorTypes.some(connector =>
            selectedConnectorTypes.includes(connector.type)
          );
          if (!hasMatchingConnector) return false;
        }

        // Rating filter
        if (charger.rating < minRating) {
          return false;
        }

        // Price range filter
        const normalizedPrice = Math.min(charger.pricing.perKwh / 1.0, 1); // Normalize to 0-1 range
        if (normalizedPrice < priceRange[0] || normalizedPrice > priceRange[1]) {
          return false;
        }

        return true;
      })
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
        // Distance filter
        return charger.distanceValue <= maxDistance;
      })
      .sort((a, b) => {
        // Enhanced sorting
        switch (sortBy) {
          case 'distance':
            return a.distanceValue - b.distanceValue;
          case 'price':
            return a.pricing.perKwh - b.pricing.perKwh;
          case 'rating':
            return b.rating - a.rating;
          default:
            return a.distanceValue - b.distanceValue;
        }
      });
  }, [stations, debouncedSearchQuery, selectedConnectorTypes, userLocation, maxDistance, priceRange, minRating, sortBy]);

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
        <Button variant="contained" onClick={refreshStations}>
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
          {/* Search Input with Loading Indicator */}
          <Box sx={{ position: 'relative', mb: 1 }}>
            <TextField
              fullWidth
              placeholder="Search stations, locations, amenities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {searchLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Search />
                    )}
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchQuery('')}
                      size="small"
                      edge="end"
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Filter Controls */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <Badge badgeContent={getActiveFilterCount()} color="primary">
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                size="small"
                startIcon={<TuneRounded />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </Badge>

            {getActiveFilterCount() > 0 && (
              <Button
                variant="text"
                size="small"
                startIcon={<Clear />}
                onClick={clearAllFilters}
                color="secondary"
              >
                Clear
              </Button>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={realTimeUpdates}
                  onChange={(e) => setRealTimeUpdates(e.target.checked)}
                  size="small"
                />
              }
              label="Live"
              sx={{ ml: 'auto', mr: 0 }}
            />
          </Box>

          {/* Results Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredChargers.length} station{filteredChargers.length !== 1 ? 's' : ''} found
              {searchLoading && ' (updating...)'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lastRefresh.toLocaleTimeString()}
            </Typography>
          </Box>
          
          {locationError && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {locationError}
            </Alert>
          )}
        </Box>

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="bottom"
          open={showFilters && isMobile}
          onClose={() => setShowFilters(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '70vh',
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Search Filters
              </Typography>
              <IconButton onClick={() => setShowFilters(false)} size="small">
                <Clear />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Sort By */}
              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                </Select>
              </FormControl>

              {/* Connector Types */}
              <FormControl fullWidth>
                <Autocomplete
                  multiple
                  options={availableConnectorTypes}
                  value={selectedConnectorTypes}
                  onChange={(_, newValue) => setSelectedConnectorTypes(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Connector Types"
                      placeholder="Select connector types"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                />
              </FormControl>

              {/* Distance Range */}
              <Box>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                  Max Distance: {maxDistance} km
                </Typography>
                <Slider
                  value={maxDistance}
                  onChange={(_, newValue) => setMaxDistance(newValue as number)}
                  min={1}
                  max={200}
                  marks={[
                    { value: 5, label: '5km' },
                    { value: 25, label: '25km' },
                    { value: 50, label: '50km' },
                    { value: 100, label: '100km' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>

              {/* Price Range */}
              <Box>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                  Price Range (CAD/kWh)
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(_, newValue) => setPriceRange(newValue as [number, number])}
                  min={0}
                  max={1}
                  step={0.05}
                  marks={[
                    { value: 0, label: '$0' },
                    { value: 0.25, label: '$0.25' },
                    { value: 0.5, label: '$0.50' },
                    { value: 0.75, label: '$0.75' },
                    { value: 1, label: '$1.00' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `$${value.toFixed(2)}`}
                />
              </Box>

              {/* Minimum Rating */}
              <Box>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                  Minimum Rating: {minRating}/5
                </Typography>
                <Slider
                  value={minRating}
                  onChange={(_, newValue) => setMinRating(newValue as number)}
                  min={0}
                  max={5}
                  step={0.5}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 2.5, label: '2.5' },
                    { value: 5, label: '5' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={clearAllFilters}
                  startIcon={<Clear />}
                >
                  Clear All
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              </Box>
            </Box>
          </Box>
        </Drawer>

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
        {/* Search Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            EV Charging Stations
          </Typography>
          
          {/* Search Input with Loading Indicator */}
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search stations, locations, amenities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {searchLoading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Search />
                    )}
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchQuery('')}
                      size="small"
                      edge="end"
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Filter Controls */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <Badge badgeContent={getActiveFilterCount()} color="primary">
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                size="small"
                startIcon={<TuneRounded />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </Badge>

            {getActiveFilterCount() > 0 && (
              <Button
                variant="text"
                size="small"
                startIcon={<Clear />}
                onClick={clearAllFilters}
                color="secondary"
              >
                Clear
              </Button>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={realTimeUpdates}
                  onChange={(e) => setRealTimeUpdates(e.target.checked)}
                  size="small"
                />
              }
              label="Live"
              sx={{ ml: 'auto', mr: 0 }}
            />
          </Box>

          {/* Results Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredChargers.length} station{filteredChargers.length !== 1 ? 's' : ''} found
              {searchLoading && ' (updating...)'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lastRefresh.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>

        {/* Location Error */}
        {locationError && (
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
              {locationError}
            </Alert>
          </Box>
        )}
        
        {/* Station List */}
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

      {/* Desktop Filter Dialog */}
      <Dialog
        open={showFilters && !isMobile}
        onClose={() => setShowFilters(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Search Filters
          </Typography>
          <IconButton onClick={() => setShowFilters(false)} size="small">
            <Clear />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, pt: 1 }}>
            {/* Sort By */}
            <FormControl fullWidth>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <MenuItem value="distance">Distance</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
              </Select>
            </FormControl>

            {/* Connector Types */}
            <FormControl fullWidth>
              <Autocomplete
                multiple
                options={availableConnectorTypes}
                value={selectedConnectorTypes}
                onChange={(_, newValue) => setSelectedConnectorTypes(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Connector Types"
                    placeholder="Select connector types"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
              />
            </FormControl>

            {/* Distance Range */}
            <Box>
              <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                Max Distance: {maxDistance} km
              </Typography>
              <Slider
                value={maxDistance}
                onChange={(_, newValue) => setMaxDistance(newValue as number)}
                min={1}
                max={200}
                marks={[
                  { value: 5, label: '5km' },
                  { value: 50, label: '50km' },
                  { value: 100, label: '100km' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* Price Range */}
            <Box>
              <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                Price Range (CAD/kWh)
              </Typography>
              <Slider
                value={priceRange}
                onChange={(_, newValue) => setPriceRange(newValue as [number, number])}
                min={0}
                max={1}
                step={0.05}
                marks={[
                  { value: 0, label: '$0' },
                  { value: 0.5, label: '$0.50' },
                  { value: 1, label: '$1' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `$${value.toFixed(2)}`}
              />
            </Box>

            {/* Minimum Rating - Full Width */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                Minimum Rating: {minRating}/5
              </Typography>
              <Slider
                value={minRating}
                onChange={(_, newValue) => setMinRating(newValue as number)}
                min={0}
                max={5}
                step={0.5}
                marks={[
                  { value: 0, label: '0' },
                  { value: 2.5, label: '2.5' },
                  { value: 5, label: '5' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={clearAllFilters}
            startIcon={<Clear />}
            sx={{ flex: 1 }}
          >
            Clear All Filters
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowFilters(false)}
            sx={{ flex: 1 }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChargerFinderPage; 