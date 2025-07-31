import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Save } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { PuffLoader } from 'react-spinners';
import useApiLoading from '../hooks/useApiLoading';

const API = import.meta.env.VITE_API_URL;

const Team = () => {
  const navigate = useNavigate();
  const { loading: apiLoading, withLoading } = useApiLoading();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales',
  });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Derived loading state for spinner and button/input disabling
  const isLoading = apiLoading.checkAuth || apiLoading.fetchUsers || apiLoading.createUser;

  // Check authentication status and user role on mount
  useEffect(() => {
    const checkAuth = async () => {
      await withLoading('checkAuth', async () => {
        try {
          const response = await fetch(`${API}/Auth/check-auth`, {
            method: 'GET',
            credentials: 'include',
          });
          const data = await response.json();
          if (!data.isAuthenticated) {
            setIsAuthenticated(false);
            toast.error('Please log in to access this page');
            navigate('/login', { replace: true });
          } else {
            setIsAuthenticated(true);
            setUserRole(data.user.role);
            if (data.user.role !== 'admin') {
              toast.error('Access denied. Admins only.');
              navigate('/leads', { replace: true });
            } else {
              fetchUsers();
            }
          }
        } catch (err) {
          console.error('Error checking auth:', err);
          setIsAuthenticated(false);
          toast.error('Authentication error');
          navigate('/login', { replace: true });
        }
      });
    };
    checkAuth();
  }, [navigate]);

  const fetchUsers = async () => {
    await withLoading('fetchUsers', async () => {
      try {
        const response = await fetch(`${API}/Auth/users`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch users');
        }
        setUsers(data.data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load users.');
        toast.error('Failed to load users.');
      }
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateUser = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast.warning('All fields are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.warning('Please enter a valid email');
      return;
    }

    if (formData.password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }

    setConfirmAction(() => async () => {
      await withLoading('createUser', async () => {
        try {
          const response = await fetch(`${API}/Auth/create-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create user');
          }

          const data = await response.json();
          setUsers([...users, data.user]);
          setFormData({ name: '', email: '', password: '', role: 'sales' });
          toast.success('User created successfully');
          setShowConfirmModal(false);
        } catch (error) {
          console.error('Error creating user:', error);
          toast.error(error.message || 'Error creating user');
        }
      });
    });
    setShowConfirmModal(true);
  };

  // Show loading state while checking authentication or fetching users
  if (isAuthenticated === null || userRole === null || apiLoading.checkAuth || apiLoading.fetchUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center md:pl-24 md:pt-20">
        <PuffLoader color="#2701FF" size={50} aria-label="Loading" />
      </div>
    );
  }

  // Don't render anything if not authenticated or not an admin (redirect will handle navigation)
  if (!isAuthenticated || userRole !== 'admin') {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center md:pl-24 md:pt-20">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => navigate('/leads')}
            disabled={isLoading}
            className={`mt-2 px-4 py-1 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 md:pl-24 md:pt-20 relative">
      {/* Centered PuffLoader Overlay with Preferred Color and Opacity */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-50">
          <PuffLoader color="#2701FF" size={50} aria-label="Loading" />
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header and Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Team Management
          </h2>
          <button
            onClick={() => navigate('/leads')}
            disabled={isLoading}
            className={`px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Back to Leads
          </button>
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create User Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create User
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
                  placeholder="Enter user name"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
                  placeholder="Enter user email"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
                  required
                  disabled={isLoading}
                >
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="h-4 w-4 mr-1" /> Create User
              </button>
            </form>
          </div>

          {/* Existing Users List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Existing Users
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {users.length > 0 ? (
                users.map((user, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b border-gray-200 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                      <a
                        href={`mailto:${user.email}`}
                        className={`text-sm text-indigo-500 hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                      >
                        {user.email}
                      </a>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        user.role === 'admin' ? 'text-green-600' : 'text-gray-600'
                      }`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  No users found.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmAction}
          title="Confirm User Creation"
          message="Are you sure you want to create this user?"
          confirmText="Create User"
          cancelText="Cancel"
          confirmButtonProps={{
            disabled: isLoading,
            children: 'Create User',
          }}
        />
      </div>
    </div>
  );
};

export default Team;