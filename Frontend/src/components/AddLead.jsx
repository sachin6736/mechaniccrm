import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PuffLoader } from 'react-spinners';
import useApiLoading from '../hooks/useApiLoading';

const API = import.meta.env.VITE_API_URL;

const AddLead = () => {
  const navigate = useNavigate();
  const { loading: apiLoading, withLoading } = useApiLoading();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    businessName: '',
    businessAddress: '',
    notes: '',
    disposition: 'Follow up',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Derived loading state for spinner and button disabling
  const isLoading = apiLoading.createLead;

  // Check authentication status on mount
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await withLoading('createLead', async () => {
      try {
        const response = await fetch(`${API}/Lead/createlead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success(data.message);
          navigate(`/lead/${data.data._id}`); // Navigate to new lead's details page
        } else {
          throw new Error(data.message || 'Failed to create lead');
        }
      } catch (error) {
        console.error('Error creating lead:', error);
        toast.error('Error creating lead');
      }
    });
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will handle navigation)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 md:pl-24 md:pt-20 relative">
      {/* Centered PuffLoader Overlay with Preferred Color and Opacity */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-50">
          <PuffLoader color="#2701FF" size={50} aria-label="Loading" />
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Lead</h2>
          <button
            onClick={() => navigate('/leads')}
            disabled={isLoading}
            className={`px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Back to Leads
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {[
              { label: 'Name', name: 'name', type: 'text', required: true },
              { label: 'Email', name: 'email', type: 'email', required: true },
              { label: 'Phone Number', name: 'phoneNumber', type: 'text', required: true },
              { label: 'Business Name', name: 'businessName', type: 'text', required: true },
              { label: 'Business Address', name: 'businessAddress', type: 'text', required: true },
              { label: 'Notes', name: 'notes', type: 'textarea' },
              {
                label: 'Disposition',
                name: 'disposition',
                type: 'select',
                options: ['Not Interested', 'Follow up', 'Sale'],
              },
            ].map((field) => (
              <div key={field.name} className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
                    rows="4"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    disabled={isLoading}
                  />
                ) : field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
                    disabled={isLoading}
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    className="mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    disabled={isLoading}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate('/leads')}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 rounded-lg transition-colors duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Create Lead
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLead;