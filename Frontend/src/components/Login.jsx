import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PuffLoader } from 'react-spinners';
import useApiLoading from '../hooks/useApiLoading';
import logo from '../assets/logo.avif';
import login from '../assets/login.avif';

const API = import.meta.env.VITE_API_URL;

const Login = () => {
  const navigate = useNavigate();
  const { loading: apiLoading, withLoading } = useApiLoading();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Derived loading state for spinner and button/input disabling
  const isLoading = apiLoading.checkAuth || apiLoading.login;

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      await withLoading('checkAuth', async () => {
        try {
          const response = await fetch(`${API}/Auth/check-auth`, {
            method: 'GET',
            credentials: 'include',
          });
          const data = await response.json();
          if (data.isAuthenticated) {
            setIsAuthenticated(true);
            toast.info('You are already logged in');
            navigate('/leads', { replace: true });
          } else {
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Error checking auth:', err);
          setIsAuthenticated(false);
          toast.error('Authentication check failed');
        }
      });
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    if (isLoading) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    if (!formData.name || !formData.password) {
      setError('Name and password are required');
      toast.error('Name and password are required');
      return;
    }

    // Basic name validation
    const nameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!nameRegex.test(formData.name)) {
      setError('Please enter a valid name (3-30 characters, letters, numbers, or underscores)');
      toast.warning('Please enter a valid name');
      return;
    }

    await withLoading('login', async () => {
      try {
        const response = await fetch(`${API}/Auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          throw new Error('Invalid response from server');
        }

        if (!response.ok) {
          const message = data.message || 'Login failed';
          setError(message);
          toast.error(message);
          return;
        }

        toast.success('Login successful');
        setIsAuthenticated(true);
        navigate('/leads', { replace: true });
      } catch (err) {
        console.error('Login error:', err);
        const message = err.message || 'Server error. Please try again later.';
        setError(message);
        toast.error(message);
      }
    });
  };

  const handleContactAdmin = () => {
    if (isLoading) return;
    toast.info('Contact admin feature coming soon');
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null || apiLoading.checkAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <PuffLoader color="#2701FF" size={50} aria-label="Loading" />
      </div>
    );
  }

  // Don't render anything if already authenticated (redirect will handle navigation)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 relative">
      {/* Centered PuffLoader Overlay for Login Submission */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-50">
          <PuffLoader color="#2701FF" size={50} aria-label="Loading" />
        </div>
      )}
      {/* Logo Section */}
      <div className="absolute top-10 left-10 flex items-center space-x-2 z-10">
        <img src={logo} alt="Zebra" className="h-8 w-8" />
        <h1 className="text-xl font-bold text-gray-900">ZebraAutogroup</h1>
      </div>

      {/* Left Side - Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-4 sm:p-8 space-y-6">
          <div className="mb-2">
            <h2 className="text-xl font-sans text-gray-800 mb-1">
              Start your journey
            </h2>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="username"
                required
                aria-label="Name"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="********"
                required
                aria-label="Password"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition duration-200 flex justify-center items-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
              aria-label="Login"
            >
              Login
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Image Section */}
      <div className="hidden md:block w-1/2 relative">
        <img
          src={login}
          alt="Background"
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Forgot Password */}
      <div className="absolute bottom-10 left-10 flex items-center space-x-2">
        <p className="text-sm text-gray-600">Forgot password?</p>
        <button
          type="button"
          className={`text-sm text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleContactAdmin}
          disabled={isLoading}
          aria-label="Contact Admin for password reset"
        >
          Contact Admin
        </button>
      </div>
    </div>
  );
};

export default Login;