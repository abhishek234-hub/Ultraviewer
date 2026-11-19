import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('remotex_jwt_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.success && res.data.user) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success) {
      const { user: authUser, token: authToken } = res.data;
      localStorage.setItem('remotex_jwt_token', authToken);
      setToken(authToken);
      setUser(authUser);
      return authUser;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.success) {
      const { user: authUser, token: authToken } = res.data;
      localStorage.setItem('remotex_jwt_token', authToken);
      setToken(authToken);
      setUser(authUser);
      return authUser;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      localStorage.removeItem('remotex_jwt_token');
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.success) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Failed to update profile');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
