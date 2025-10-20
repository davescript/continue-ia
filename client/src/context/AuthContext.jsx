import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { setAuthToken, clearAuthToken } from '../services/api.js';
import AuthContext from './AuthContextBase.js';

const STORAGE_KEY = 'leia_sabores_admin_token';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const handleLogout = useCallback(() => {
    clearAuthToken();
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      api
        .getCurrentUser()
        .then((response) => {
          setUser(response.user);
        })
        .catch(() => {
          handleLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      clearAuthToken();
      setUser(null);
      setLoading(false);
    }
  }, [token, handleLogout]);

  const handleLogin = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const response = await api.login(credentials);
      setAuthToken(response.token);
      localStorage.setItem(STORAGE_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const response = await api.getCurrentUser();
    setUser(response.user);
    return response.user;
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login: handleLogin,
      logout: handleLogout,
      refreshUser,
    }),
    [user, token, loading, handleLogin, handleLogout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
