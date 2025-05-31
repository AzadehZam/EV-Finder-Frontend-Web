import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import ApiService from '../services/api';

interface User {
  _id?: string;
  auth0Id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refreshUserData: () => Promise<User | null>;
  updateUserProfile: (profileData: any) => Promise<{ success: boolean; user?: User; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    user: auth0User, 
    isAuthenticated: auth0IsAuthenticated, 
    isLoading: auth0IsLoading,
    loginWithRedirect,
    logout: auth0Logout
  } = useAuth0();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth0IsLoading) {
      if (auth0IsAuthenticated && auth0User) {
        handleAuth0Login(auth0User);
      } else {
        setIsLoading(false);
      }
    }
  }, [auth0IsAuthenticated, auth0User, auth0IsLoading]);

  const handleAuth0Login = async (auth0UserInfo: any) => {
    try {
      setIsLoading(true);
      
      // Create user object from Auth0 data
      const userData: User = {
        auth0Id: auth0UserInfo.sub,
        email: auth0UserInfo.email,
        name: auth0UserInfo.name || auth0UserInfo.nickname || 'EV Driver',
        picture: auth0UserInfo.picture,
      };

      // Try to authenticate with backend, but don't fail if it's not available
      try {
        const response = await ApiService.authenticateWithAuth0(auth0UserInfo);
        if (response.success && response.data?.user) {
          // Use backend user data if available
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          // Fall back to Auth0 data
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.log('Backend not available, using Auth0 data only:', error);
        // Use Auth0 data directly if backend is not available
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error during Auth0 login:', error);
      // Even if there's an error, try to set user from Auth0 data
      if (auth0UserInfo) {
        const userData: User = {
          auth0Id: auth0UserInfo.sub,
          email: auth0UserInfo.email,
          name: auth0UserInfo.name || auth0UserInfo.nickname || 'EV Driver',
          picture: auth0UserInfo.picture,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    loginWithRedirect();
  };

  const logout = () => {
    // Clear backend token
    ApiService.removeToken();
    
    // Clear local storage
    localStorage.removeItem('user');
    
    setUser(null);
    
    // Logout from Auth0
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  const refreshUserData = async (): Promise<User | null> => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        const userData = response.data;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
    return null;
  };

  const updateUserProfile = async (profileData: any): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const response = await ApiService.updateUserProfile(profileData);
      if (response.success) {
        const updatedUser = response.data;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoading || auth0IsLoading,
    isAuthenticated: !!user && auth0IsAuthenticated,
    login,
    logout,
    refreshUserData,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 