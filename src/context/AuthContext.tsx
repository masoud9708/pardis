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
  quickLogin: (target?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setDriver(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
        setDriver(data.driver || null);
      } else {
        removeStoredToken();
        setToken(null);
        setUser(null);
        setDriver(null);
      }
    } catch (err: any) {
      console.warn('Session check note:', err?.message);
      // Clean up token on unauthorized / invalid session errors
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

  useEffect(() => {
    const handleUnauthorized = () => {
      removeStoredToken();
      setToken(null);
      setUser(null);
      setDriver(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (mobile: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login(mobile, pass);
      setStoredToken(res.token);
      setToken(res.token);
      if (res.user) {
        setUser(res.user);
      }
      // Non-blocking driver profile hydration
      try {
        const profile = await api.getMe();
        if (profile?.user) {
          setUser(profile.user);
          setDriver(profile.driver || null);
        }
      } catch (err) {
        console.warn('Driver profile fetch fallback:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (target: string = 'dastgerdi') => {
    setLoading(true);
    try {
      const res = await api.quickLogin(target);
      setStoredToken(res.token);
      setToken(res.token);
      if (res.user) {
        setUser(res.user);
      }
      try {
        const profile = await api.getMe();
        if (profile?.user) {
          setUser(profile.user);
          setDriver(profile.driver || null);
        }
      } catch (err) {
        console.warn('Quick login driver profile fetch fallback:', err);
      }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        driver,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        quickLogin,
        logout,
        refreshProfile,
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
