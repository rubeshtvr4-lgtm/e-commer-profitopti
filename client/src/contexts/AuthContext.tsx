import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/apiClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; businessName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  seedDemoData: () => Promise<{ productsCount: number; ordersCount: number }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await api.get<{ user: User }>('/auth/me');
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('profitpilot_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const data = await api.post<{ user: User; token: string }>('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('profitpilot_token', data.token);
    }
    setUser(data.user);
  };

  const register = async (formData: { name: string; email: string; password: string; businessName: string }) => {
    const data = await api.post<{ user: User; token: string }>('/auth/register', formData);
    if (data.token) {
      localStorage.setItem('profitpilot_token', data.token);
    }
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('profitpilot_token');
      setUser(null);
    }
  };

  const seedDemoData = async () => {
    const res = await api.post<{ productsCount: number; ordersCount: number }>('/demo/seed');
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        seedDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
