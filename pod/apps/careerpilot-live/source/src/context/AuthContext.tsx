import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  googleLogin: (payload?: { credential?: string; email?: string; name?: string; picture?: string }) => Promise<void>;
  loginWithConnector: (data: { accountId?: string; connectorId?: string; email?: string; name?: string }) => Promise<void>;
  logout: () => void;
  updateOnboarding: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (typeof window !== 'undefined' && localStorage.getItem('careerpilot_logged_out') === 'true') {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.auth.getMe();
      if (data && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      localStorage.removeItem('careerpilot_logged_out');
      const res = await api.auth.login({ email, password });
      if (res.token) {
        localStorage.setItem('careerpilot_token', res.token);
      }
      if (res.user) {
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password?: string) => {
    setLoading(true);
    try {
      localStorage.removeItem('careerpilot_logged_out');
      const res = await api.auth.register({ name, email, password });
      if (res.token) {
        localStorage.setItem('careerpilot_token', res.token);
      }
      if (res.user) {
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (payload?: { credential?: string; email?: string; name?: string; picture?: string }) => {
    setLoading(true);
    try {
      localStorage.removeItem('careerpilot_logged_out');
      const res = await api.auth.googleLogin(payload);
      if (res.token) {
        localStorage.setItem('careerpilot_token', res.token);
      }
      if (res.user) {
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithConnector = async (data: { accountId?: string; connectorId?: string; email?: string; name?: string }) => {
    setLoading(true);
    try {
      localStorage.removeItem('careerpilot_logged_out');
      const res = await api.connectors.loginWithConnector(data);
      if (res.token) {
        localStorage.setItem('careerpilot_token', res.token);
      }
      if (res.user) {
        setUser(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('careerpilot_token');
    localStorage.removeItem('careerpilot_user');
    localStorage.setItem('careerpilot_logged_out', 'true');
    setUser(null);
  };

  const updateOnboarding = async (data: Partial<User>) => {
    const res = await api.auth.updateOnboarding(data);
    if (res.user) {
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        loginWithConnector,
        logout,
        updateOnboarding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
