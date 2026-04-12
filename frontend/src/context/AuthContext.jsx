import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken } from '../services/api';
import { AuthContext } from './authContextInstance';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem('auth_token');
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch (error) {
      clearSession();
      throw error;
    }
  }, [clearSession]);

  useEffect(() => {
    setAuthToken(token);

    if (!token) {
      setIsReady(true);
      return;
    }

    refreshProfile().finally(() => setIsReady(true));
  }, [refreshProfile, token]);

  const setSession = useCallback((nextToken) => {
    localStorage.setItem('auth_token', nextToken);
    setAuthToken(nextToken);
    setTokenState(nextToken);
  }, []);

  const login = useCallback(async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    setSession(data.token);
    setUser(data.user);
    return data;
  }, [setSession]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const applyGoogleToken = useCallback(async (nextToken) => {
    setSession(nextToken);
    setIsReady(false);
    await refreshProfile();
    setIsReady(true);
  }, [refreshProfile, setSession]);

  const value = useMemo(() => ({
    token,
    user,
    isReady,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    refreshProfile,
    applyGoogleToken,
    setUser,
  }), [token, user, isReady, login, register, logout, refreshProfile, applyGoogleToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
