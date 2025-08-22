import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to get current user:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await apiService.login(data);
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await apiService.register(data);
      if (response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Optionally call API logout endpoint
    apiService.logout().catch(console.error);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};