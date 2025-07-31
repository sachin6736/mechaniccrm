import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChevronUp, ChevronDown } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const UserSales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSales: 0,
    hasMore: false,
  });
  const [sort, setSort] = useState({ field: 'createdAt', order: 'desc' });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(''); // Default to empty (logged-in user)
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Check authentication status and fetch users on mount
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
          fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API}/Auth/allusers`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load user list.');
    }
  };

  // Fetch sales based on selected user
  useEffect(() => {
    if (!isAuthenticated) return; // Skip fetching if not authenticated
    const fetchUserSales = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: pagination.currentPage,
          limit: 10,
          sortField: sort.field,
          sortOrder: sort.order,
          ...(selectedUser && { userId: selectedUser }), // Add userId if selected
        });
        const response = await fetch(`${API}/Sale/user-sales?${queryParams}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Fetch user sales error:', errorText, 'Status:', response.status);
          throw new Error(`Failed to fetch user sales: ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch user sales');
        }
        console.log('Fetched user sales:', data.data);
        setSales(data.data);
        setPagination(data.pagination);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load sales.');
        toast.error('Failed to load sales.');
        setLoading(false);
      }
    };

    fetchUserSales();
  }, [isAuthenticated, pagination.currentPage, sort.field, sort.order, selectedUser]);

  const handleSort = (field) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center px-4 sm:px-6 md:pl-24 md:pt-20">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will handle navigation)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center px-4 sm:px-6 md:pl-24 md:pt-20">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center px-4 sm:px-6 md:pl-24 md:pt-20">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm w-full max-w-md">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 px-4 py-1 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 md:pl-24 md:pt-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">My Sales</h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <select
              value={selectedUser}
              onChange={handleUserChange}
              className="w-full sm:w-48 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            >
              <option value="">My Sales</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { label: 'SaleId', field: 'saleId' },
                  { label: 'Lead Name', field: 'leadId.name' },
                  { label: 'Business Name', field: 'leadId.businessName' },
                  { label: 'Total Amount', field: 'totalAmount' },
                  { label: 'Payment Type', field: 'paymentType' },
                  { label: 'Contract Term', field: 'contractTerm' },
                  { label: 'Payment Method', field: 'paymentMethod' },
                  { label: 'Status', field: 'status' },
                  { label: 'Created At', field: 'createdAt' },
                ].map((header) => (
                  <th
                    key={header.field}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-white bg-[#4f46e5] uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort(header.field)}
                  >
                    <div className="flex items-center gap-1">
                      {header.label}
                      {sort.field === header.field ? (
                        sort.order === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/sale/${sale._id}`)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sale.saleId || 'Not set'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sale.leadId?.name || 'Not set'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sale.leadId?.businessName || 'Not set'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ${parseFloat(sale.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sale.paymentType || 'Not set'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sale.contractTerm || 'Not set'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sale.paymentMethod || 'Not set'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          sale.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          sale.status === 'Failed' ? 'bg-red-100 text-red-800' :
                          sale.status === 'Refunded' ? 'bg-gray-100 text-gray-800' :
                          sale.status === 'Part-Payment' ? 'bg-blue-100 text-blue-800' :
                          'text-gray-900'
                        }`}
                      >
                        {sale.status || 'Not set'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'Not set'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-3 text-sm text-gray-500 text-center">
                    No sales found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sales.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {(pagination.currentPage - 1) * 10 + 1} to{' '}
              {Math.min(pagination.currentPage * 10, pagination.totalSales)} of{' '}
              {pagination.totalSales} sales
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:bg-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasMore}
                className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSales;