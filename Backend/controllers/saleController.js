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
  
  export const getSaleByLead = async (req, res) => {
    try {
      const { leadId } = req.params;
      console.log('Fetching sale for leadId:', leadId);
      if (!mongoose.Types.ObjectId.isValid(leadId)) {
        return res.status(400).json({ success: false, message: 'Invalid lead ID' });
      }
      const sale = await Sale.findOne({ leadId })
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

  

  export const updateSale = async (req, res) => {
    try {
      const { leadId } = req.params;
      const { amount, paymentMethod, status } = req.body;
      const userId = req.user?.id;
  
      console.log('Updating sale for leadId:', leadId, 'with data:', { amount, paymentMethod, status });
  
      if (!mongoose.Types.ObjectId.isValid(leadId)) {
        return res.status(400).json({ success: false, message: 'Invalid lead ID' });
      }
      if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      if (!amount || !paymentMethod || !status) {
        return res.status(400).json({ success: false, message: 'All payment fields are required' });
      }
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }
  
      const sale = await Sale.findOne({ leadId });
      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }
  
      const changes = [];
      if (sale.amount !== amount) changes.push(`amount from ${sale.amount} to ${amount}`);
      if (sale.paymentMethod !== paymentMethod) changes.push(`paymentMethod from ${sale.paymentMethod} to ${paymentMethod}`);
      if (sale.status !== status) changes.push(`status from ${sale.status} to ${status}`);
  
      sale.amount = amount;
      sale.paymentMethod = paymentMethod;
      sale.status = status;
  
      if (changes.length > 0) {
        sale.notes.push({
          text: `Updated payment: ${changes.join(', ')}`,
          createdAt: new Date(),
          createdBy: userId || null,
        });
      }
  
      await sale.save();
  
      const updatedSale = await Sale.findOne({ leadId })
        .populate('notes.createdBy', 'name email');
      res.status(200).json({ success: true, data: updatedSale });
    } catch (error) {
      console.error('Error updating sale:', error);
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
        .populate('leadId', 'name')
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
      const { id } = req.params;
      const { text } = req.body;
      const userId = req.user?.id;
  
      console.log('Updating notes for saleId:', id, 'with text:', text);
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid sale ID' });
      }
      if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, message: 'Note text is required' });
      }
  
      const sale = await Sale.findById(id);
      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }
  
      sale.notes.push({
        text,
        createdAt: new Date(),
        createdBy: userId || null,
      });
  
      await sale.save();
  
      const updatedSale = await Sale.findById(id)
        .populate('leadId', 'name')
        .populate('notes.createdBy', 'name email');
      res.status(200).json({ success: true, data: updatedSale });
    } catch (error) {
      console.error('Error updating sale notes:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };