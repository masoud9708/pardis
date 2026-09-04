import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Driver, UserRole } from '../types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  driver: Driver | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (mobile: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  quickLoginAs: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      if (!getStoredToken()) {
        setUser(null);
        setDriver(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      setDriver(data.driver);
    } catch {
      removeStoredToken();
      setToken(null);
      setUser(null);
      setDriver(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (mobile: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login(mobile, pass);
      setStoredToken(res.token);
      setToken(res.token);
      if (res.user) {
        setUser(res.user);
      }
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setDriver(null);
  };

  const quickLoginAs = async (role: UserRole) => {
    if (role === 'ADMIN') {
      await login('admin', 'sadra');
    } else if (role === 'OPERATOR') {
      await login('09123334455', 'operator123');
    } else {
      await login('09127778899', 'driver123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        driver,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        refreshProfile,
        quickLoginAs,
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
