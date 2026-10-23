import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/client';
import type { UserAccount } from '../types/api';
import { clearAuditHistory } from '../lib/auditStorage';

interface AuthContextValue {
  user: UserAccount | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (profile: { first_name: string; last_name: string; email: string; password: string; position: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'ila_access_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    void authApi.me()
      .then(setUser)
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        clearAuditHistory();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    sessionStorage.setItem(TOKEN_KEY, result.access_token);
    setUser(result.user);
  };

  const register = async (profile: { first_name: string; last_name: string; email: string; password: string; position: string }) => {
    await authApi.register(profile);
    await login(profile.email, profile.password);
  };

  const logout = async () => {
    try {
      if (sessionStorage.getItem(TOKEN_KEY)) await authApi.logout();
    } catch {
      // The local session is cleared even if the backend cannot be reached.
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      clearAuditHistory();
      setUser(null);
    }
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
