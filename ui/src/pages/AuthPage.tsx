// src/pages/AuthPage.tsx
import React, { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // For registration
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin, user, isLoading: authIsLoading } = useAuth();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (!authIsLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authIsLoading, navigate, from]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const data = await apiClient.login({ email, password });
        authLogin(data.token, data.user);
        navigate(from, { replace: true });
      } else {
        await apiClient.register({ username, email, password });
        // Auto-login after successful registration
        const loginData = await apiClient.login({ email, password });
        authLogin(loginData.token, loginData.user);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || (isLoginMode ? 'Login failed. Invalid credentials or server error.' : 'Registration failed. User might exist or server error.'));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authIsLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading authentication...</p></div>;
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLoginMode ? 'Sign in to InstaReact' : 'Create your InstaReact account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-600 bg-red-100 border border-red-300 p-3 rounded-md text-center text-sm">{error}</p>}
          
          {!isLoginMode && (
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required={!isLoginMode}
                className="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLoginMode ? "current-password" : "new-password"}
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2.5 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-300 transition duration-150"
            >
              {isLoading ? 'Processing...' : (isLoginMode ? 'Sign in' : 'Create Account')}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => { setIsLoginMode(!isLoginMode); setError(null);}} 
            className="font-medium text-pink-600 hover:text-pink-500 focus:outline-none"
          >
            {isLoginMode ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;