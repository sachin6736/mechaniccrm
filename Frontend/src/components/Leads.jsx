import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Users, ChevronUp, ChevronDown, PlusCircle, Search, Download } from 'lucide-react';
import { PuffLoader } from 'react-spinners';
import useApiLoading from '../hooks/useApiLoading';
import * as XLSX from 'xlsx';

const API = import.meta.env.VITE_API_URL;

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Leads = () => {
  const navigate = useNavigate();
  const { loading: apiLoading, withLoading } = useApiLoading();
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterDisposition, setFilterDisposition] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalLeads: 0, hasMore: false });
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Derived loading state for spinner and button/input disabling
  const isLoading = apiLoading.checkAuth || apiLoading.fetchLeads || apiLoading.downloadExcel;

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
            await fetchLeads(1);
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

  const fetchLeads = async (pageNum, disposition = filterDisposition, search = searchQuery, sort = sortField, order = sortOrder) => {
    await withLoading('fetchLeads', async () => {
      try {
        const query = new URLSearchParams({
          page: pageNum,
          limit: 10,
          ...(disposition && { disposition }),
          ...(search && { search }),
          sortField: sort,
          sortOrder: order,
        }).toString();

        console.log('Fetching leads with query:', query);
        const response = await fetch(`${API}/Lead/leads?${query}`, {
          method: 'GET',
          credentials: 'include',
        });
        const { success, data, pagination: paginationData } = await response.json();

        if (!success) {
          throw new Error(data.message || 'Failed to fetch leads');
        }

        setLeads(data);
        setPagination(paginationData);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load leads. Please try again later.');
        toast.error('Failed to load leads. Please try again later.');
      }
    });
  };

  const handleDownloadExcel = async () => {
    await withLoading('downloadExcel', async () => {
      try {
        const response = await fetch(`${API}/Lead/leads-download`, {
          method: 'GET',
          credentials: 'include',
        });
        const { success, data } = await response.json();

        if (!success) {
          throw new Error(data.message || 'Failed to fetch leads for download');
        }

        // Prepare data for Excel
        const worksheetData = data.map(lead => ({
          LeadID: lead.leadId,
          Name: lead.name,
          Email: lead.email,
          'Phone Number': lead.phoneNumber,
          'Business Name': lead.businessName,
          'Business Address': lead.businessAddress,
          Disposition: lead.disposition || 'None',
          'Created At': lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A',
          'Created By': lead.createdBy?.name || 'N/A',
          'Important Dates': lead.importantDates?.join(', ') || 'None',
          Notes: lead.notes?.map(note => note.text).join('; ') || 'None',
        }));

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

        // Set column widths
        worksheet['!cols'] = [
          { wch: 10 }, // LeadID
          { wch: 20 }, // Name
          { wch: 30 }, // Email
          { wch: 15 }, // Phone Number
          { wch: 25 }, // Business Name
          { wch: 30 }, // Business Address
          { wch: 15 }, // Disposition
          { wch: 20 }, // Created At
          { wch: 20 }, // Created By
          { wch: 30 }, // Important Dates
          { wch: 50 }, // Notes
        ];

        // Download the Excel file
        XLSX.writeFile(workbook, 'Leads.xlsx');
        toast.success('Leads downloaded successfully');
      } catch (err) {
        console.error('Download error:', err);
        toast.error('Failed to download leads');
      }
    });
  };

  // Debounced version of fetchLeads for search
  const debouncedFetchLeads = useCallback(
    debounce((pageNum, disposition, search, sort, order) => {
      fetchLeads(pageNum, disposition, search, sort, order);
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
    fetchLeads(1, filterDisposition, searchQuery, field, newSortOrder);
  };

  const handleFilterChange = (e) => {
    if (isLoading) return;
    const newDisposition = e.target.value;
    setFilterDisposition(newDisposition);
    setPage(1);
    fetchLeads(1, newDisposition, searchQuery, sortField, sortOrder);
  };

  const handleSearchChange = (e) => {
    if (isLoading) return;
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
    setPage(1);
    debouncedFetchLeads(1, filterDisposition, newSearchQuery, sortField, sortOrder);
  };

  const handleNextPage = () => {
    if (isLoading || !pagination.hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeads(nextPage, filterDisposition, searchQuery);
  };

  const handlePreviousPage = () => {
    if (isLoading || page <= 1) return;
    const prevPage = page - 1;
    setPage(prevPage);
    fetchLeads(prevPage, filterDisposition, searchQuery);
  };

  const handlePageClick = (pageNum) => {
    if (isLoading) return;
    setPage(pageNum);
    fetchLeads(pageNum, filterDisposition, searchQuery);
  };

  const handleLeadClick = (leadId) => {
    if (isLoading) return;
    navigate(`/lead/${leadId}`);
  };

  // Show loading state while checking authentication or fetching leads
  if (isAuthenticated === null || apiLoading.checkAuth || apiLoading.fetchLeads) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <PuffLoader color="#2701FF" size={50} aria-label="Loading" />
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will handle navigation)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 pt-24 md:pl-20 relative">
      {/* Centered PuffLoader Overlay with Preferred Color and Opacity */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center z-50">
          <PuffLoader color="#2701FF" size={50} aria-label="Loading" />
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-indigo-600" />
            <h2 className="text-3xl font-bold text-gray-900">Leads Management</h2>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/AddLead')}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              New Lead
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Download className="h-5 w-5 mr-2" />
              Download as Excel
            </button>
          </div>
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
                className={`w-full sm:w-64 pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm bg-white shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
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
              className={`w-full sm:w-64 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm bg-white shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              <option value="">All Dispositions</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Follow up">Follow up</option>
              <option value="Sale">Sale</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          {leads.length === 0 ? (
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
                        { label: 'Lead ID', field: 'leadId' },
                        { label: 'Name', field: 'name' },
                        { label: 'Email', field: 'email' },
                        { label: 'Phone', field: 'phoneNumber' },
                        { label: 'Business Name', field: 'businessName' },
                        { label: 'Disposition', field: 'disposition' },
                        { label: 'Lead CreatedBy', field: 'createdBy' },
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
                    {leads.map((lead, index) => (
                      <tr
                        key={lead._id}
                        className={`${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-indigo-100 transition duration-200 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => handleLeadClick(lead._id)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{lead.leadId}</td>
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
                                : lead.disposition === 'Not Interested'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {lead.disposition || 'None'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{lead.createdBy?.name || 'N/A'}</td>
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
                      disabled={page === 1 || isLoading}
                      className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5 ${
                        (page === 1 || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
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
                      className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5 ${
                        (!pagination.hasMore || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
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