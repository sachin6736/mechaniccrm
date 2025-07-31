import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { PuffLoader } from 'react-spinners';
import useApiLoading from '../hooks/useApiLoading';

const API = import.meta.env.VITE_API_URL;

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Sales = () => {
  const navigate = useNavigate();
  const { loading: apiLoading, withLoading } = useApiLoading();
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalSales: 0, hasMore: false });
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending'); // Initialize with Pending
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Derived loading state
  const isLoading = apiLoading.checkAuth || apiLoading.fetchSales;

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
          if (!data.isAuthenticated) {
            setIsAuthenticated(false);
            toast.error('Please log in to access this page');
            navigate('/login', { replace: true });
          } else {
            setIsAuthenticated(true);
            await fetchSales(1, searchQuery, 'Pending'); // Initial fetch with Pending
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

  const fetchSales = async (pageNum, search = searchQuery, status = filterStatus, sort = sortField, order = sortOrder) => {
    await withLoading('fetchSales', async () => {
      try {
        const queryParams = new URLSearchParams({
          page: pageNum,
          limit: 10,
          sortField: sort,
          sortOrder: order,
        });
        if (search) queryParams.append('search', search);
        if (status !== undefined) queryParams.append('status', status); // Explicitly include status, even if empty

        console.log('Fetching sales with query:', queryParams.toString());
        const response = await fetch(`${API}/Sale/sales?${queryParams}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Sales fetch error:', errorText, 'Status:', response.status);
          throw new Error(`Failed to fetch sales: ${response.status}`);
        }

        const { success, data, pagination: paginationData } = await response.json();
        if (!success) {
          throw new Error(data.message || 'Failed to fetch sales data');
        }

        console.log('Fetched sales data:', data);
        setSales(data);
        setPagination(paginationData);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load sales data.');
        toast.error('Failed to load sales data.');
      }
    });
  };

  // Debounced version of fetchSales for search
  const debouncedFetchSales = useCallback(
    debounce((pageNum, search, status, sort, order) => {
      fetchSales(pageNum, search, status, sort, order);
    }, 1000),
    []
  );

  const handleSort = (field) => {
    if (isLoading) return;
    const isSameField = sortField === field;
    const newSortOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
    setPage(1);
    fetchSales(1, searchQuery, filterStatus, field, newSortOrder);
  };

  const handleSearchChange = (e) => {
    if (isLoading) return;
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
    setPage(1);
    debouncedFetchSales(1, newSearchQuery, filterStatus, sortField, sortOrder);
  };

  const handleFilterChange = (e) => {
    if (isLoading) return;
    const newStatus = e.target.value;
    setFilterStatus(newStatus);
    setPage(1);
    fetchSales(1, searchQuery, newStatus, sortField, sortOrder);
  };

  const handleNextPage = () => {
    if (isLoading || !pagination.hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSales(nextPage, searchQuery, filterStatus);
  };

  const handlePreviousPage = () => {
    if (isLoading || page <= 1) return;
    const prevPage = page - 1;
    setPage(prevPage);
    fetchSales(prevPage, searchQuery, filterStatus);
  };

  const handlePageClick = (pageNum) => {
    if (isLoading) return;
    setPage(pageNum);
    fetchSales(pageNum, searchQuery, filterStatus);
  };

  const handleSaleClick = (saleId) => {
    if (isLoading) return;
    navigate(`/sale/${saleId}`);
  };

  // Show loading state while checking authentication or fetching sales
  if (isAuthenticated === null || apiLoading.checkAuth || apiLoading.fetchSales) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center md:pl-24 md:pt-20">
        <PuffLoader color="#2701FF" size={50} aria-label="Loading" />
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will handle navigation)
  if (!isAuthenticated) {
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
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-50">
          <PuffLoader color="#2701FF" size={50} aria-label="Loading" />
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h2>
          <button
            onClick={() => navigate('/leads')}
            disabled={isLoading}
            className={`px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Back to Leads
          </button>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
              Search Sales
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name, business name, email, or phone"
                className={`w-full sm:w-64 pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm bg-white shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              />
            </div>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={handleFilterChange}
              className={`w-full sm:w-64 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm bg-white shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
              <option value="Part-Payment">Part-Payment</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {sales.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm font-medium">
              No sales found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      {[
                        { label: 'Sale ID', field: 'saleId' },
                        { label: 'Lead Name', field: 'leadId.name' },
                        { label: 'Business Name', field: 'leadId.businessName' },
                        { label: 'Total Amount', field: 'totalAmount' },
                        { label: 'Payment Type', field: 'paymentType' },
                        { label: 'Contract Term', field: 'contractTerm' },
                        { label: 'Payment Method', field: 'paymentMethod' },
                        { label: 'Status', field: 'status' },
                        { label: 'Payment Date', field: 'paymentDate' },
                        { label: 'Sale CreatedBy', field: 'createdBy.name' },
                      ].map(({ label, field }) => (
                        <th
                          key={field}
                          className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => handleSort(field)}
                        >
                          <div className="flex items-center">
                            {label}
                            {sortField === field && (
                              <span className="ml-2">
                                {sortOrder === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sales.map((sale, index) => (
                      <tr
                        key={sale._id}
                        className={`${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-indigo-100 transition duration-200 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => handleSaleClick(sale._id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.saleId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-indigo-600 hover:text-indigo-800 text-sm font-medium ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
                            {sale.name || sale.leadId?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.businessName || sale.leadId?.businessName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(sale.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.paymentType || 'Not Set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.contractTerm || 'Not Set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.paymentMethod || 'Not Set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sale.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : sale.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : sale.status === 'Failed'
                                ? 'bg-red-100 text-red-800'
                                : sale.status === 'Refunded'
                                ? 'bg-red-100 text-red-800'
                                : sale.status === 'Part-Payment'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.paymentDate ? new Date(sale.paymentDate).toLocaleString() : 'Not Set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.createdBy?.name || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(pagination.hasMore || page > 1) && (
                <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.totalSales)} of{' '}
                    {pagination.totalSales} sales
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={page === 1 || isLoading}
                      className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5 ${isLoading || page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {[...Array(Math.min(pagination.totalPages, 5))].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                          <button
                            key={`page-${pageNum}`}
                            onClick={() => handlePageClick(pageNum)}
                            disabled={isLoading}
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              page === pageNum
                                ? 'bg-indigo-600 text-white'
                                : `bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`
                            } transition duration-200`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {pagination.totalPages > 5 && (
                        <span className="text-sm text-gray-600">...</span>
                      )}
                    </div>
                    <button
                      onClick={handleNextPage}
                      disabled={!pagination.hasMore || isLoading}
                      className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5 ${isLoading || !pagination.hasMore ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales;