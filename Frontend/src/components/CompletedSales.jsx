import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChevronUp, ChevronDown } from 'lucide-react';
const API = import.meta.env.VITE_API_URL;

const CompletedSales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalSales: 0, hasMore: false });
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchCompletedSales = async (pageNum, sort = sortField, order = sortOrder) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pageNum,
        limit: 10,
        sortField: sort,
        sortOrder: order,
      }).toString();

      console.log('Fetching completed sales with query:', query);
      const response = await fetch(`${API}/Sale/completedsales?${query}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Completed sales fetch error:', errorText, 'Status:', response.status);
        throw new Error(`Failed to fetch completed sales: ${response.status}`);
      }

      const { success, data, pagination: paginationData } = await response.json();
      if (!success) {
        throw new Error(data.message || 'Failed to fetch completed sales data');
      }

      setSales(data);
      setPagination(paginationData);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load completed sales data.');
      toast.error('Failed to load completed sales data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedSales(1);
  }, []);

  const handleSort = (field) => {
    const isSameField = sortField === field;
    const newSortOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
    setPage(1);
    fetchCompletedSales(1, field, newSortOrder);
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCompletedSales(nextPage);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchCompletedSales(prevPage);
    }
  };

  const handlePageClick = (pageNum) => {
    setPage(pageNum);
    fetchCompletedSales(pageNum);
  };

  const renderSkeletonLoader = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="h-12 bg-gray-200 animate-pulse rounded-md" />
      ))}
    </div>
  );

  if (loading && sales.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex justify-center items-center md:pl-24 md:pt-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex justify-center items-center md:pl-24 md:pt-20">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => navigate('/leads')}
            className="mt-2 px-4 py-1 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 md:pl-24 md:pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Completed Sales</h2>
          <button
            onClick={() => navigate('/leads')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
          >
            Back to Leads
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-6">{renderSkeletonLoader()}</div>
          ) : sales.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm font-medium">
              No completed sales found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      {[
                        { label: 'Lead Name', field: 'leadId.name' },
                        { label: 'Business Name', field: 'leadId.businessName' },
                        { label: 'Total Amount', field: 'totalAmount' },
                        { label: 'Payment Type', field: 'paymentType' },
                        { label: 'Contract Term', field: 'contractTerm' },
                        { label: 'Payment Method', field: 'paymentMethod' },
                        { label: 'Status', field: 'status' },
                        { label: 'Payment Date', field: 'paymentDate' },
                      ].map(({ label, field }) => (
                        <th
                          key={field}
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition duration-200"
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
                        } hover:bg-indigo-100 transition duration-200 cursor-pointer`}
                        onClick={() => navigate(`/sale/${sale._id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            {sale.leadId?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.leadId?.businessName || 'N/A'}
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
                              sale.status === 'Part-Payment'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                              }`}
                            >
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.paymentDate ? new Date(sale.paymentDate).toLocaleString() : 'Not Set'}
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
                    {pagination.totalSales} completed sales
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={page === 1 || loading}
                      className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5 ${
                        (page === 1 || loading) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
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
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              page === pageNum
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
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
                      disabled={!pagination.hasMore || loading}
                      className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5 ${
                        (!pagination.hasMore || loading) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
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

export default CompletedSales;