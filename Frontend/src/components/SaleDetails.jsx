import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Edit, Save } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const statusOptions = ['Pending', 'Completed', 'Failed', 'Refunded'];
const paymentMethodOptions = ['Credit Card', 'Bank Transfer', 'PayPal', 'Other'];
const paymentTypeOptions = ['Recurring', 'One-time'];

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    totalAmount: '0',
    paymentMethod: 'Other',
    paymentType: 'One-time',
    contractTerm: '',
    card: '',
    exp: '',
    cvv: '',
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
        const response = await fetch(`http://localhost:3000/sale/getsalebyid/${id}`, {
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
          totalAmount: data.data.totalAmount?.toString() || '0',
          paymentMethod: data.data.paymentMethod || 'Other',
          paymentType: data.data.paymentType || 'One-time',
          contractTerm: data.data.contractTerm || '',
          card: data.data.card || '',
          exp: data.data.exp || '',
          cvv: data.data.cvv || '',
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
      navigate('/sale/sales');
    }
  }, [id, navigate]);

  const handleSaveNotes = async () => {
    if (!newNote.trim()) {
      toast.warning('Please enter a note');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/sale/updatenotes/${id}`, {
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

  const updateStatus = (saleId, newStatus) => {
    if (sale.status === newStatus) {
      toast.info(`Status is already set to ${newStatus}`);
      return;
    }
    setConfirmTitle('Confirm Status Change');
    setConfirmMessage(`Are you sure you want to change the status from "${sale.status || 'None'}" to "${newStatus}"?`);
    setConfirmText('Change Status');
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`http://localhost:3000/sale/updatesale/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: newStatus,
            notes: [
              ...(sale.notes || []),
              {
                text: `Changed status to ${newStatus}`,
                createdAt: new Date(),
                createdBy: null, // Update with actual user ID if available
              },
            ],
          }),
        });

        if (response.ok) {
          toast.success('Status changed successfully');
          const updatedSale = await response.json();
          if (!updatedSale.success) {
            throw new Error(updatedSale.message || 'Failed to update sale');
          }
          setSale(updatedSale.data);
          setNotes(updatedSale.data.notes || []);
          setPaymentForm({
            totalAmount: updatedSale.data.totalAmount?.toString() || '0',
            paymentMethod: updatedSale.data.paymentMethod || 'Other',
            paymentType: updatedSale.data.paymentType || 'One-time',
            contractTerm: updatedSale.data.contractTerm || '',
            card: updatedSale.data.card || '',
            exp: updatedSale.data.exp || '',
            cvv: updatedSale.data.cvv || '',
          });
          setShowConfirmModal(false);
        } else {
          const errorData = await response.json();
          console.error('Failed to update status:', errorData.message);
          toast.error(errorData.message || 'Failed to update status');
        }
      } catch (error) {
        console.error('Error updating sale status:', error);
        toast.error('Error updating sale status');
      }
    });
    setShowConfirmModal(true);
  };

  const calculateRemainingAmount = () => {
    if (!sale || !sale.totalAmount) return 0;
    const paidAmount = sale.partialPayments
      ? sale.partialPayments.reduce((sum, payment) => sum + payment.amount, 0)
      : 0;
    return sale.totalAmount - paidAmount;
  };

  const calculatePartialPayment = () => {
    if (sale?.paymentType === 'Recurring' && sale?.totalAmount && sale?.contractTerm) {
      const months = parseInt(sale.contractTerm);
      return months > 0 ? (sale.totalAmount / months).toFixed(2) : '0.00';
    }
    return null;
  };

  const handleEditPayment = () => {
    if (
      !paymentForm.totalAmount ||
      !paymentForm.paymentMethod ||
      !paymentForm.paymentType ||
      !paymentForm.contractTerm ||
      !paymentForm.card ||
      !paymentForm.exp ||
      !paymentForm.cvv
    ) {
      toast.warning('All payment fields are required');
      return;
    }

    if (isNaN(paymentForm.totalAmount) || parseFloat(paymentForm.totalAmount) < 0) {
      toast.warning('Please enter a valid total amount');
      return;
    }

    if (isNaN(paymentForm.contractTerm) || parseInt(paymentForm.contractTerm) <= 0) {
      toast.warning('Please enter a valid contract term (number of months)');
      return;
    }

    if (!/^\d{16}$/.test(paymentForm.card)) {
      toast.warning('Please enter a valid 16-digit card number');
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(paymentForm.exp)) {
      toast.warning('Please enter a valid expiration date (MM/YY)');
      return;
    }

    if (!/^\d{3,4}$/.test(paymentForm.cvv)) {
      toast.warning('Please enter a valid CVV (3 or 4 digits)');
      return;
    }

    // Validation for payment updates
    const currentDate = new Date();
    const contractEndDate = sale.contractEndDate ? new Date(sale.contractEndDate) : null;
    const remainingAmount = calculateRemainingAmount();

    if (paymentForm.paymentType === 'One-time' && contractEndDate && contractEndDate > currentDate) {
      toast.warning('Cannot update payment details for one-time payment until contract end date is reached');
      return;
    }

    if (paymentForm.paymentType === 'Recurring') {
      const partialPaymentAmount = parseFloat(paymentForm.totalAmount) / parseInt(paymentForm.contractTerm);
      if (remainingAmount <= 0 && contractEndDate && contractEndDate > currentDate) {
        toast.warning('Cannot update payment details for recurring payment as full payment is received and contract term is not over');
        return;
      }
    }

    setShowPaymentModal(false);

    setConfirmTitle('Confirm Payment Update');
    setConfirmMessage('Are you sure you want to save changes to this sale?');
    setConfirmText('Save Changes');
    setConfirmAction(() => async () => {
      try {
        const paymentDate = new Date();
        let newContractEndDate = new Date(paymentDate);
        let partialPayment = null;
        let previousContract = null;

        if (paymentForm.paymentType === 'Recurring') {
          const partialPaymentAmount = parseFloat(paymentForm.totalAmount) / parseInt(paymentForm.contractTerm);
          if (remainingAmount > 0 && partialPaymentAmount > remainingAmount) {
            toast.warning(`Partial payment amount (${partialPaymentAmount.toFixed(2)}) exceeds remaining amount (${remainingAmount.toFixed(2)})`);
            return;
          }
          partialPayment = {
            amount: partialPaymentAmount,
            paymentDate: paymentDate.toISOString(),
            createdAt: new Date(),
            createdBy: null,
          };
          newContractEndDate = sale.contractEndDate ? new Date(sale.contractEndDate) : new Date(paymentDate);
          newContractEndDate.setMonth(newContractEndDate.getMonth() + 1);
        } else {
          newContractEndDate.setMonth(newContractEndDate.getMonth() + parseInt(paymentForm.contractTerm));
        }

        // If contractEndDate exists and is in the past, save current contract to previousContracts
        if (contractEndDate && contractEndDate <= currentDate) {
          previousContract = {
            totalAmount: sale.totalAmount,
            paymentType: sale.paymentType,
            contractTerm: sale.contractTerm,
            paymentMethod: sale.paymentMethod,
            card: sale.card,
            exp: sale.exp,
            cvv: sale.cvv,
            paymentDate: sale.paymentDate,
            contractEndDate: sale.contractEndDate,
            partialPayments: sale.partialPayments || [],
            createdAt: new Date(),
          };
        }

        const response = await fetch(`http://localhost:3000/sale/updatesale/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            totalAmount: parseFloat(paymentForm.totalAmount),
            paymentMethod: paymentForm.paymentMethod,
            paymentType: paymentForm.paymentType,
            contractTerm: paymentForm.contractTerm,
            card: paymentForm.card,
            exp: paymentForm.exp,
            cvv: paymentForm.cvv,
            partialPayments: partialPayment
              ? sale.partialPayments
                ? [...sale.partialPayments, partialPayment]
                : [partialPayment]
              : sale.partialPayments || [],
            paymentDate: paymentDate.toISOString(),
            contractEndDate: newContractEndDate.toISOString(),
            previousContracts: previousContract
              ? sale.previousContracts
                ? [...sale.previousContracts, previousContract]
                : [previousContract]
              : sale.previousContracts || [],
            notes: [
              ...(sale.notes || []),
              {
                text: `Updated payment details: Total Amount $${parseFloat(paymentForm.totalAmount).toFixed(2)}, Payment Method: ${paymentForm.paymentMethod}, Payment Type: ${paymentForm.paymentType}, Contract Term: ${paymentForm.contractTerm} months, Contract End Date: ${newContractEndDate.toLocaleDateString()}`,
                createdAt: new Date(),
                createdBy: null, // Update with actual user ID if available
              },
            ],
          }),
        });

        if (response.ok) {
          const updatedSale = await response.json();
          if (!updatedSale.success) {
            throw new Error(updatedSale.message || 'Failed to update sale');
          }
          setSale(updatedSale.data);
          setPaymentForm({
            totalAmount: updatedSale.data.totalAmount?.toString() || '0',
            paymentMethod: updatedSale.data.paymentMethod || 'Other',
            paymentType: updatedSale.data.paymentType || 'One-time',
            contractTerm: updatedSale.data.contractTerm || '',
            card: updatedSale.data.card || '',
            exp: updatedSale.data.exp || '',
            cvv: updatedSale.data.cvv || '',
          });
          setNotes(updatedSale.data.notes || []);
          toast.success('Payment details updated successfully');
        } else {
          const errorData = await response.json();
          console.error('Failed to update sale:', errorData.message);
          toast.error(errorData.message || 'Failed to update sale');
        }
      } catch (error) {
        console.error('Error updating sale:', error);
        toast.error('Error updating sale');
      } finally {
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex justify-center items-center md:pl-24 md:pt-20">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex justify-center items-center md:pl-24 md:pt-20">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
          <p className="text-sm font-medium">{error || 'Sale not found. Please check the sale ID or try again later.'}</p>
          <button
            onClick={() => navigate('/sale/sales')}
            className="mt-2 px-4 py-1 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sale Details</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition duration-200"
            >
              Payment
            </button>
            <button
              onClick={() => navigate(`/lead/${sale.leadId._id}`)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition duration-200"
            >
              View Lead
            </button>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white rounded-full shadow-md p-2 overflow-x-auto">
          {statusOptions.map((status, index) => (
            <button
              key={index}
              onClick={() => updateStatus(sale._id, status)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                sale.status === status
                  ? statusTextColors[status]
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lead Information</h3>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {[
                {
                  label: 'Lead Name',
                  key: 'leadId',
                  format: (value) => (
                    <button
                      onClick={() => navigate(`/lead/${value._id}`)}
                      className="text-teal-500 hover:underline"
                    >
                      {value.name}
                    </button>
                  ),
                },
                { label: 'Name', key: 'name' },
                { label: 'Email', key: 'email', isLink: true },
                { label: 'Phone Number', key: 'phoneNumber' },
                { label: 'Business Name', key: 'businessName' },
                { label: 'Business Address', key: 'businessAddress' },
                {
                  label: 'Created At',
                  key: 'createdAt',
                  format: (value) => new Date(value).toLocaleString(),
                },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-gray-200 py-2">
                  <span className="text-sm font-medium text-gray-600">{item.label}</span>
                  <div className="flex items-center gap-2 w-1/2">
                    {item.isLink ? (
                      <a
                        href={`mailto:${sale[item.key]}`}
                        className="text-sm text-teal-500 hover:underline truncate"
                      >
                        {sale[item.key]}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-900 truncate">
                        {item.format ? item.format(sale[item.key]) : sale[item.key] || 'Not set'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                        note.text.startsWith('Updated payment') ? 'bg-teal-50' :
                        note.text.startsWith('Card details updated') ? 'bg-blue-50' :
                        note.text.startsWith('Changed status') ? 'bg-purple-50' :
                        note.text.startsWith('Payment received and confirmed') ? 'bg-orange-50' :
                        'bg-gray-50'
                      }`}
                    >
                      <p className="text-sm text-gray-900">
                        {note.text.startsWith('Sale created') ? (
                          <span className="font-medium text-green-600">[Created] </span>
                        ) : note.text.startsWith('Updated payment') ? (
                          <span className="font-medium text-teal-600">[Updated] </span>
                        ) : note.text.startsWith('Card details updated') ? (
                          <span className="font-medium text-blue-600">[Card Update] </span>
                        ) : note.text.startsWith('Changed status') ? (
                          <span className="font-medium text-purple-600">[Status] </span>
                        ) : note.text.startsWith('Payment received and confirmed') ? (
                          <span className="font-medium text-orange-600">[Payment Confirmed] </span>
                        ) : null}
                        {note.text}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()} by{' '}
                        <span className="font-medium text-teal-600">{note.createdBy?.name || 'Unknown'}</span>
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
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 bg-white"
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
                    className="inline-flex items-center px-3 py-1 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    <Save className="h-4 w-4 mr-1" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="inline-flex items-center mt-4 px-3 py-1 text-sm text-teal-500 hover:text-teal-600"
              >
                <Edit className="h-4 w-4 mr-1" /> Add Note
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {[
                {
                  label: 'Card Number',
                  key: 'card',
                  format: (value) => `**** **** **** ${value.slice(-4)}`,
                },
                { label: 'Expiration Date', key: 'exp' },
                { label: 'CVV', key: 'cvv', format: () => '***' },
                {
                  label: 'Total Amount ($)',
                  key: 'totalAmount',
                  format: (value) => `$${parseFloat(value).toFixed(2)}`,
                },
                {
                  label: 'Remaining Amount ($)',
                  key: 'remainingAmount',
                  format: () => `$${calculateRemainingAmount().toFixed(2)}`,
                },
                sale?.paymentType === 'Recurring' && {
                  label: 'Partial Payment Amount ($)',
                  key: 'partialPayment',
                  format: () => `$${calculatePartialPayment()}`,
                },
                { label: 'Payment Type', key: 'paymentType' },
                { label: 'Contract Term', key: 'contractTerm' },
                {
                  label: 'Contract End Date',
                  key: 'contractEndDate',
                  format: (value) => (value ? new Date(value).toLocaleDateString() : 'Not set'),
                },
                { label: 'Payment Method', key: 'paymentMethod' },
                { label: 'Status', key: 'status' },
                {
                  label: 'Payment Date',
                  key: 'paymentDate',
                  format: (value) => (value ? new Date(value).toLocaleString() : 'Not Set'),
                },
              ]
                .filter(Boolean)
                .map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-200 py-2">
                    <span className="text-sm font-medium text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-2 w-1/2">
                      <span
                        className={`text-sm truncate ${
                          item.key === 'status'
                            ? statusTextColors[sale[item.key]] || 'text-gray-900'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.format ? item.format(sale[item.key]) : sale[item.key] || 'Not set'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Payment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contract Term (Months)</label>
                  <input
                    type="number"
                    value={paymentForm.contractTerm}
                    onChange={(e) => setPaymentForm({ ...paymentForm, contractTerm: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                    placeholder="Enter number of months"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.totalAmount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, totalAmount: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                    placeholder="Enter total amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                  <select
                    value={paymentForm.paymentType}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                    required
                  >
                    <option value="" disabled>Select payment type</option>
                    {paymentTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                {paymentForm.paymentType === 'Recurring' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Partial Payment Amount ($)</label>
                    <input
                      type="text"
                      value={
                        paymentForm.totalAmount && paymentForm.contractTerm && parseInt(paymentForm.contractTerm) > 0
                          ? (parseFloat(paymentForm.totalAmount) / parseInt(paymentForm.contractTerm)).toFixed(2)
                          : '0.00'
                      }
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
                      disabled
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                    required
                  >
                    <option value="" disabled>Select payment method</option>
                    {paymentMethodOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Number</label>
                  <input
                    type="text"
                    value={paymentForm.card}
                    onChange={(e) => setPaymentForm({ ...paymentForm, card: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                    placeholder="Enter full card number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiration Date (MM/YY)</label>
                  <input
                    type="text"
                    value={paymentForm.exp}
                    onChange={(e) => setPaymentForm({ ...paymentForm, exp: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CVV</label>
                  <input
                    type="text"
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                    placeholder="Enter CVV"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditPayment}
                  className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  <Save className="h-4 w-4 mr-1" /> Save
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

export default SaleDetails;