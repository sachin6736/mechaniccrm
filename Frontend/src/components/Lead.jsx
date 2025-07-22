import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Edit, Save } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const statusOptions = [
  'Not Interested',
  'Follow up',
  'Sale',
];

const statusTextColors = {
  'Not Interested': 'bg-red-100 text-red-800',
  'Follow up': 'bg-yellow-100 text-yellow-800',
  'Sale': 'bg-green-100 text-green-800',
};

const Lead = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [singleLead, setSingleLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedDates, setSelectedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSingleLead = async () => {
      try {
        setLoading(true);
        console.log('Fetching lead with ID:', id);
        const response = await fetch(`http://localhost:3000/Lead/getleadbyid/${id}`, {
          method: 'GET',
          credentials: 'include',
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`Failed to fetch lead: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        setSingleLead(data);
        setNotes(data.notes || []);
        setSelectedDates(data.importantDates || []);
        setEditForm({
          name: data.name || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          businessName: data.businessName || '',
          businessAddress: data.businessAddress || '',
          disposition: data.disposition || '',
        });
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load lead data.');
        toast.error('Failed to load lead data.');
        setLoading(false);
      }
    };

    if (id) {
      fetchSingleLead();
    } else {
      toast.error('Invalid lead ID');
      navigate('/leads');
    }
  }, [id, navigate]);

  const handleSaveNotes = async () => {
    if (!newNote.trim()) {
      toast.warning('Please enter a note');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/Lead/updateNotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: newNote }), // Send only the new note text
      });

      if (response.ok) {
        const updatedLead = await response.json();
        setNotes(updatedLead.lead.notes || []);
        toast.success('Note added successfully');
        setNewNote('');
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        console.error('Failed to add note:', errorData.message);
        toast.error(errorData.message || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error adding note');
    }
  };

  const handleDateClick = async (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const isDateSelected = selectedDates.includes(dateStr);
    const updatedDates = isDateSelected
      ? selectedDates.filter((d) => d !== dateStr)
      : [...selectedDates, dateStr];

    try {
      const response = await fetch(`http://localhost:3000/Lead/updateDates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ importantDates: updatedDates }),
      });

      if (response.ok) {
        toast.success('Date updated successfully');
        setSelectedDates(updatedDates);
      } else {
        const errorText = await response.text();
        console.error('Failed to update date:', errorText);
        toast.error('Failed to update date');
      }
    } catch (error) {
      console.error('Error updating date:', error);
      toast.error('Error updating date');
    }
  };

  const handleEditLead = async () => {
    try {
      const response = await fetch(`http://localhost:3000/Lead/editlead/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedLead = await response.json();
        setSingleLead(updatedLead);
        setIsEditingLead(false);
        toast.success('Lead updated successfully');
      } else {
        const errorText = await response.text();
        console.error('Failed to update lead:', errorText);
        toast.error('Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Error updating lead');
    }
  };

  const updateStatus = async (leadId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/Lead/editstatus/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ disposition: newStatus }),
      });

      if (response.ok) {
        toast.success('Status changed successfully');
        const leadResponse = await fetch(`http://localhost:3000/Lead/getleadbyid/${leadId}`, {
          credentials: 'include',
        });
        const updatedLead = await leadResponse.json();
        setSingleLead(updatedLead);
      } else {
        const errorText = await response.text();
        console.error('Failed to update status:', errorText);
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Error updating lead status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !singleLead) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex justify-center items-center">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
          <p className="text-sm font-medium">{error || 'No lead data available.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 md:pl-24 md:pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header and Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Lead Details
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/leads')}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
            >
              Back to Leads
            </button>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-full shadow-md p-2 overflow-x-auto">
          {statusOptions.map((status, index) => (
            <button
              key={index}
              onClick={() => updateStatus(singleLead._id, status)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                singleLead.disposition === status
                  ? statusTextColors[status]
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Lead Information
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingLead(!isEditingLead)}
                  className={`flex items-center gap-1 text-sm ${
                    isEditingLead ? 'text-red-500' : 'text-indigo-500'
                  } hover:text-indigo-600 transition-colors duration-200`}
                >
                  {isEditingLead ? 'Cancel' : <><Edit size={16} /> Edit</>}
                </button>
                {isEditingLead && (
                  <button
                    onClick={handleEditLead}
                    className="flex items-center gap-1 text-sm text-green-500 hover:text-green-600 transition-colors duration-200"
                  >
                    <Save size={16} /> Save
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {[
                { label: 'Name', key: 'name' },
                { label: 'Email', key: 'email', isLink: true },
                { label: 'Phone Number', key: 'phoneNumber' },
                { label: 'Business Name', key: 'businessName' },
                { label: 'Business Address', key: 'businessAddress' },
                { label: 'Disposition', key: 'disposition' },
                { label: 'Created At', key: 'createdAt', format: (value) => new Date(value).toLocaleString() },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-gray-200 py-2">
                  <span className="text-sm font-medium text-gray-600">{item.label}</span>
                  <div className="flex items-center gap-2 w-1/2">
                    {isEditingLead && item.key !== 'disposition' && item.key !== 'createdAt' ? (
                      <input
                        type="text"
                        value={editForm[item.key] || ''}
                        onChange={(e) => setEditForm({ ...editForm, [item.key]: e.target.value })}
                        className="bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none text-right text-sm w-full text-gray-900 transition-colors duration-200"
                      />
                    ) : item.isLink ? (
                      <a
                        href={`mailto:${singleLead[item.key]}`}
                        className="text-sm text-indigo-500 hover:underline truncate"
                      >
                        {singleLead[item.key]}
                      </a>
                    ) : (
                      <span
                        className={`text-sm truncate ${
                          item.key === 'disposition'
                            ? statusTextColors[singleLead[item.key]] || 'text-gray-900'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.format ? item.format(singleLead[item.key]) : singleLead[item.key]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {notes.length > 0 ? (
                [...notes]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((note, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="text-sm text-gray-900">{note.text}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500 text-center">No notes added yet.</p>
              )}
            </div>
            {isEditing ? (
              <div className="mt-4">
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows="4"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-sm text-red-500 hover:text-red-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <Save className="h-4 w-4 mr-1" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center mt-4 px-3 py-1 text-sm text-indigo-500 hover:text-indigo-600"
              >
                <Edit className="h-4 w-4 mr-1" /> Add Note
              </button>
            )}
          </div>

          {/* Important Dates */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Dates</h3>
            <div className="flex justify-center">
              <Calendar
                onClickDay={handleDateClick}
                tileClassName={({ date }) =>
                  selectedDates.includes(date.toISOString().split('T')[0])
                    ? 'bg-indigo-500 text-white rounded-full'
                    : ''
                }
                className="border-none bg-transparent text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lead;