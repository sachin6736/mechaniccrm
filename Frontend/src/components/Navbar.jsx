import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Users, PlusCircle, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const API = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Fetch user role on mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`${API}/Auth/check-auth`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok && data.isAuthenticated) {
          setUserRole(data.user.role);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
      }
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API}/Auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Logged out successfully');
        navigate('/');
      } else {
        toast.error('Failed to log out');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error during logout');
    }
  };

  const navItems = [
    ...(userRole === 'admin'
      ? [
          {
            label: 'Team',
            icon: <Users className="h-6 w-6 text-indigo-600" />,
            onClick: () => {
              navigate('/team');
              setShowSidebar(false);
            },
          },
        ]
      : []),
    {
      label: 'View Leads',
      icon: <Users className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        navigate('/leads');
        setShowSidebar(false);
      },
    },
    {
      label: 'Create Leads',
      icon: <PlusCircle className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        navigate('/AddLead');
        setShowSidebar(false);
      },
    },
    {
      label: 'View Sales',
      icon: <DollarSign className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        navigate('/sales');
        setShowSidebar(false);
      },
    },
    {
      label: 'My Sales',
      icon: <DollarSign className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        navigate('/user-sales');
        setShowSidebar(false);
      },
    },
    {
      label: 'Orders',
      icon: <DollarSign className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        navigate('/completed-sales');
        setShowSidebar(false);
      },
    },
    {
      label: 'Dues',
      icon: <Calendar className="h-6 w-6 text-indigo-600" />,
      onClick: () => {
        navigate('/due-sales');
        setShowSidebar(false);
      },
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-20 h-screen bg-white shadow-lg fixed left-0 top-0 flex-col items-center pt-4 space-y-4 z-50">
        {navItems.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center space-y-2 cursor-pointer group"
            onClick={item.onClick}
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center transition duration-300 group-hover:bg-indigo-100 group-hover:shadow-md">
              {item.icon}
            </div>
            <span className="text-indigo-600 text-xs font-medium text-center group-hover:font-bold">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex w-full h-16 bg-indigo-600 text-white fixed top-0 left-0 pl-20 items-center justify-end px-4 shadow-md z-40">
        <button
          onClick={handleLogout}
          className="w-8 h-8 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-md"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden w-full h-16 bg-indigo-600 text-white fixed top-0 left-0 flex items-center justify-between px-4 z-40">
        <button
          className="text-white"
          onClick={() => setShowSidebar(true)}
        >
          <Menu className="w-8 h-8" />
        </button>
        <button
          onClick={handleLogout}
          className="w-8 h-8 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-md"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 bg-indigo-600 text-white z-50 flex flex-col items-center pt-8 space-y-6">
          <button
            onClick={() => setShowSidebar(false)}
            className="absolute top-4 right-4 text-white"
          >
            <X className="w-8 h-8" />
          </button>
          {navItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-4 cursor-pointer"
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
            className="flex items-center space-x-4 cursor-pointer"
            onClick={handleLogout}
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
    </>
  );
};

export default Navbar;