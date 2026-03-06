import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    // Check for existing user session on mount
    const savedUser = localStorage.getItem('user');
    const savedTokens = localStorage.getItem('tokens');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedTokens) {
          setTokens(JSON.parse(savedTokens));
        }
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('tokens');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Regular email/password login
      const response = await fetch(`${API_BASE_URL}/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await response.json();
      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      };

      setUser(userData);
      setTokens(data.tokens);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('tokens', JSON.stringify(data.tokens));
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const githubLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/github/login/`;
  };

  const handleGithubCallback = async (tokens) => {
    try {
      setUser({
        id: tokens.user.id,
        username: tokens.user.username,
        email: tokens.user.email,
      });
      setTokens({
        access: tokens.tokens.access,
        refresh: tokens.tokens.refresh,
      });
      localStorage.setItem('user', JSON.stringify(tokens.user));
      localStorage.setItem('tokens', JSON.stringify(tokens.tokens));
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const signup = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Sign up failed');
      }

      const data = await response.json();
      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      };

      setUser(userData);
      setTokens(data.tokens);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('tokens', JSON.stringify(data.tokens));
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    tokens,
    login,
    signup,
    logout,
    githubLogin,
    handleGithubCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;