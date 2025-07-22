import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddLead = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    businessName: '',
    businessAddress: '',
    notes: '',
    disposition: 'Follow up', // Default value, not editable in form
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.businessName || !formData.businessAddress) {
      setError('All required fields must be filled');
      toast.error('All required fields must be filled');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/Auth/createleads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Something went wrong');
        toast.error(data.message || 'Something went wrong');
        setLoading(false);
        return;
      }

      toast.success('Lead added successfully');
      navigate('/leads');
    } catch (err) {
      setError('Server error. Please try again later.');
      toast.error('Server error. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-indigo-600 mb-6">
          Add New Lead
        </h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              placeholder="Enter lead's name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              placeholder="Enter lead's email"
              required
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              placeholder="Enter phone number"
              required
            />
          </div>

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="businessName"
              id="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              placeholder="Enter business name"
              required
            />
          </div>

          <div>
            <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
              Business Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="businessAddress"
              id="businessAddress"
              value={formData.businessAddress}
              onChange={handleChange}
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              placeholder="Enter business address"
              required
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              placeholder="Enter any notes"
              rows="4"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Adding Lead...' : 'Add Lead'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Back to leads?{' '}
          <button
            onClick={() => navigate('/leads')}
            className="text-indigo-600 hover:underline font-medium"
          >
            View all leads
          </button>
        </p>
      </div>
    </div>
  );
};

export default AddLead;