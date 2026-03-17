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

  /**
   * Complete GitHub OAuth on the frontend by storing the user + tokens
   * returned from the backend `/auth/github/complete/` endpoint.
   */
  const handleGithubCallback = async (authData) => {
    try {
      if (!authData || !authData.user || !authData.tokens) {
        throw new Error('Invalid authentication data from GitHub');
      }

      const userData = {
        id: authData.user.id,
        username: authData.user.username,
        email: authData.user.email,
      };

      const tokenData = {
        access: authData.tokens.access,
        refresh: authData.tokens.refresh,
      };

      setUser(userData);
      setTokens(tokenData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('tokens', JSON.stringify(tokenData));
      setError(null);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };


  const loadProfile = async () => {
    try{
      setError(null);
      const response = await authFetch(`${API_BASE_URL}/users/profile/`, { method: 'GET' });
      if (!response.ok){
        throw new Error('Failed to load profile');
      }
      const data = await response.json();
      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        bio: data.bio,
        github_username: data.github_username,
        avatar: data.avatar,
      }
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setError(null);
      return { success: true };
    }
    catch (err) {
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

  const getStoredTokens = () => {
    try {
      const raw = localStorage.getItem('tokens');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const refreshAccessToken = async (refreshToken) => {
    const response = await fetch(`${API_BASE_URL}/users/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();
    if (!data?.access) {
      throw new Error('Invalid refresh response from server.');
    }

    return data;
  };

  const authFetch = async (input, init = {}) => {
    const currentTokens = tokens || getStoredTokens();
    if (!currentTokens?.access) {
      throw new Error('Not authenticated');
    }

    const withAuthHeaders = (accessToken) => ({
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    });

    let response = await fetch(input, {
      ...init,
      headers: withAuthHeaders(currentTokens.access),
    });

    // If access token expired/invalid, refresh once then retry.
    if (response.status !== 401) {
      return response;
    }

    if (!currentTokens?.refresh) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    try {
      const refreshed = await refreshAccessToken(currentTokens.refresh);
      const updatedTokens = {
        access: refreshed.access,
        refresh: refreshed.refresh || currentTokens.refresh,
      };

      setTokens(updatedTokens);
      localStorage.setItem('tokens', JSON.stringify(updatedTokens));

      response = await fetch(input, {
        ...init,
        headers: withAuthHeaders(updatedTokens.access),
      });
      return response;
    } catch (err) {
      logout();
      throw err instanceof Error ? err : new Error('Session expired. Please log in again.');
    };
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
    loadProfile,
    handleGithubCallback,
    authFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;