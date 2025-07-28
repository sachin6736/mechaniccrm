import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Edit, Save } from 'lucide-react';
import Calendar from 'react-calendar';
import ConfirmationModal from '../components/ConfirmationModal';
import 'react-calendar/dist/Calendar.css';
const API = import.meta.env.VITE_API_URL;

const statusOptions = [
  'Not Interested',
  'Follow up',
  'Sale',
];

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [showDateNoteModal, setShowDateNoteModal] = useState(false);
  const [dateNote, setDateNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmText, setConfirmText] = useState('Confirm');

  useEffect(() => {
    const fetchSingleLead = async () => {
      try {
        setLoading(true);
        console.log('Fetching lead with ID:', id);
        const response = await fetch(`${API}/Lead/getleadbyid/${id}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`Failed to fetch lead: ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch lead data');
        }
        setSingleLead(data.data);
        setNotes(data.data.notes || []);
        setSelectedDates(data.data.importantDates || []);
        setEditForm({
          name: data.data.name || '',
          email: data.data.email || '',
          phoneNumber: data.data.phoneNumber || '',
          businessName: data.data.businessName || '',
          businessAddress: data.data.businessAddress || '',
          disposition: data.data.disposition || '',
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
      const response = await fetch(`${API}/Lead/updateNotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: newNote }),
      });

      if (response.ok) {
        const updatedLead = await response.json();
        if (!updatedLead.success) {
          throw new Error(updatedLead.message || 'Failed to add note');
        }
        setSingleLead(updatedLead.data);
        setNotes(updatedLead.data.notes || []);
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

  const handleDateClick = (date) => {
    const dateStr = formatLocalDate(date);
    const isSelected = selectedDates.includes(dateStr);
    setSelectedDate(dateStr);
    setIsDateSelected(isSelected);
    setDateNote('');
    setShowDateNoteModal(true);
  };

  const handleSaveDateNote = async () => {
    if (!selectedDate) {
      toast.error('No date selected');
      return;
    }

    const updatedDates = isDateSelected
      ? selectedDates.filter((d) => d !== selectedDate)
      : [...selectedDates, selectedDate];
    const autoNote = isDateSelected
      ? `Removed important date: ${selectedDate}`
      : `Added important date: ${selectedDate}`;
    const noteText = dateNote.trim()
      ? `${autoNote}. Custom note: ${dateNote}`
      : autoNote;

    try {
      const response = await fetch(`${API}/Lead/updateDates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ importantDates: updatedDates, noteText }),
      });

      if (response.ok) {
        const updatedLead = await response.json();
        if (!updatedLead.success) {
          throw new Error(updatedLead.message || 'Failed to update date');
        }
        setSingleLead(updatedLead.data);
        setNotes(updatedLead.data.notes || []);
        setSelectedDates(updatedLead.data.importantDates || []);
        toast.success('Date updated successfully');
        setShowDateNoteModal(false);
        setDateNote('');
        setSelectedDate(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to update date:', errorData.message);
        toast.error(errorData.message || 'Failed to update date');
      }
    } catch (error) {
      console.error('Error updating date:', error);
      toast.error('Error updating date');
    }
  };

  const handleEditLead = () => {
    if (!editForm.name || !editForm.email || !editForm.phoneNumber || !editForm.businessName || !editForm.businessAddress) {
      toast.warning('All fields are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.warning('Please enter a valid email');
      return;
    }

    const hasChanges = (
      editForm.name !== singleLead.name ||
      editForm.email !== singleLead.email ||
      editForm.phoneNumber !== singleLead.phoneNumber ||
      editForm.businessName !== singleLead.businessName ||
      editForm.businessAddress !== singleLead.businessAddress
    );

    if (!hasChanges) {
      toast.info('No changes made to lead details');
      setIsEditingLead(false);
      return;
    }

    setConfirmTitle('Confirm Lead Edit');
    setConfirmMessage('Are you sure you want to save changes to this lead?');
    setConfirmText('Save Changes');
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`${API}/Lead/editlead/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(editForm),
        });

        if (response.ok) {
          const updatedLead = await response.json();
          if (!updatedLead.success) {
            throw new Error(updatedLead.message || 'Failed to update lead');
          }
          setSingleLead(updatedLead.data);
          setNotes(updatedLead.data.notes || []);
          setEditForm({
            name: updatedLead.data.name || '',
            email: updatedLead.data.email || '',
            phoneNumber: updatedLead.data.phoneNumber || '',
            businessName: updatedLead.data.businessName || '',
            businessAddress: updatedLead.data.businessAddress || '',
            disposition: updatedLead.data.disposition || '',
          });
          setIsEditingLead(false);
          toast.success('Lead updated successfully');
          setShowConfirmModal(false);
        } else {
          const errorData = await response.json();
          console.error('Failed to update lead:', errorData.message);
          toast.error(errorData.message || 'Failed to update lead');
        }
      } catch (error) {
        console.error('Error updating lead:', error);
        toast.error('Error updating lead');
      }
    });
    setShowConfirmModal(true);
  };

  const updateStatus = (leadId, newStatus) => {
    if (singleLead.disposition === newStatus) {
      toast.info('Status is already set to ' + newStatus);
      return;
    }
    setConfirmTitle('Confirm Status Change');
    setConfirmMessage(`Are you sure you want to change the status from "${singleLead.disposition || 'None'}" to "${newStatus}"?`);
    setConfirmText('Change Status');
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`${API}/Lead/editstatus/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ disposition: newStatus }),
        });

        if (response.ok) {
          const updatedLead = await response.json();
          if (!updatedLead.success) {
            throw new Error(updatedLead.message || 'Failed to update status');
          }
          setSingleLead(updatedLead.data);
          setNotes(updatedLead.data.notes || []);
          setSelectedDates(updatedLead.data.importantDates || []);
          setEditForm({
            name: updatedLead.data.name || '',
            email: updatedLead.data.email || '',
            phoneNumber: updatedLead.data.phoneNumber || '',
            businessName: updatedLead.data.businessName || '',
            businessAddress: updatedLead.data.businessAddress || '',
            disposition: updatedLead.data.disposition || '',
          });
          if (newStatus === 'Sale') {
            toast.success('Draft sale created. Please complete payment details on the Sales page.');
          }
          toast.success('Status changed successfully');
          setShowConfirmModal(false);
        } else {
          const errorData = await response.json();
          console.error('Failed to update status:', errorData.message);
          toast.error(errorData.message || 'Failed to update status');
        }
      } catch (error) {
        console.error('Error updating lead status:', error);
        toast.error('Error updating lead status');
      }
    });
    setShowConfirmModal(true);
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
          <p className="text-sm font-medium">{error || 'Lead not found. Please check the lead ID or try again later.'}</p>
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
                      className={`p-3 rounded-lg border border-gray-200 ${
                        note.text.startsWith('Changed status') ? 'bg-purple-50' :
                        note.text.startsWith('Edited lead:') ? 'bg-blue-50' :
                        note.text.startsWith('Added important date:') || note.text.startsWith('Removed important date:') ? 'bg-red-50' :
                        'bg-gray-50'
                      }`}
                    >
                      <p className="text-sm text-gray-900">
                        {note.text.startsWith('Changed status') ? (
                          <span className="font-medium text-purple-600">[Status] </span>
                        ) : note.text.startsWith('Edited lead:') ? (
                          <span className="font-medium text-blue-600">[Edit] </span>
                        ) : note.text.startsWith('Added important date:') || note.text.startsWith('Removed important date:') ? (
                          <span className="font-medium text-red-600">[Date] </span>
                        ) : null}
                        {note.text}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()} by{' '}
                        <span className="font-medium text-indigo-600">{note.createdBy?.name || 'Unknown'}</span>
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
            <div className="flex justify-center mb-6">
              <Calendar
                onClickDay={handleDateClick}
                tileClassName={({ date }) =>
                  selectedDates.includes(formatLocalDate(date))
                    ? '!bg-red-500 text-white rounded-full'
                    : ''
                }
                className="border-none bg-transparent text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Date Note Modal */}
        {showDateNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-95 data-[is-open=true]:scale-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isDateSelected ? 'Remove Date' : 'Add Date'} Note
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {isDateSelected
                  ? `Removing date: ${selectedDate}`
                  : `Adding date: ${selectedDate}`}
              </p>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
                value={dateNote}
                onChange={(e) => setDateNote(e.target.value)}
                placeholder="Add an optional note..."
                rows="4"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowDateNoteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDateNote}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <Save className="h-4 w-4 mr-1 inline" /> Save
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmAction}
          title={confirmTitle}
          message={confirmMessage}
          confirmText={confirmText}
          cancelText="Cancel"
        />
      </div>
    </div>
  );
};

export default Lead;