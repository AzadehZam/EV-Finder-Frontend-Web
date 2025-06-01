// Utility functions from ChargerFinderPage that we want to test
// These would ideally be extracted to a separate utils file

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  const miles = distance * 0.621371;
  if (miles < 1) {
    return `${(miles * 5280).toFixed(0)} ft`;
  } else {
    return `${miles.toFixed(1)} mi`;
  }
};

const getAvailabilityColor = (available: number, total: number): string => {
  const ratio = available / total;
  if (ratio > 0.5) return '#4CAF50';
  if (ratio > 0.2) return '#FF9800';
  return '#F44336';
};

// Coordinate transformation utilities
const transformCoordinates = (coordinates: [number, number]): [number, number] => {
  // Backend returns [lng, lat], Leaflet expects [lat, lng]
  return [coordinates[1], coordinates[0]];
};

const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Format currency for display
const formatCurrency = (amount: number, currency: string): string => {
  return `${currency} ${amount.toFixed(2)}`;
};

// Format address for display
const formatAddress = (address: {
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
}): string => {
  const parts = [address.street, address.city, address.state];
  if (address.zipCode) {
    parts.push(address.zipCode);
  }
  return parts.join(', ');
};

describe('Utility Functions', () => {
  describe('calculateDistance', () => {
    test('calculates distance between two points correctly', () => {
      // Distance from Vancouver to Burnaby (approximately 10 miles)
      const vancouverLat = 49.2827;
      const vancouverLng = -123.1207;
      const burnabyLat = 49.2488;
      const burnabyLng = -122.9805;

      const distance = calculateDistance(vancouverLat, vancouverLng, burnabyLat, burnabyLng);
      
      // Should be roughly 9-11 miles
      expect(distance).toMatch(/^\d+\.\d+\s+mi$/);
      const miles = parseFloat(distance.split(' ')[0]);
      expect(miles).toBeGreaterThan(8);
      expect(miles).toBeLessThan(12);
    });

    test('returns feet for very short distances', () => {
      // Very close points (about 0.1 miles apart)
      const lat1 = 49.2827;
      const lng1 = -123.1207;
      const lat2 = 49.2837; // Very close
      const lng2 = -123.1217;

      const distance = calculateDistance(lat1, lng1, lat2, lng2);
      
      expect(distance).toMatch(/^\d+\s+ft$/);
      const feet = parseInt(distance.split(' ')[0]);
      expect(feet).toBeGreaterThan(0);
      expect(feet).toBeLessThan(5280); // Less than a mile in feet
    });

    test('calculates zero distance for same point', () => {
      const lat = 49.2827;
      const lng = -123.1207;

      const distance = calculateDistance(lat, lng, lat, lng);
      
      expect(distance).toBe('0 ft');
    });

    test('handles large distances correctly', () => {
      // Vancouver to New York (approximately 2400 miles)
      const vancouverLat = 49.2827;
      const vancouverLng = -123.1207;
      const newYorkLat = 40.7128;
      const newYorkLng = -74.0060;

      const distance = calculateDistance(vancouverLat, vancouverLng, newYorkLat, newYorkLng);
      
      expect(distance).toMatch(/^\d+\.\d+\s+mi$/);
      const miles = parseFloat(distance.split(' ')[0]);
      expect(miles).toBeGreaterThan(2000);
      expect(miles).toBeLessThan(3000);
    });

    test('handles negative coordinates correctly', () => {
      // Test with various hemisphere combinations
      const distance1 = calculateDistance(49.2827, -123.1207, -33.8688, 151.2093); // Vancouver to Sydney
      const distance2 = calculateDistance(-33.8688, 151.2093, 49.2827, -123.1207); // Sydney to Vancouver

      expect(distance1).toMatch(/^\d+\.\d+\s+mi$/);
      expect(distance2).toMatch(/^\d+\.\d+\s+mi$/);
      expect(distance1).toBe(distance2); // Should be symmetric
    });

    test('formats distances correctly', () => {
      // Test various distance ranges
      const shortDistance = calculateDistance(49.2827, -123.1207, 49.2830, -123.1210);
      const mediumDistance = calculateDistance(49.2827, -123.1207, 49.3, -123.2);
      const longDistance = calculateDistance(49.2827, -123.1207, 50.0, -124.0);

      expect(shortDistance).toMatch(/^\d+\s+ft$/);
      expect(mediumDistance).toMatch(/^\d+\.\d+\s+mi$/);
      expect(longDistance).toMatch(/^\d+\.\d+\s+mi$/);
    });
  });

  describe('getAvailabilityColor', () => {
    test('returns green for high availability', () => {
      expect(getAvailabilityColor(8, 10)).toBe('#4CAF50'); // 80%
      expect(getAvailabilityColor(6, 10)).toBe('#4CAF50'); // 60%
      expect(getAvailabilityColor(51, 100)).toBe('#4CAF50'); // 51%
    });

    test('returns orange for medium availability', () => {
      expect(getAvailabilityColor(5, 10)).toBe('#FF9800'); // 50%
      expect(getAvailabilityColor(3, 10)).toBe('#FF9800'); // 30%
      expect(getAvailabilityColor(21, 100)).toBe('#FF9800'); // 21%
    });

    test('returns red for low availability', () => {
      expect(getAvailabilityColor(2, 10)).toBe('#F44336'); // 20%
      expect(getAvailabilityColor(1, 10)).toBe('#F44336'); // 10%
      expect(getAvailabilityColor(0, 10)).toBe('#F44336'); // 0%
    });

    test('handles edge cases correctly', () => {
      expect(getAvailabilityColor(1, 1)).toBe('#4CAF50'); // 100%
      expect(getAvailabilityColor(0, 1)).toBe('#F44336'); // 0%
      expect(getAvailabilityColor(1, 5)).toBe('#F44336'); // 20%
    });

    test('handles decimal ratios correctly', () => {
      expect(getAvailabilityColor(1, 3)).toBe('#FF9800'); // 33.33%
      expect(getAvailabilityColor(2, 3)).toBe('#4CAF50'); // 66.66%
    });
  });

  describe('transformCoordinates', () => {
    test('swaps longitude and latitude correctly', () => {
      const backendCoords: [number, number] = [-123.1207, 49.2827]; // [lng, lat]
      const leafletCoords = transformCoordinates(backendCoords);
      
      expect(leafletCoords).toEqual([49.2827, -123.1207]); // [lat, lng]
    });

    test('handles various coordinate formats', () => {
      const testCases: Array<{input: [number, number], expected: [number, number]}> = [
        { input: [0, 0], expected: [0, 0] },
        { input: [-180, -90], expected: [-90, -180] },
        { input: [180, 90], expected: [90, 180] },
        { input: [-74.0060, 40.7128], expected: [40.7128, -74.0060] }, // NYC
      ];

      testCases.forEach(({ input, expected }) => {
        expect(transformCoordinates(input)).toEqual(expected);
      });
    });
  });

  describe('validateCoordinates', () => {
    test('validates correct coordinates', () => {
      expect(validateCoordinates(49.2827, -123.1207)).toBe(true); // Vancouver
      expect(validateCoordinates(0, 0)).toBe(true); // Equator/Prime Meridian
      expect(validateCoordinates(90, 180)).toBe(true); // Extreme valid values
      expect(validateCoordinates(-90, -180)).toBe(true); // Extreme valid values
    });

    test('rejects invalid coordinates', () => {
      expect(validateCoordinates(91, 0)).toBe(false); // Latitude too high
      expect(validateCoordinates(-91, 0)).toBe(false); // Latitude too low
      expect(validateCoordinates(0, 181)).toBe(false); // Longitude too high
      expect(validateCoordinates(0, -181)).toBe(false); // Longitude too low
      expect(validateCoordinates(100, 200)).toBe(false); // Both invalid
    });

    test('handles edge cases', () => {
      expect(validateCoordinates(90, 0)).toBe(true); // North Pole
      expect(validateCoordinates(-90, 0)).toBe(true); // South Pole
      expect(validateCoordinates(0, 180)).toBe(true); // International Date Line
      expect(validateCoordinates(0, -180)).toBe(true); // International Date Line
    });
  });

  describe('formatCurrency', () => {
    test('formats currency correctly', () => {
      expect(formatCurrency(0.35, 'CAD')).toBe('CAD 0.35');
      expect(formatCurrency(1.50, 'USD')).toBe('USD 1.50');
      expect(formatCurrency(10, 'EUR')).toBe('EUR 10.00');
    });

    test('handles decimal precision', () => {
      expect(formatCurrency(0.123, 'CAD')).toBe('CAD 0.12');
      expect(formatCurrency(0.999, 'USD')).toBe('USD 1.00');
      expect(formatCurrency(1.005, 'EUR')).toBe('EUR 1.01');
    });

    test('handles zero and negative values', () => {
      expect(formatCurrency(0, 'CAD')).toBe('CAD 0.00');
      expect(formatCurrency(-1.50, 'USD')).toBe('USD -1.50');
    });

    test('handles large numbers', () => {
      expect(formatCurrency(1000.99, 'CAD')).toBe('CAD 1000.99');
      expect(formatCurrency(999999.99, 'USD')).toBe('USD 999999.99');
    });
  });

  describe('formatAddress', () => {
    test('formats complete address correctly', () => {
      const address = {
        street: '123 Main St',
        city: 'Vancouver',
        state: 'BC',
        zipCode: 'V6B 1A1',
        country: 'Canada'
      };

      expect(formatAddress(address)).toBe('123 Main St, Vancouver, BC, V6B 1A1');
    });

    test('formats address without zip code', () => {
      const address = {
        street: '456 Oak Ave',
        city: 'Toronto',
        state: 'ON',
        country: 'Canada'
      };

      expect(formatAddress(address)).toBe('456 Oak Ave, Toronto, ON');
    });

    test('handles various address formats', () => {
      const addresses = [
        {
          street: '789 Pine Rd',
          city: 'Calgary',
          state: 'AB',
          zipCode: 'T2P 1A1',
          country: 'Canada'
        },
        {
          street: '321 Elm St',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          country: 'USA'
        }
      ];

      expect(formatAddress(addresses[0])).toBe('789 Pine Rd, Calgary, AB, T2P 1A1');
      expect(formatAddress(addresses[1])).toBe('321 Elm St, Seattle, WA, 98101');
    });

    test('handles empty or missing fields gracefully', () => {
      const address = {
        street: '',
        city: 'Vancouver',
        state: 'BC',
        country: 'Canada'
      };

      expect(formatAddress(address)).toBe(', Vancouver, BC');
    });
  });

  describe('Integration Tests', () => {
    test('coordinate transformation and validation work together', () => {
      const backendCoords: [number, number] = [-123.1207, 49.2827];
      const leafletCoords = transformCoordinates(backendCoords);
      const isValid = validateCoordinates(leafletCoords[0], leafletCoords[1]);
      
      expect(isValid).toBe(true);
      expect(leafletCoords).toEqual([49.2827, -123.1207]);
    });

    test('distance calculation with transformed coordinates', () => {
      const station1Coords: [number, number] = [-123.1207, 49.2827]; // Backend format
      const station2Coords: [number, number] = [-123.1307, 49.2927]; // Backend format
      
      const leaflet1 = transformCoordinates(station1Coords);
      const leaflet2 = transformCoordinates(station2Coords);
      
      const distance = calculateDistance(leaflet1[0], leaflet1[1], leaflet2[0], leaflet2[1]);
      
      expect(distance).toMatch(/^\d+\.\d+\s+mi$/);
    });

    test('availability color and formatting integration', () => {
      const stationData = {
        availablePorts: 3,
        totalPorts: 5,
        pricing: { perKwh: 0.35, currency: 'CAD' },
        address: {
          street: '123 Test St',
          city: 'Vancouver',
          state: 'BC',
          zipCode: 'V6B 1A1',
          country: 'Canada'
        }
      };

      const color = getAvailabilityColor(stationData.availablePorts, stationData.totalPorts);
      const formattedPrice = formatCurrency(stationData.pricing.perKwh, stationData.pricing.currency);
      const formattedAddress = formatAddress(stationData.address);

      expect(color).toBe('#4CAF50'); // 60% availability should be green
      expect(formattedPrice).toBe('CAD 0.35');
      expect(formattedAddress).toBe('123 Test St, Vancouver, BC, V6B 1A1');
    });
  });
}); 