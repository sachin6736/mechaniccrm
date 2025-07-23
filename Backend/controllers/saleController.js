import mongoose from 'mongoose';
import Sale from '../Models/Sale.js';
import Lead from '../Models/Lead.js';

export const getAllSales = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      console.log('Fetching sales with pagination:', { page, limit, skip });
  
      const sales = await Sale.find()
        .sort({ createdAt: -1 }) // Sort by createdAt descending
        .skip(skip)
        .limit(limit)
        .populate('leadId', 'name businessName') // Populate name and businessName
        .populate('notes.createdBy', 'name email')
        .lean();
  
      const totalSales = await Sale.countDocuments();
  
      res.status(200).json({
        success: true,
        data: sales,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSales / limit),
          totalSales,
          hasMore: skip + sales.length < totalSales,
        },
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };

  export const getCompletedSales = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  
      console.log('Fetching completed sales with pagination:', { page, limit, skip, sortField, sortOrder });
  
      const sales = await Sale.find({ status: 'Completed' })
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('leadId', 'name businessName')
        .populate('notes.createdBy', 'name email')
        .lean();
  
      const totalSales = await Sale.countDocuments({ status: 'Completed' });
  
      res.status(200).json({
        success: true,
        data: sales,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSales / limit),
          totalSales,
          hasMore: skip + sales.length < totalSales,
        },
      });
    } catch (error) {
      console.error('Error fetching completed sales:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };
  
  export const getSaleById = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Fetching sale with ID:', id);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid sale ID' });
      }
      const sale = await Sale.findById(id)
        .populate('leadId', 'name businessName') // Populate relevant lead fields
        .populate('notes.createdBy', 'name email');
      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }
      res.status(200).json({ success: true, data: sale });
    } catch (error) {
      console.error('Error fetching sale:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };

  export const updateNotes = async (req, res) => {
    try {
      const { text } = req.body;
      const { id } = req.params; // Sale ID
      const userId = req.user.id; // From authMiddleware
  
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, message: 'Note text is required' });
      }
  
      const sale = await Sale.findById(id);
      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }
  
      // Add new note with user ID
      sale.notes.push({
        text: text.trim(),
        createdAt: new Date(),
        createdBy: userId,
      });
  
      await sale.save();
  
      res.status(200).json({ success: true, message: 'Note added successfully', data: sale });
    } catch (error) {
      console.error('Error adding note:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };

  export const updateSale = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user.id;
  
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'No update fields provided' });
      }
  
      const sale = await Sale.findById(id);
      if (!sale) {
        return res.status(400).json({ success: false, message: 'Sale not found' });
      }
  
      // Validation
      if (updates.totalAmount && (isNaN(updates.totalAmount) || updates.totalAmount < 0)) {
        return res.status(400).json({ success: false, message: 'Invalid total amount' });
      }
      if (updates.paymentMethod && !['Credit Card', 'Bank Transfer', 'PayPal', 'Other', null].includes(updates.paymentMethod)) {
        return res.status(400).json({ success: false, message: 'Invalid payment method' });
      }
      if (updates.paymentType && !['Recurring', 'One-time', null].includes(updates.paymentType)) {
        return res.status(400).json({ success: false, message: 'Invalid payment type' });
      }
      if (updates.contractTerm === undefined || updates.contractTerm === null || isNaN(updates.contractTerm) || parseInt(updates.contractTerm) <= 0) {
        return res.status(400).json({ success: false, message: 'Contract term is required and must be a positive number' });
      }
      if (updates.status && !['Pending', 'Completed', 'Failed', 'Refunded'].includes(updates.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      if (updates.card && !/^\d{16}$/.test(updates.card)) {
        return res.status(400).json({ success: false, message: 'Invalid card number (must be 16 digits)' });
      }
      if (updates.exp && !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(updates.exp)) {
        return res.status(400).json({ success: false, message: 'Invalid expiration date (must be MM/YY)' });
      }
      if (updates.cvv && !/^\d{3,4}$/.test(updates.cvv)) {
        return res.status(400).json({ success: false, message: 'Invalid CVV (must be 3 or 4 digits)' });
      }
      if (updates.partialPayments) {
        for (const payment of updates.partialPayments) {
          if (!payment.amount || isNaN(payment.amount) || payment.amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid partial payment amount' });
          }
          if (!payment.paymentDate || isNaN(new Date(payment.paymentDate).getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid partial payment date' });
          }
        }
      }
      if (updates.paymentDate && isNaN(new Date(updates.paymentDate).getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid payment date' });
      }
  
      // Add note for payment update
      if (
        updates.partialPayments ||
        updates.totalAmount ||
        updates.paymentMethod ||
        updates.paymentType ||
        updates.contractTerm ||
        updates.card ||
        updates.exp ||
        updates.cvv
      ) {
        sale.notes.push({
          text: 'Updated payment details',
          createdAt: new Date(),
          createdBy: userId,
        });
        // Add note for payment confirmation with total amount, contract term, and payment type
        sale.notes.push({
          text: `Payment confirmed by user. Total Amount: $${parseFloat(updates.totalAmount || sale.totalAmount).toFixed(2)}, Contract Term: ${updates.contractTerm || sale.contractTerm} months, Payment Type: ${updates.paymentType || sale.paymentType || 'Not set'}`,
          createdAt: new Date(),
          createdBy: userId,
        });
        sale.status = 'Completed'; // Automatically set status to Completed
        sale.paymentDate = new Date(); // Automatically set paymentDate to current date
      }
  
      if (updates.card || updates.exp || updates.cvv) {
        sale.notes.push({
          text: 'Card details updated by user',
          createdAt: new Date(),
          createdBy: userId,
        });
      }
  
      // Update sale fields
      Object.assign(sale, {
        totalAmount: updates.totalAmount !== undefined ? updates.totalAmount : sale.totalAmount,
        paymentMethod: updates.paymentMethod !== undefined ? updates.paymentMethod : sale.paymentMethod,
        paymentType: updates.paymentType !== undefined ? updates.paymentType : sale.paymentType,
        contractTerm: updates.contractTerm !== undefined ? updates.contractTerm : sale.contractTerm,
        card: updates.card !== undefined ? updates.card : sale.card,
        exp: updates.exp !== undefined ? updates.exp : sale.exp,
        cvv: updates.cvv !== undefined ? updates.cvv : sale.cvv,
        status: sale.status, // Use the updated status
        partialPayments: updates.partialPayments !== undefined ? updates.partialPayments : sale.partialPayments || [],
        paymentDate: sale.paymentDate, // Use the updated paymentDate
      });
  
      await sale.save();
  
      res.status(200).json({ success: true, message: 'Sale updated successfully', data: sale });
    } catch (error) {
      console.error('Error updating sale:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };