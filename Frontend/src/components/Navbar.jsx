import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Users, List, UserPlus, ShoppingCart, UserCheck, FileText, Clock, User } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmationModal from '../components/ConfirmationModal';

const API = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Capitalize role for display
  const formatRole = (role) => {
    if (!role) return 'N/A';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  // Fetch authentication status, user role, and username on mount
  useEffect(() => {
    const checkAuth = async () => {
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
          setUserName(data.user.name || 'Unknown User');
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setIsAuthenticated(false);
        toast.error('Authentication error');
        navigate('/login', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/Auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setIsAuthenticated(null);
        setUserRole(null);
        setUserName(null);
        toast.success('Logged out successfully');
        navigate('/login', { replace: true });
      } else {
        toast.error('Failed to log out');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error during logout');
    } finally {
      setLoading(false);
    }
  };

  const confirmLogout = () => {
    if (loading) return;
    setShowConfirmModal(true);
  };

  const navItems = [
    ...(userRole === 'admin'
      ? [
          {
            label: 'Team',
            icon: <Users className="h-6 w-6 text-indigo-600" />,
            onClick: () => {
              if (loading) return;
              navigate('/team');
              setShowSidebar(false);
            },
          },
        ]
      : []),
    {
      label: 'View Leads',
      icon: <List className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        if (loading) return;
        navigate('/leads');
        setShowSidebar(false);
      },
    },
    {
      label: 'Create Lead',
      icon: <UserPlus className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        if (loading) return;
        navigate('/AddLead');
        setShowSidebar(false);
      },
    },
    {
      label: 'View Sales',
      icon: <ShoppingCart className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        if (loading) return;
        navigate('/sales');
        setShowSidebar(false);
      },
    },
    {
      label: 'My Sales',
      icon: <UserCheck className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        if (loading) return;
        navigate('/user-sales');
        setShowSidebar(false);
      },
    },
    {
      label: 'Orders',
      icon: <FileText className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        if (loading) return;
        navigate('/completed-sales');
        setShowSidebar(false);
      },
    },
    {
      label: 'Dues',
      icon: <Clock className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        if (loading) return;
        navigate('/due-sales');
        setShowSidebar(false);
      },
    },
  ];

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will handle navigation)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Custom Loader Overlay for Logout */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-20 h-screen bg-white shadow-lg fixed left-0 top-0 flex-col items-center pt-6 space-y-6 z-50">
        {navItems.map((item, index) => (
          <div
            key={index}
            className={`flex flex-col items-center space-y-2 cursor-pointer group ${loading ? 'opacity-50 pointer-events-none' : 'hover:scale-105 transition-transform duration-200'}`}
            onClick={item.onClick}
            title={item.label}
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center transition duration-300 group-hover:bg-indigo-100 group-hover:shadow-lg">
              {item.icon}
            </div>
            <span className="text-indigo-600 text-xs font-medium text-center group-hover:font-bold group-hover:text-indigo-700 transition duration-300">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex w-full h-16 bg-indigo-600 text-white fixed top-0 left-0 pl-20 items-center justify-end px-6 shadow-lg z-40">
        <div
          className="relative flex items-center space-x-3 cursor-pointer"
          onClick={() => !loading && setShowUserDropdown(!showUserDropdown)}
        >
          <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-md transition duration-300 hover:bg-indigo-50">
            <User className="w-6 h-6" />
          </div>
          {showUserDropdown && (
            <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl p-4 w-48 z-50 border border-gray-200">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-sm text-green-600">{formatRole(userRole)}</p>
              <button
                onClick={confirmLogout}
                className={`mt-3 w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden w-full h-16 bg-indigo-600 text-white fixed top-0 left-0 flex items-center justify-between px-4 z-40 shadow-lg">
        <button
          className={`text-white ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 transition-transform duration-200'}`}
          onClick={() => !loading && setShowSidebar(true)}
          disabled={loading}
        >
          <Menu className="w-8 h-8" />
        </button>
        <div
          className="relative flex items-center space-x-3 cursor-pointer"
          onClick={() => !loading && setShowUserDropdown(!showUserDropdown)}
        >
          <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-md transition duration-300 hover:bg-indigo-50">
            <User className="w-6 h-6" />
          </div>
          {showUserDropdown && (
            <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl p-4 w-48 z-50 border border-gray-200">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-sm text-green-600">{formatRole(userRole)}</p>
              <button
                onClick={confirmLogout}
                className={`mt-3 w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 bg-indigo-600 text-white z-50 flex flex-col pt-8 space-y-6 transform transition-transform duration-300 ease-in-out translate-x-0">
          <button
            onClick={() => !loading && setShowSidebar(false)}
            className={`absolute top-4 right-4 text-white ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 transition-transform duration-200'}`}
            disabled={loading}
          >
            <X className="w-8 h-8" />
          </button>
          {navItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center space-x-4 cursor-pointer px-6 py-2 rounded-lg ${loading ? 'opacity-50 pointer-events-none' : 'hover:bg-indigo-700 transition duration-300'}`}
              onClick={item.onClick}
            >
              <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 rounded-lg">
                {item.icon}
              </div>
              <span className="text-white text-lg font-medium">
                {item.label}
              </span>
            </div>
          ))}
          <div
            className={`flex items-center space-x-4 cursor-pointer px-6 py-2 rounded-lg ${loading ? 'opacity-50 pointer-events-none' : 'hover:bg-indigo-700 transition duration-300'}`}
            onClick={confirmLogout}
          >
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 rounded-lg">
              <LogOut className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="text-white text-lg font-medium">
              Log Out
            </span>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Confirm"
        cancelText="Cancel"
        confirmButtonProps={{
          disabled: loading,
          children: 'Confirm',
          className: `px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`,
        }}
        cancelButtonProps={{
          disabled: loading,
          className: `px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`,
        }}
      />
    </>
  );
};

export default Navbar;