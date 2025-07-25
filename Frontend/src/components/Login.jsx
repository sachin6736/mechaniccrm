import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logo.avif';
import login from '../assets/login.avif';

// Fallback Spinner component
const Spinner = ({ size = 'w-4 h-4', color = 'text-white' }) => (
  <div
    className={`${size} ${color} border-2 border-t-transparent rounded-full animate-spin`}
  ></div>
);

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:3000/Auth/check-auth', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok && data.isAuthenticated) {
          navigate('/AddLead');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      toast.error('Email and password are required');
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      toast.warning('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/Auth/login', {
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
        setLoading(false);
        return;
      }

      toast.success('Login successful');
      navigate('/leads');
    } catch (err) {
      console.error('Login error:', err);
      const message = err.message || 'Server error. Please try again later.';
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  const handleContactAdmin = () => {
    toast.info('Contact admin feature coming soon');
  };

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Logo Section (Commented out as in provided code) */}
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
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="example@email.com"
                required
                aria-label="Email address"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="********"
                required
                aria-label="Password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#4f4f51] hover:bg-black text-white py-2 rounded-lg transition duration-200 flex justify-center items-center disabled:opacity-50"
              disabled={loading}
              aria-label="Login"
            >
              {loading ? (
                <>
                  <Spinner size="w-4 h-4" color="text-white" />
                  <span className="ml-2">Logging in...</span>
                </>
              ) : (
                'Login'
              )}
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
          className="text-sm text-black hover:text-[#4f4f51] px-3 py-1 rounded"
          onClick={handleContactAdmin}
          aria-label="Contact Admin for password reset"
        >
          Contact Admin
        </button>
      </div>
    </div>
  );
};

export default Login;