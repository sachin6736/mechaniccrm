import mongoose from 'mongoose';
import Sale from '../Models/Sale.js';
import Lead from '../Models/Lead.js';

export const getAllSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = req.query.search || '';

    console.log('Fetching sales with params:', { page, limit, skip, sortField, sortOrder, search });

    // Build query
    const query = { status: 'Pending' };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = [
        { status: 'Pending' },
        {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { phoneNumber: searchRegex },
            { businessName: searchRegex },
          ],
        },
      ];
    }

    const sortMapping = {
      'leadId.name': 'name',
      'leadId.businessName': 'businessName',
      totalAmount: 'totalAmount',
      paymentType: 'paymentType',
      contractTerm: 'contractTerm',
      paymentMethod: 'paymentMethod',
      status: 'status',
      paymentDate: 'paymentDate',
      createdAt: 'createdAt',
    };

    const sort = { [sortMapping[sortField] || 'createdAt']: sortOrder };

    const sales = await Sale.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('leadId', 'name businessName')
      .populate('notes.createdBy', 'name email')
      .populate('createdBy','name email')
      .lean();

    const totalSales = await Sale.countDocuments(query);

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

    const sales = await Sale.find({ status: { $in: ['Completed', 'Part-Payment'] } })
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('leadId', 'name businessName')
      .populate('notes.createdBy', 'name email')
      .lean();

    const totalSales = await Sale.countDocuments({ status: { $in: ['Completed', 'Part-Payment'] } });

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

export const getDueSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortField = req.query.sortField || 'contractEndDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = req.query.search || '';

    console.log('Fetching due sales with params:', { page, limit, skip, sortField, sortOrder, search });

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const query = {
      contractEndDate: {
        $lte: twoDaysFromNow,
        $ne: null,
      },
    };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { businessName: searchRegex },
      ];
    }

    const sortMapping = {
      'leadId.name': 'name',
      'leadId.businessName': 'businessName',
      totalAmount: 'totalAmount',
      paymentType: 'paymentType',
      contractTerm: 'contractTerm',
      paymentMethod: 'paymentMethod',
      status: 'status',
      contractEndDate: 'contractEndDate',
    };

    const sort = { [sortMapping[sortField] || 'contractEndDate']: sortOrder };

    const sales = await Sale.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('leadId', 'name businessName')
      .populate('notes.createdBy', 'name email')
      .lean();

    const totalSales = await Sale.countDocuments(query);

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
    console.error('Error fetching due sales:', error);
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
      .populate('leadId', 'name businessName')
      .populate('notes.createdBy', 'name email')
      .populate('createdBy', 'name');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    console.log('Fetched sale data:', JSON.stringify(sale, null, 2));
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateNotes = async (req, res) => {
  try {
    const { text } = req.body;
    const { id } = req.params;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

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

    const remainingAmount = sale.totalAmount - (sale.partialPayments ? sale.partialPayments.reduce((sum, payment) => sum + payment.amount, 0) : 0);
    const currentDate = new Date();
    const contractEndDate = sale.contractEndDate ? new Date(sale.contractEndDate) : null;

    if (updates.paymentType === 'One-time' && contractEndDate && contractEndDate > currentDate) {
      return res.status(400).json({ success: false, message: 'Cannot update payment details for one-time payment until contract end date is reached' });
    }

    if (updates.paymentType === 'Recurring') {
      const partialPaymentAmount = updates.totalAmount ? parseFloat(updates.totalAmount) / parseInt(updates.contractTerm || sale.contractTerm) : sale.totalAmount / parseInt(sale.contractTerm);
      if (remainingAmount <= 0 && contractEndDate && contractEndDate > currentDate) {
        return res.status(400).json({ success: false, message: 'Cannot update payment details for recurring payment as full payment is received and contract term is not over' });
      }
      if (updates.partialPayments) {
        for (const payment of updates.partialPayments) {
          if (payment.amount !== partialPaymentAmount) {
            return res.status(400).json({ success: false, message: `Partial payment amount must be ${partialPaymentAmount.toFixed(2)}` });
          }
        }
      }
    }

    if (updates.totalAmount && (isNaN(updates.totalAmount) || updates.totalAmount < 0)) {
      return res.status(400).json({ success: false, message: 'Invalid total amount' });
    }
    if (updates.paymentMethod && !['Credit Card', 'Bank Transfer', 'PayPal', 'Other'].includes(updates.paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }
    if (updates.paymentType && !['Recurring', 'One-time'].includes(updates.paymentType)) {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }
    if (updates.contractTerm === undefined || updates.contractTerm === null || isNaN(updates.contractTerm) || parseInt(updates.contractTerm) <= 0) {
      return res.status(400).json({ success: false, message: 'Contract term is required and must be a positive number' });
    }
    if (updates.status && !['Pending', 'Completed', 'Failed', 'Refunded', 'Part-Payment'].includes(updates.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    if (updates.paymentMethod === 'Credit Card') {
      if (updates.card && !/^\d{16}$/.test(updates.card)) {
        return res.status(400).json({ success: false, message: 'Invalid card number (must be 16 digits)' });
      }
      if (updates.exp && !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(updates.exp)) {
        return res.status(400).json({ success: false, message: 'Invalid expiration date (must be MM/YY)' });
      }
      if (updates.cvv && !/^\d{3,4}$/.test(updates.cvv)) {
        return res.status(400).json({ success: false, message: 'Invalid CVV (must be 3 or 4 digits)' });
      }
      if (!updates.card || !updates.exp || !updates.cvv) {
        return res.status(400).json({ success: false, message: 'Card number, expiration date, and CVV are required for Credit Card payments' });
      }
      if (!updates.billingAddress || updates.billingAddress.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'Billing address is required for Credit Card payments (minimum 5 characters)' });
      }
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

    let newContractEndDate = updates.paymentDate ? new Date(updates.paymentDate) : sale.paymentDate ? new Date(sale.paymentDate) : new Date();
    let updatedPartialPayments = updates.partialPayments || sale.partialPayments || [];

    if (updates.paymentType === 'Recurring' && updates.partialPayments && updates.partialPayments.length > 0) {
      newContractEndDate = sale.contractEndDate ? new Date(sale.contractEndDate) : new Date(updates.paymentDate || sale.paymentDate || new Date());
      newContractEndDate.setMonth(newContractEndDate.getMonth() + 1);
    } else if (updates.paymentType === 'One-time') {
      newContractEndDate.setMonth(newContractEndDate.getMonth() + parseInt(updates.contractTerm || sale.contractTerm));
    }

    let previousContracts = sale.previousContracts || [];
    if (contractEndDate && contractEndDate <= currentDate) {
      previousContracts.push({
        totalAmount: sale.totalAmount,
        paymentType: sale.paymentType,
        contractTerm: sale.contractTerm,
        paymentMethod: sale.paymentMethod,
        card: sale.paymentMethod === 'Credit Card' ? sale.card : null,
        exp: sale.paymentMethod === 'Credit Card' ? sale.exp : null,
        cvv: sale.paymentMethod === 'Credit Card' ? sale.cvv : null,
        billingAddress: sale.paymentMethod === 'Credit Card' ? sale.billingAddress : null,
        paymentDate: sale.paymentDate,
        contractEndDate: sale.contractEndDate,
        partialPayments: sale.partialPayments || [],
        createdAt: new Date(),
      });
      updatedPartialPayments = [];
      newContractEndDate = new Date(updates.paymentDate || new Date());
      if (updates.paymentType === 'One-time') {
        newContractEndDate.setMonth(newContractEndDate.getMonth() + parseInt(updates.contractTerm || sale.contractTerm));
      } else {
        newContractEndDate.setMonth(newContractEndDate.getMonth() + 1);
      }
    }

    if (
      updates.partialPayments ||
      updates.totalAmount ||
      updates.paymentMethod ||
      updates.paymentType ||
      updates.contractTerm ||
      (updates.paymentMethod === 'Credit Card' && (updates.card || updates.exp || updates.cvv || updates.billingAddress))
    ) {
      sale.notes.push({
        text: `Updated payment details: Total Amount $${parseFloat(updates.totalAmount || sale.totalAmount).toFixed(2)}, Payment Method: ${updates.paymentMethod || sale.paymentMethod || 'Not set'}, Payment Type: ${updates.paymentType || sale.paymentType || 'Not set'}, Contract Term: ${updates.contractTerm || sale.contractTerm} months, Contract End Date: ${newContractEndDate.toLocaleDateString()}${updates.paymentMethod === 'Credit Card' ? `, Billing Address: ${updates.billingAddress}` : ''}`,
        createdAt: new Date(),
        createdBy: userId,
      });
      sale.notes.push({
        text: `Payment confirmed by user. Total Amount: $${parseFloat(updates.totalAmount || sale.totalAmount).toFixed(2)}, Contract Term: ${updates.contractTerm || sale.contractTerm} months, Payment Type: ${updates.paymentType || sale.paymentType || 'Not set'}`,
        createdAt: new Date(),
        createdBy: userId,
      });
      sale.status = updates.paymentType === 'Recurring' ? 'Part-Payment' : 'Completed';
      sale.paymentDate = updates.paymentDate || new Date();
    }

    if (updates.paymentMethod === 'Credit Card' && (updates.card || updates.exp || updates.cvv || updates.billingAddress)) {
      sale.notes.push({
        text: 'Card details updated by user',
        createdAt: new Date(),
        createdBy: userId,
      });
    }

    Object.assign(sale, {
      totalAmount: updates.totalAmount !== undefined ? updates.totalAmount : sale.totalAmount,
      paymentMethod: updates.paymentMethod !== undefined ? updates.paymentMethod : sale.paymentMethod,
      paymentType: updates.paymentType !== undefined ? updates.paymentType : sale.paymentType,
      contractTerm: updates.contractTerm !== undefined ? updates.contractTerm : sale.contractTerm,
      card: updates.paymentMethod === 'Credit Card' ? updates.card : null,
      exp: updates.paymentMethod === 'Credit Card' ? updates.exp : null,
      cvv: updates.paymentMethod === 'Credit Card' ? updates.cvv : null,
      billingAddress: updates.paymentMethod === 'Credit Card' ? updates.billingAddress : null,
      status: sale.status,
      partialPayments: updatedPartialPayments,
      paymentDate: sale.paymentDate,
      contractEndDate: newContractEndDate,
      previousContracts: previousContracts,
    });

    await sale.save();

    res.status(200).json({ success: true, message: 'Sale updated successfully', data: sale });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getUserSales = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id; // Use query param or authenticated user's ID
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = req.query.search || '';

    console.log('Fetching user sales with params:', { userId, page, limit, skip, sortField, sortOrder, search });

    // Build query
    const query = { createdBy: userId }; // Filter by specified user ID
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$and = [
        { createdBy: userId },
        {
          $or: [
            { 'leadId.name': searchRegex },
            { 'leadId.email': searchRegex },
            { 'leadId.phoneNumber': searchRegex },
            { 'leadId.businessName': searchRegex },
          ],
        },
      ];
    }

    const sortMapping = {
      'leadId.name': 'leadId.name',
      'leadId.businessName': 'leadId.businessName',
      totalAmount: 'totalAmount',
      paymentType: 'paymentType',
      contractTerm: 'contractTerm',
      paymentMethod: 'paymentMethod',
      status: 'status',
      paymentDate: 'paymentDate',
      createdAt: 'createdAt',
    };

    const sort = { [sortMapping[sortField] || 'createdAt']: sortOrder };

    const sales = await Sale.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('leadId', 'name businessName email phoneNumber')
      .populate('notes.createdBy', 'name email')
      .populate('createdBy', 'name')
      .lean();

    const totalSales = await Sale.countDocuments(query);

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
    console.error('Error fetching user sales:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};