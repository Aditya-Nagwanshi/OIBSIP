import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY } from '../lib/api';
import { USER_KEY } from '../lib/constants';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const storeSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return null;
    try {
      const data = await api('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (error) {
      if (error.status === 401) clearSession();
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setLoading(false);
        return;
      }
      try {
        const data = await api('/auth/me');
        if (cancelled) return;
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      } catch (error) {
        if (!cancelled && error.status === 401) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('slice:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('slice:unauthorized', handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(
    async (credentials) => {
      const data = await api('/auth/login', { method: 'POST', body: credentials, token: null });
      storeSession(data.token, data.user);
      return data;
    },
    [storeSession]
  );

  const adminLogin = useCallback(
    async (email) => {
      const data = await api('/auth/admin/login', { method: 'POST', body: { email }, token: null });
      storeSession(data.token, data.user);
      return data;
    },
    [storeSession]
  );

  const register = useCallback(
    async (payload) => api('/auth/register', { method: 'POST', body: payload, token: null }),
    []
  );

  const verifyEmail = useCallback(
    async (verificationToken) => {
      const data = await api('/auth/verify-email', {
        method: 'POST',
        body: { token: verificationToken },
        token: null,
      });
      storeSession(data.token, data.user);
      return data;
    },
    [storeSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      login,
      adminLogin,
      register,
      verifyEmail,
      logout,
      storeSession,
      refreshUser,
    }),
    [token, user, loading, login, adminLogin, register, verifyEmail, logout, storeSession, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
