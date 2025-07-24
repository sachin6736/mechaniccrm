import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Users, ChevronUp, ChevronDown, PlusCircle, Search } from 'lucide-react';

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterDisposition, setFilterDisposition] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalLeads: 0, hasMore: false });
  const navigate = useNavigate();

  const fetchLeads = async (pageNum, disposition = filterDisposition, search = searchQuery, sort = sortField, order = sortOrder) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: pageNum,
        limit: 10,
        ...(disposition && { disposition }),
        ...(search && { search }),
        sortField: sort,
        sortOrder: order,
      }).toString();

      console.log('Fetching leads with query:', query);
      const response = await fetch(`http://localhost:3000/Lead/leads?${query}`, {
        method: 'GET',
        credentials: 'include',
      });
      const { success, data, pagination: paginationData } = await response.json();

      if (!success) {
        throw new Error(data.message || 'Failed to fetch leads');
      }

      setLeads(data);
      setPagination(paginationData);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load leads. Please try again later.');
      toast.error('Failed to load leads. Please try again later.');
      setLoading(false);
    }
  };

  // Debounced version of fetchLeads for search
  const debouncedFetchLeads = useCallback(
    debounce((pageNum, disposition, search, sort, order) => {
      fetchLeads(pageNum, disposition, search, sort, order);
    }, 300),
    [] // Empty dependency array since fetchLeads doesn't depend on external state
  );

  useEffect(() => {
    fetchLeads(1);
  }, []);

  const handleSort = (field) => {
    const isSameField = sortField === field;
    const newSortOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
    setPage(1);
    fetchLeads(1, filterDisposition, searchQuery, field, newSortOrder);
  };

  const handleFilterChange = (e) => {
    const newDisposition = e.target.value;
    setFilterDisposition(newDisposition);
    setPage(1);
    fetchLeads(1, newDisposition, searchQuery, sortField, sortOrder);
  };

  const handleSearchChange = (e) => {
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
    setPage(1);
    debouncedFetchLeads(1, filterDisposition, newSearchQuery, sortField, sortOrder);
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLeads(nextPage, filterDisposition, searchQuery);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchLeads(prevPage, filterDisposition, searchQuery);
    }
  };

  const handlePageClick = (pageNum) => {
    setPage(pageNum);
    fetchLeads(pageNum, filterDisposition, searchQuery);
  };

  const handleLeadClick = (leadId) => {
    navigate(`/lead/${leadId}`);
  };

  const renderSkeletonLoader = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="h-12 bg-gray-200 animate-pulse rounded-md" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 pt-24 md:pl-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-indigo-600" />
            <h2 className="text-3xl font-bold text-gray-900">Leads Management</h2>
          </div>
          <button
            onClick={() => navigate('/AddLead')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Lead
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
              Search Leads
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name, email, phone, or business name"
                className="w-full sm:w-64 pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm bg-white shadow-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="dispositionFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Disposition
            </label>
            <select
              id="dispositionFilter"
              value={filterDisposition}
              onChange={handleFilterChange}
              className="w-full sm:w-64 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm bg-white shadow-sm"
            >
              <option value="">All Dispositions</option>
              <option value="Not interested">Not interested</option>
              <option value="Follow up">Follow up</option>
              <option value="Sale">Sale</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-6">{renderSkeletonLoader()}</div>
          ) : leads.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm font-medium">
              No leads found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      {[
                        { label: 'Name', field: 'name' },
                        { label: 'Email', field: 'email' },
                        { label: 'Phone', field: 'phoneNumber' },
                        { label: 'Business Name', field: 'businessName' },
                        { label: 'Disposition', field: 'disposition' },
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
                    {leads.map((lead, index) => (
                      <tr
                        key={lead._id}
                        className={`${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-indigo-100 transition duration-200 cursor-pointer`}
                        onClick={() => handleLeadClick(lead._id)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{lead.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{lead.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{lead.phoneNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{lead.businessName}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              lead.disposition === 'Sale'
                                ? 'bg-green-100 text-green-800'
                                : lead.disposition === 'Follow up'
                                ? 'bg-yellow-100 text-yellow-800'
                                : lead.disposition === 'Not interested'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {lead.disposition || 'None'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(pagination.hasMore || page > 1) && (
                <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.totalLeads)} of{' '}
                    {pagination.totalLeads} leads
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

export default Leads;