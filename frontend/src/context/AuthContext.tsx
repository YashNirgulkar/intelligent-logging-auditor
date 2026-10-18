import React, { createContext, useContext, useEffect, useState } from 'react';
import { auditsApi, formatApiError } from '../api/client';
import type { AuthUser } from '../types/api';

type AuthState = 'checking' | 'signed-in' | 'signed-out';

interface AuthContextValue {
  state: AuthState;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>('checking');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    const onExpired = () => {
      setUser(null);
      setState('signed-out');
    };
    window.addEventListener('ila:auth-expired', onExpired);
    const token = sessionStorage.getItem('ila_access_token');
    if (!token) {
      setState('signed-out');
      return () => {
        active = false;
        window.removeEventListener('ila:auth-expired', onExpired);
      };
    }
    auditsApi.currentUser()
      .then((current) => {
        if (active) {
          setUser(current);
          setState('signed-in');
        }
      })
      .catch(() => {
        sessionStorage.removeItem('ila_access_token');
        if (active) setState('signed-out');
      });
    return () => {
      active = false;
      window.removeEventListener('ila:auth-expired', onExpired);
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await auditsApi.login(username, password);
      sessionStorage.setItem('ila_access_token', response.access_token);
      const current = await auditsApi.currentUser();
      setUser(current);
      setState('signed-in');
    } catch (error) {
      sessionStorage.removeItem('ila_access_token');
      throw new Error(formatApiError(error));
    }
  };

  const logout = () => {
    sessionStorage.removeItem('ila_access_token');
    setUser(null);
    setState('signed-out');
  };

  return (
    <AuthContext.Provider value={{ state, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}

