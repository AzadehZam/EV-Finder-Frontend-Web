import ApiService from '../services/api';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStations', () => {
    test('returns stations successfully', async () => {
      const mockStations = [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Test Station',
          address: {
            street: '123 Test St',
            city: 'Vancouver',
            state: 'BC',
            zipCode: 'V6B 1A1',
            country: 'Canada',
          },
          location: {
            coordinates: [-123.1207, 49.2827],
          },
          connectorTypes: [
            { type: 'CCS', power: 50, count: 2, available: 1 },
          ],
          pricing: { perKwh: 0.35, currency: 'CAD' },
          totalPorts: 2,
          availablePorts: 1,
          rating: 4.5,
          amenities: ['WiFi'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStations,
      } as Response);

      const result = await ApiService.getStations();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/stations');
      expect(result).toEqual({
        success: true,
        data: mockStations,
      });
    });

    test('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await ApiService.getStations();

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await ApiService.getStations();

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as any);

      const result = await ApiService.getStations();

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });
  });

  describe('getStationById', () => {
    test('returns single station successfully', async () => {
      const mockStation = {
        id: '507f1f77bcf86cd799439011',
        name: 'Test Station',
        address: {
          street: '123 Test St',
          city: 'Vancouver',
          state: 'BC',
          zipCode: 'V6B 1A1',
          country: 'Canada',
        },
        location: {
          coordinates: [-123.1207, 49.2827],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStation,
      } as Response);

      const result = await ApiService.getStationById('507f1f77bcf86cd799439011');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/stations/507f1f77bcf86cd799439011');
      expect(result).toEqual({
        success: true,
        data: mockStation,
      });
    });

    test('handles station not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await ApiService.getStationById('nonexistent');

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles invalid station ID format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      const result = await ApiService.getStationById('invalid-id');

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });
  });

  describe('createReservation', () => {
    test('creates reservation successfully', async () => {
      const reservationData = {
        stationId: '507f1f77bcf86cd799439011',
        connectorType: 'CCS',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        estimatedCost: 15.50,
      };

      const mockResponse = {
        id: '507f1f77bcf86cd799439013',
        ...reservationData,
        status: 'confirmed',
        createdAt: '2024-01-14T12:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await ApiService.createReservation(reservationData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
    });

    test('handles reservation conflict', async () => {
      const reservationData = {
        stationId: '507f1f77bcf86cd799439011',
        connectorType: 'CCS',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        estimatedCost: 15.50,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({ message: 'Time slot already reserved' }),
      } as Response);

      const result = await ApiService.createReservation(reservationData);

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles invalid reservation data', async () => {
      const invalidData = {
        stationId: '',
        connectorType: 'INVALID',
        startTime: 'invalid-date',
        endTime: 'invalid-date',
        estimatedCost: -10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid reservation data' }),
      } as Response);

      const result = await ApiService.createReservation(invalidData);

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });
  });

  describe('getUserReservations', () => {
    test('returns user reservations successfully', async () => {
      const mockReservations = [
        {
          id: '507f1f77bcf86cd799439013',
          stationId: '507f1f77bcf86cd799439011',
          stationName: 'Test Station',
          connectorType: 'CCS',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
          status: 'confirmed',
          estimatedCost: 15.50,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReservations,
      } as Response);

      const result = await ApiService.getUserReservations();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/reservations');
      expect(result).toEqual({
        success: true,
        data: mockReservations,
      });
    });

    test('returns empty array when no reservations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await ApiService.getUserReservations();

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });

    test('handles unauthorized access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const result = await ApiService.getUserReservations();

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });
  });

  describe('cancelReservation', () => {
    test('cancels reservation successfully', async () => {
      const reservationId = '507f1f77bcf86cd799439013';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Reservation cancelled successfully' }),
      } as Response);

      const result = await ApiService.cancelReservation(reservationId);

      expect(mockFetch).toHaveBeenCalledWith(`http://localhost:3000/api/reservations/${reservationId}`, {
        method: 'DELETE',
      });

      expect(result).toEqual({
        success: true,
        data: { message: 'Reservation cancelled successfully' },
      });
    });

    test('handles reservation not found', async () => {
      const reservationId = 'nonexistent';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await ApiService.cancelReservation(reservationId);

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles cancellation of already cancelled reservation', async () => {
      const reservationId = '507f1f77bcf86cd799439013';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Reservation already cancelled' }),
      } as Response);

      const result = await ApiService.cancelReservation(reservationId);

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });
  });

  describe('deleteReservation', () => {
    test('deletes reservation successfully', async () => {
      const reservationId = '507f1f77bcf86cd799439013';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ message: 'Reservation deleted successfully' }),
      } as any);

      const result = await ApiService.deleteReservation(reservationId);

      expect(mockFetch).toHaveBeenCalledWith(`http://localhost:3000/api/reservations/${reservationId}/delete`, {
        method: 'DELETE',
      });

      expect(result).toEqual({
        success: true,
        data: { message: 'Reservation deleted successfully' },
      });
    });

    test('handles reservation not found for deletion', async () => {
      const reservationId = 'nonexistent';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Reservation not found' }),
      } as any);

      const result = await ApiService.deleteReservation(reservationId);

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles deletion of active reservation', async () => {
      const reservationId = '507f1f77bcf86cd799439013';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Cannot delete active reservation' }),
      } as any);

      const result = await ApiService.deleteReservation(reservationId);

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles unauthorized deletion attempt', async () => {
      const reservationId = '507f1f77bcf86cd799439013';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ message: 'Not authorized to delete this reservation' }),
      } as any);

      const result = await ApiService.deleteReservation(reservationId);

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles server error during deletion', async () => {
      const reservationId = '507f1f77bcf86cd799439013';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      const result = await ApiService.deleteReservation(reservationId);

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles network error during deletion', async () => {
      const reservationId = '507f1f77bcf86cd799439013';

      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      const result = await ApiService.deleteReservation(reservationId);

      expect(result).toEqual({
        success: false,
        error: expect.any(TypeError),
      });
    });

    test('handles invalid reservation ID format', async () => {
      const invalidReservationId = 'invalid-id-format';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid reservation ID format' }),
      } as any);

      const result = await ApiService.deleteReservation(invalidReservationId);

      expect(mockFetch).toHaveBeenCalledWith(`http://localhost:3000/api/reservations/${invalidReservationId}/delete`, {
        method: 'DELETE',
      });

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles empty reservation ID', async () => {
      const emptyReservationId = '';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Reservation ID is required' }),
      } as any);

      const result = await ApiService.deleteReservation(emptyReservationId);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/reservations//delete', {
        method: 'DELETE',
      });

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('handles completely invalid URL', async () => {
      // Temporarily override the base URL
      const originalBaseUrl = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'invalid-url';

      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await ApiService.getStations();

      expect(result).toEqual({
        success: false,
        error: expect.any(TypeError),
      });

      // Restore original URL
      process.env.REACT_APP_API_URL = originalBaseUrl;
    });

    test('handles timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const result = await ApiService.getStations();

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      });
    });

    test('handles CORS errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await ApiService.getStations();

      expect(result).toEqual({
        success: false,
        error: expect.any(TypeError),
      });
    });
  });
}); 