import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

// Use environment-based API URL
const API_BASE_URL = 'http://localhost:3000/api'; // Temporarily hardcoded for debugging

console.log('API_BASE_URL:', API_BASE_URL);
console.log('import.meta.env.DEV:', import.meta.env.DEV);
console.log('import.meta.env.MODE:', import.meta.env.MODE);

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          // Redirect to login or refresh token
        }
        return Promise.reject(error.response?.data || error);
      }
    );

    // Load token from localStorage on initialization
    this.loadToken();
  }

  // Token management
  private loadToken(): void {
    this.token = localStorage.getItem('jwt_token');
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('jwt_token', token);
  }

  removeToken(): void {
    this.token = null;
    localStorage.removeItem('jwt_token');
  }

  getToken(): string | null {
    return this.token;
  }

  // Auth0 Integration - Create/Update User
  async authenticateWithAuth0(userInfo: any): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/users/auth0', {
        auth0Id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      }) as ApiResponse;

      if (response.success && response.data?.token) {
        this.setToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Auth0 authentication error:', error);
      throw error;
    }
  }

  // User endpoints
  async getUserProfile(): Promise<ApiResponse> {
    return this.api.get('/users/profile');
  }

  async getUserDashboard(): Promise<ApiResponse> {
    return this.api.get('/users/dashboard');
  }

  async updateUserProfile(profileData: any): Promise<ApiResponse> {
    return this.api.put('/users/profile', profileData);
  }

  async getFavoriteStations(): Promise<ApiResponse> {
    return this.api.get('/users/favorites');
  }

  async addFavoriteStation(stationId: string): Promise<ApiResponse> {
    return this.api.post('/users/favorites', { stationId });
  }

  async removeFavoriteStation(stationId: string): Promise<ApiResponse> {
    return this.api.delete(`/users/favorites/${stationId}`);
  }

  // Station endpoints
  async getStations(params: Record<string, any> = {}): Promise<ApiResponse> {
    return this.api.get('/stations', { params });
  }

  async getNearbyStations(lat: number, lng: number, radius: number = 5, limit: number = 10): Promise<ApiResponse> {
    return this.api.get(`/stations/nearby`, {
      params: { lat, lng, radius, limit }
    });
  }

  async getStationById(stationId: string): Promise<ApiResponse> {
    return this.api.get(`/stations/${stationId}`);
  }

  // Reservation endpoints
  async getUserReservations(params: Record<string, any> = {}): Promise<ApiResponse> {
    return this.api.get('/reservations', { params });
  }

  async createReservation(reservationData: any): Promise<ApiResponse> {
    return this.api.post('/reservations', reservationData);
  }

  async getReservationById(reservationId: string): Promise<ApiResponse> {
    return this.api.get(`/reservations/${reservationId}`);
  }

  async updateReservation(reservationId: string, updateData: any): Promise<ApiResponse> {
    return this.api.put(`/reservations/${reservationId}`, updateData);
  }

  async cancelReservation(reservationId: string): Promise<ApiResponse> {
    return this.api.delete(`/reservations/${reservationId}`);
  }

  async startChargingSession(reservationId: string): Promise<ApiResponse> {
    return this.api.patch(`/reservations/${reservationId}/start`);
  }

  async completeChargingSession(reservationId: string, sessionData: any): Promise<ApiResponse> {
    return this.api.patch(`/reservations/${reservationId}/complete`, sessionData);
  }

  // Enhanced reservation methods
  async checkAvailability(stationId: string, connectorType: string, startTime: string, endTime: string): Promise<ApiResponse> {
    return this.api.get('/reservations/availability', {
      params: { stationId, connectorType, startTime, endTime }
    });
  }

  async getActiveReservations(): Promise<ApiResponse> {
    return this.api.get('/reservations/active');
  }

  async getReservationAnalytics(period: number = 30): Promise<ApiResponse> {
    return this.api.get(`/reservations/analytics`, { params: { period } });
  }

  async confirmReservation(reservationId: string): Promise<ApiResponse> {
    return this.api.patch(`/reservations/${reservationId}/confirm`);
  }

  async getStationReservations(stationId: string, params: Record<string, any> = {}): Promise<ApiResponse> {
    return this.api.get(`/reservations/station/${stationId}`, { params });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

export default new ApiService(); 