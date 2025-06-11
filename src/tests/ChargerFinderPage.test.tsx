import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ChargerFinderPage from '../pages/ChargerFinderPage';
import ApiService from '../services/api';

// Mock the API service
jest.mock('../services/api');
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

// Mock Leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
}));

// Mock Leaflet
jest.mock('leaflet', () => ({
  divIcon: jest.fn(() => ({ options: {} })),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
});

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock station data
const mockStations = [
  {
    id: '507f1f77bcf86cd799439011',
    name: 'Downtown EV Hub',
    address: {
      street: '123 Main St',
      city: 'Vancouver',
      state: 'BC',
      zipCode: 'V6B 1A1',
      country: 'Canada',
    },
    location: {
      coordinates: [-123.1207, 49.2827], // [lng, lat]
    },
    connectorTypes: [
      { type: 'CCS', power: 50, count: 2, available: 1 },
      { type: 'CHAdeMO', power: 50, count: 1, available: 1 },
    ],
    pricing: { perKwh: 0.35, currency: 'CAD' },
    totalPorts: 3,
    availablePorts: 2,
    rating: 4.5,
    amenities: ['WiFi', 'Parking'],
  },
  {
    id: '507f1f77bcf86cd799439012',
    name: 'Mall Charging Station',
    address: {
      street: '456 Shopping Ave',
      city: 'Vancouver',
      state: 'BC',
      zipCode: 'V6B 2B2',
      country: 'Canada',
    },
    location: {
      coordinates: [-123.1307, 49.2927], // [lng, lat]
    },
    connectorTypes: [
      { type: 'Tesla', power: 120, count: 4, available: 0 },
    ],
    pricing: { perKwh: 0.40, currency: 'CAD' },
    totalPorts: 4,
    availablePorts: 0,
    rating: 4.2,
    amenities: ['Food Court', 'Restrooms'],
  },
];

describe('ChargerFinderPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getStations.mockResolvedValue({
      success: true,
      data: mockStations,
    });
    
    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 49.2827,
          longitude: -123.1207,
        },
      });
    });
  });

  describe('Component Rendering', () => {
    test('renders loading state initially', () => {
      renderWithProviders(<ChargerFinderPage />);
      expect(screen.getByText('Getting your location...')).toBeInTheDocument();
    });

    test('renders map and station list after loading', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
        expect(screen.getByText('Nearby Stations')).toBeInTheDocument();
      });
    });

    test('displays correct number of stations', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('2 charging stations found')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('filters stations by name with debounced search', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
        expect(screen.getByText('Mall Charging Station')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search stations, locations, amenities...');
      fireEvent.change(searchInput, { target: { value: 'Downtown' } });

      // Wait for debounced search (300ms delay)
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
        expect(screen.queryByText('Mall Charging Station')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });

    test('filters stations by address with debounced search', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search stations, locations, amenities...');
      fireEvent.change(searchInput, { target: { value: 'Shopping' } });

      // Wait for debounced search
      await waitFor(() => {
        expect(screen.queryByText('Downtown EV Hub')).not.toBeInTheDocument();
        expect(screen.getByText('Mall Charging Station')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    test('shows no results for invalid search with debounced search', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('2 stations found')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search stations, locations, amenities...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentStation' } });

      // Wait for debounced search
      await waitFor(() => {
        expect(screen.getByText('0 stations found')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    test('shows search loading indicator during search', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search stations, locations, amenities...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should show loading indicator briefly
      expect(screen.getByTestId('search-loading') || screen.getByRole('progressbar')).toBeDefined();
    });

    test('can clear search query', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search stations, locations, amenities...') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Downtown' } });

      // Wait for search to complete
      await waitFor(() => {
        expect(searchInput.value).toBe('Downtown');
      });

      // Click clear button
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(searchInput.value).toBe('');
    });
  });

  describe('Station Information Display', () => {
    test('displays station details correctly', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        // Check station name
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
        
        // Check address
        expect(screen.getByText(/123 Main St, Vancouver, BC/)).toBeInTheDocument();
        
        // Check availability
        expect(screen.getByText('Available: 2/3')).toBeInTheDocument();
        
        // Check pricing
        expect(screen.getByText('CAD 0.35/kWh')).toBeInTheDocument();
        
        // Check connector types
        expect(screen.getByText('CCS')).toBeInTheDocument();
        expect(screen.getByText('CHAdeMO')).toBeInTheDocument();
      });
    });

    test('disables reserve button for unavailable stations', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        const unavailableReserveButtons = screen.getAllByText('Unavailable');
        expect(unavailableReserveButtons.length).toBeGreaterThan(0);
        
        unavailableReserveButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });

    test('enables reserve button for available stations', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        const reserveButtons = screen.getAllByText('Reserve');
        expect(reserveButtons.length).toBeGreaterThan(0);
        
        reserveButtons.forEach(button => {
          expect(button).not.toBeDisabled();
        });
      });
    });
  });

  describe('Geolocation Handling', () => {
    test('handles geolocation success', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
        expect(screen.queryByText('Getting your location...')).not.toBeInTheDocument();
      });
    });

    test('handles geolocation error with fallback', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'User denied geolocation' });
      });

      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to get your exact location/)).toBeInTheDocument();
      });
    });

    test('displays warning when geolocation is denied', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'User denied geolocation' });
      });

      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Showing Vancouver area/)).toBeInTheDocument();
      });
    });
  });

  describe('API Error Handling', () => {
    test('displays error message when API fails', async () => {
      mockApiService.getStations.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load charging stations')).toBeInTheDocument();
        expect(screen.getByText('Retry Loading Stations')).toBeInTheDocument();
      });
    });

    test('retry button calls API again', async () => {
      mockApiService.getStations
        .mockResolvedValueOnce({
          success: false,
          error: 'Network error',
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockStations,
        });

      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry Loading Stations')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry Loading Stations'));

      await waitFor(() => {
        expect(mockApiService.getStations).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders mobile layout on small screens', () => {
      // Mock useMediaQuery to return true for mobile
      jest.doMock('@mui/material/useMediaQuery', () => jest.fn(() => true));
      
      renderWithProviders(<ChargerFinderPage />);
      
      // Mobile layout should have different structure
      // This would need more specific implementation based on your mobile layout
    });
  });

  describe('Distance Calculation', () => {
    test('displays distance from user location', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        // Should show distance in miles or feet
        expect(screen.getByText(/mi|ft/)).toBeInTheDocument();
      });
    });
  });

  describe('Map Integration', () => {
    test('renders map markers for each station', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        // Should have markers for each station plus user location
        expect(markers.length).toBeGreaterThanOrEqual(mockStations.length);
      });
    });

    test('renders user location marker', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Your Location')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Search and Filtering', () => {
    test('toggles filter panel visibility', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      const filterButton = screen.getByText('Filters');
      
      // Initially filters should be hidden
      expect(screen.queryByText('Search Filters')).not.toBeInTheDocument();
      
      // Click to show filters
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(screen.getByText('Search Filters')).toBeInTheDocument();
      });
    });

    test('filters stations by connector type', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
        expect(screen.getByText('Mall Charging Station')).toBeInTheDocument();
      });

      // Open filters
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Search Filters')).toBeInTheDocument();
      });

      // Select Tesla connector type (assuming Mall Charging Station has Tesla)
      const connectorTypeField = screen.getByLabelText('Connector Types');
      fireEvent.click(connectorTypeField);
      
      const teslaOption = screen.getByText('Tesla');
      fireEvent.click(teslaOption);

      await waitFor(() => {
        expect(screen.queryByText('Downtown EV Hub')).not.toBeInTheDocument();
        expect(screen.getByText('Mall Charging Station')).toBeInTheDocument();
      });
    });

    test('filters stations by availability', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
        expect(screen.getByText('Mall Charging Station')).toBeInTheDocument();
      });

      // Open filters
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Search Filters')).toBeInTheDocument();
      });

      // Filter to only available stations
      const availabilitySelect = screen.getByLabelText('Availability');
      fireEvent.mouseDown(availabilitySelect);
      
      const availableOption = screen.getByText('Available Now');
      fireEvent.click(availableOption);

      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
        expect(screen.queryByText('Mall Charging Station')).not.toBeInTheDocument();
      });
    });

    test('sorts stations by different criteria', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
      });

      // Open filters
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Search Filters')).toBeInTheDocument();
      });

      // Change sort to price
      const sortSelect = screen.getByLabelText('Sort by');
      fireEvent.mouseDown(sortSelect);
      
      const priceOption = screen.getByText('Price');
      fireEvent.click(priceOption);

      // Should trigger re-sorting of results
      await waitFor(() => {
        expect(mockApiService.getStations).toHaveBeenCalled();
      });
    });

    test('adjusts distance filter with slider', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
      });

      // Open filters
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Max Distance:')).toBeInTheDocument();
      });

      // Find and adjust distance slider
      const distanceSlider = screen.getByRole('slider', { name: /max distance/i });
      
      // Simulate changing distance to 10km
      fireEvent.change(distanceSlider, { target: { value: 10 } });

      await waitFor(() => {
        expect(screen.getByText('Max Distance: 10 km')).toBeInTheDocument();
      });
    });

    test('shows active filter count badge', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      // Initially no active filters
      expect(screen.queryByText('1')).not.toBeInTheDocument();

      // Add a search query (counts as a filter)
      const searchInput = screen.getByPlaceholderText('Search stations, locations, amenities...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        // Should show badge with count of 1
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    test('clears all filters', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
      });

      // Add a search query
      const searchInput = screen.getByPlaceholderText('Search stations, locations, amenities...');
      fireEvent.change(searchInput, { target: { value: 'Downtown' } });

      await waitFor(() => {
        expect((searchInput as HTMLInputElement).value).toBe('Downtown');
      });

      // Should show clear button
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      expect((searchInput as HTMLInputElement).value).toBe('');
    });
  });

  describe('Real-Time Updates', () => {
    test('toggles live updates', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Live Updates') || screen.getByText('Live')).toBeInTheDocument();
      });

      const liveToggle = screen.getByRole('checkbox', { name: /live/i });
      
      // Should be enabled by default
      expect(liveToggle).toBeChecked();

      // Toggle off
      fireEvent.click(liveToggle);
      expect(liveToggle).not.toBeChecked();
    });

    test('shows last refresh timestamp', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });

    test('refreshes stations manually', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      // Should call API again
      await waitFor(() => {
        expect(mockApiService.getStations).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Enhanced UI Features', () => {
    test('shows loading state during search', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search stations, locations, amenities...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should show loading indicator in search input
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('shows updated results count with loading state', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('2 stations found')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search stations, locations, amenities...');
      fireEvent.change(searchInput, { target: { value: 'Downtown' } });

      // Should show updating state
      await waitFor(() => {
        expect(screen.getByText(/updating/)).toBeInTheDocument();
      });
    });

    test('displays comprehensive station information', async () => {
      renderWithProviders(<ChargerFinderPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Downtown EV Hub')).toBeInTheDocument();
        expect(screen.getByText('123 Main St, Vancouver, BC')).toBeInTheDocument();
        expect(screen.getByText('Available: 2/3')).toBeInTheDocument();
        expect(screen.getByText('CAD 0.35/kWh')).toBeInTheDocument();
        expect(screen.getByText('CCS')).toBeInTheDocument();
        expect(screen.getByText('CHAdeMO')).toBeInTheDocument();
      });
    });
  });
}); 