import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Edit, Save } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const statusOptions = ['Pending', 'Completed', 'Failed', 'Refunded'];
const paymentMethodOptions = ['Credit Card', 'Bank Transfer', 'PayPal', 'Other'];

const statusTextColors = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800',
  Failed: 'bg-red-100 text-red-800',
  Refunded: 'bg-gray-100 text-gray-800',
};

const SaleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '0',
    paymentMethod: 'Other',
    status: 'Pending',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmText, setConfirmText] = useState('Confirm');

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        console.log('Fetching sale with ID:', id);
        const response = await fetch(`http://localhost:3000/Sale/getsalebyid/${id}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Sale fetch error:', errorText, 'Status:', response.status);
          throw new Error(`Failed to fetch sale: ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch sale data');
        }
        setSale(data.data);
        setNotes(data.data.notes || []);
        setPaymentForm({
          amount: data.data.amount.toString() || '0',
          paymentMethod: data.data.paymentMethod || 'Other',
          status: data.data.status || 'Pending',
        });
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load sale data.');
        toast.error('Failed to load sale data.');
        setLoading(false);
      }
    };

    if (id) {
      fetchSale();
    } else {
      toast.error('Invalid sale ID');
      navigate('/Sale/sales');
    }
  }, [id, navigate]);

  const handleSaveNotes = async () => {
    if (!newNote.trim()) {
      toast.warning('Please enter a note');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/Sale/updatenotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: newNote }),
      });

      if (response.ok) {
        const updatedSale = await response.json();
        if (!updatedSale.success) {
          throw new Error(updatedSale.message || 'Failed to add note');
        }
        setSale(updatedSale.data);
        setNotes(updatedSale.data.notes || []);
        toast.success('Note added successfully');
        setNewNote('');
        setIsEditingNotes(false);
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

  const handleEditPayment = () => {
    if (!paymentForm.amount || !paymentForm.paymentMethod || !paymentForm.status) {
      toast.warning('All payment fields are required');
      return;
    }

    if (isNaN(paymentForm.amount) || parseFloat(paymentForm.amount) < 0) {
      toast.warning('Please enter a valid payment amount');
      return;
    }

    if (
      paymentForm.amount === sale.amount.toString() &&
      paymentForm.paymentMethod === sale.paymentMethod &&
      paymentForm.status === sale.status
    ) {
      toast.info('No changes made to payment details');
      setIsEditingPayment(false);
      return;
    }

    setConfirmTitle('Confirm Payment Edit');
    setConfirmMessage('Are you sure you want to save changes to this sale?');
    setConfirmText('Save Changes');
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`http://localhost:3000/Sale/updatesale/${sale.leadId._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            amount: parseFloat(paymentForm.amount),
            paymentMethod: paymentForm.paymentMethod,
            status: paymentForm.status,
          }),
        });

        if (response.ok) {
          const updatedSale = await response.json();
          if (!updatedSale.success) {
            throw new Error(updatedSale.message || 'Failed to update sale');
          }
          setSale(updatedSale.data);
          setPaymentForm({
            amount: updatedSale.data.amount.toString(),
            paymentMethod: updatedSale.data.paymentMethod,
            status: updatedSale.data.status,
          });
          setNotes(updatedSale.data.notes || []);
          setIsEditingPayment(false);
          toast.success('Payment details updated successfully');
          setShowConfirmModal(false);
        } else {
          const errorData = await response.json();
          console.error('Failed to update sale:', errorData.message);
          toast.error(errorData.message || 'Failed to update sale');
        }
      } catch (error) {
        console.error('Error updating sale:', error);
        toast.error('Error updating sale');
      }
    });
    setShowConfirmModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex justify-center items-center md:pl-24 md:pt-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex justify-center items-center md:pl-24 md:pt-20">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
          <p className="text-sm font-medium">{error || 'Sale not found. Please check the sale ID or try again later.'}</p>
          <button
            onClick={() => navigate('/Sale/sales')}
            className="mt-2 px-4 py-1 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Back to Sales
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sale Details</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/Sale/sales')}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
            >
              Back to Sales
            </button>
            <button
              onClick={() => navigate(`/lead/${sale.leadId._id}`)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
            >
              View Lead
            </button>
          </div>
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sale Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sale Information</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingPayment(!isEditingPayment)}
                  className={`flex items-center gap-1 text-sm ${
                    isEditingPayment ? 'text-red-500' : 'text-indigo-500'
                  } hover:text-indigo-600 transition-colors duration-200`}
                >
                  {isEditingPayment ? 'Cancel' : <><Edit size={16} /> Edit</>}
                </button>
                {isEditingPayment && (
                  <button
                    onClick={handleEditPayment}
                    className="flex items-center gap-1 text-sm text-green-500 hover:text-green-600 transition-colors duration-200"
                  >
                    <Save size={16} /> Save
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {[
                {
                  label: 'Lead Name',
                  key: 'leadId',
                  format: (value) => (
                    <button
                      onClick={() => navigate(`/lead/${value._id}`)}
                      className="text-indigo-500 hover:underline"
                    >
                      {value.name}
                    </button>
                  ),
                },
                {
                  label: 'Amount ($)',
                  key: 'amount',
                  format: (value) => `$${parseFloat(value).toFixed(2)}`,
                },
                { label: 'Payment Method', key: 'paymentMethod' },
                { label: 'Status', key: 'status' },
                {
                  label: 'Payment Date',
                  key: 'paymentDate',
                  format: (value) => new Date(value).toLocaleString(),
                },
                {
                  label: 'Created At',
                  key: 'createdAt',
                  format: (value) => new Date(value).toLocaleString(),
                },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-gray-200 py-2">
                  <span className="text-sm font-medium text-gray-600">{item.label}</span>
                  <div className="flex items-center gap-2 w-1/2">
                    {isEditingPayment && (item.key === 'amount' || item.key === 'paymentMethod' || item.key === 'status') ? (
                      item.key === 'amount' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          className="bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none text-right text-sm w-full text-gray-900 transition-colors duration-200"
                        />
                      ) : item.key === 'paymentMethod' ? (
                        <select
                          value={paymentForm.paymentMethod}
                          onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                          className="bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none text-right text-sm w-full text-gray-900 transition-colors duration-200"
                        >
                          {paymentMethodOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={paymentForm.status}
                          onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                          className="bg-transparent border-b border-gray-300 focus:border-indigo-500 focus:outline-none text-right text-sm w-full text-gray-900 transition-colors duration-200"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <span
                        className={`text-sm truncate ${
                          item.key === 'status'
                            ? statusTextColors[sale[item.key]] || 'text-gray-900'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.format ? item.format(sale[item.key]) : sale[item.key] || 'Not set'}
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
                        note.text.startsWith('Sale created') ? 'bg-green-50' :
                        note.text.startsWith('Updated payment') ? 'bg-blue-50' :
                        'bg-gray-50'
                      }`}
                    >
                      <p className="text-sm text-gray-900">
                        {note.text.startsWith('Sale created') ? (
                          <span className="font-medium text-green-600">[Created] </span>
                        ) : note.text.startsWith('Updated payment') ? (
                          <span className="font-medium text-blue-600">[Updated] </span>
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
            {isEditingNotes ? (
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
                    onClick={() => setIsEditingNotes(false)}
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
                onClick={() => setIsEditingNotes(true)}
                className="inline-flex items-center mt-4 px-3 py-1 text-sm text-indigo-500 hover:text-indigo-600"
              >
                <Edit className="h-4 w-4 mr-1" /> Add Note
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
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

export default SaleDetails;