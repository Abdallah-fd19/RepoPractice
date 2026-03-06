import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGithubCallback } = useAuth();
  const [error, setError] = useState(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    const exchangeCode = async () => {
      // Prevent running the OAuth completion flow multiple times
      // (e.g. due to React StrictMode double-invoking effects in development)
      if (hasCompletedRef.current) {
        return;
      }
      hasCompletedRef.current = true;

      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          setError('No authorization code received');
          console.log('No authorization code received');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // The backend will handle the OAuth exchange
        // We'll use the session to get the tokens back
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        // Make a call to a new endpoint that completes the OAuth flow
        const response = await fetch(`${API_BASE_URL}/auth/github/complete/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for session
        });

        if (!response.ok) {
          const data = await response.json();
          console.log('GitHub authentication failed');
          throw new Error(data.detail || 'GitHub authentication failed');
        }

        const data = await response.json();
        const result = await handleGithubCallback(data);

        if (result.success) {
          navigate('/dashboard');
          console.log('GitHub authentication successful');
        } else {
          setError(result.error);
          console.log('GitHub authentication failed:2', result.error);
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        setError(err.message);
        console.log('GitHub authentication failed:3', err.message);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    exchangeCode();
  }, [searchParams, navigate, handleGithubCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <div className="text-red-600">
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p>{error}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting to login...</p>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Completing GitHub authentication...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubCallback;
