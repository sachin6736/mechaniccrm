import mongoose from 'mongoose';
import Lead, { Counter } from "../Models/Lead.js";
import Sale from '../Models/Sale.js';
import SaleCounter from '../Models/saleCounterModel.js'

export const createLead = async (req, res) => {
  try {
    const { name, email, phoneNumber, businessName, businessAddress, notes, disposition } = req.body;
    const userId = req.user?.id;
    console.log("Userid", userId);

    // Validate required fields
    if (!name || !email || !phoneNumber || !businessName || !businessAddress) {
      return res.status(400).json({ success: false, message: 'All required fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Validate disposition
    if (disposition && !['Not Interested', 'Follow up', 'Sale'].includes(disposition)) {
      return res.status(400).json({ success: false, message: 'Invalid disposition value' });
    }

    // Validate userId
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Check for existing email
    const existingLead = await Lead.findOne({ email });
    if (existingLead) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Get and increment leadId
    const counter = await Counter.findOneAndUpdate(
      { _id: 'leadId' },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, returnDocument: 'after' }
    );
    const leadId = counter.sequence;

    // Prepare notes array
    const notesArray = [];
    // Add creation note
    notesArray.push({
      text: 'Lead created',
      createdAt: new Date(),
      createdBy: userId || null,
    });
    // Add optional user note
    if (notes && typeof notes === 'string' && notes.trim()) {
      notesArray.push({
        text: notes.trim(),
        createdAt: new Date(),
        createdBy: userId || null,
      });
    }

    // Create new lead with leadId and createdBy
    const lead = new Lead({
      leadId,
      name,
      email,
      phoneNumber,
      businessName,
      businessAddress,
      notes: notesArray,
      disposition: disposition || 'Follow up',
      importantDates: [],
      createdBy: userId || null,
    });

    await lead.save();

    // Populate notes.createdBy and createdBy for response
    const populatedLead = await Lead.findById(lead._id)
      .populate('notes.createdBy', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: populatedLead,
    });
  } catch (error) {
    console.error('Create lead error:', error);
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    if (error.code === 11000 && error.keyPattern?.leadId) {
      return res.status(400).json({ success: false, message: 'Lead ID conflict, please try again' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getLeads = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const disposition = req.query.disposition || '';
      const search = req.query.search || '';

      console.log('Fetching leads with params:', { page, limit, skip, sortField, sortOrder, disposition, search });

      // Build query
      const query = {};
      if (disposition) {
        query.disposition = disposition;
      }
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
        name: 'name',
        email: 'email',
        phoneNumber: 'phoneNumber',
        businessName: 'businessName',
        disposition: 'disposition',
        createdAt: 'createdAt',
      };

      const sort = { [sortMapping[sortField] || 'createdAt']: sortOrder };

      const leads = await Lead.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean();

      const totalLeads = await Lead.countDocuments(query);

      res.status(200).json({
        success: true,
        data: leads,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalLeads / limit),
          totalLeads,
          hasMore: skip + leads.length < totalLeads,
        },
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
};

export const getLeadById = async (req, res) => {
    console.log("Fetching lead with ID:", req.params.id);
    try {
      const lead = await Lead.findById(req.params.id)
        .populate('notes.createdBy', 'name email')
        .populate('createdBy', 'name email');
      console.log("Single lead", lead);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      res.status(200).json({ success: true, data: lead });
    } catch (error) {
      console.error('Error fetching lead:', error.message);
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

      const lead = await Lead.findById(id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      lead.notes.push({
        text: text.trim(),
        createdAt: new Date(),
        createdBy: userId,
      });

      const updatedLead = await lead.save();

      const populatedLead = await Lead.findById(id)
        .populate('notes.createdBy', 'name email')
        .populate('createdBy', 'name email');

      res.status(200).json({ success: true, message: 'Note added successfully', data: populatedLead });
    } catch (error) {
      console.error('Error adding note:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const editLead = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phoneNumber, businessName, businessAddress } = req.body;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid lead ID' });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      const updates = { name, email, phoneNumber, businessName, businessAddress };
      const providedFields = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined && value !== '')
      );
      if (Object.keys(providedFields).length === 0) {
        return res.status(400).json({ success: false, message: 'At least one field must be provided for update' });
      }

      const lead = await Lead.findById(id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      const leadChanges = [];
      for (const [field, newValue] of Object.entries(providedFields)) {
        const oldValue = lead[field];
        if (oldValue !== newValue && newValue !== undefined) {
          leadChanges.push(`${field} from "${oldValue || 'N/A'}" to "${newValue}"`);
          lead[field] = newValue;
        }
      }

      if (leadChanges.length > 0) {
        const noteText = `Edited lead: ${leadChanges.join(', ')}`;
        lead.notes.push({
          text: noteText,
          createdAt: new Date(),
          createdBy: userId,
        });
      }

      try {
        await lead.save();
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        throw error;
      }

      const sale = await Sale.findOne({ leadId: id });
      if (sale) {
        const saleChanges = [];
        for (const [field, newValue] of Object.entries(providedFields)) {
          const oldValue = sale[field];
          if (oldValue !== newValue && newValue !== undefined) {
            saleChanges.push(`${field} from "${oldValue || 'N/A'}" to "${newValue}"`);
            sale[field] = newValue;
            if (field === 'businessAddress') {
              sale.billingAddress = newValue;
              saleChanges.push(`billingAddress from "${oldValue || 'N/A'}" to "${newValue}"`);
            }
          }
        }

        if (saleChanges.length > 0) {
          sale.notes.push({
            text: `Updated sale details due to lead edit: ${saleChanges.join(', ')}`,
            createdAt: new Date(),
            createdBy: userId,
          });
          await sale.save();
        }
      }

      const updatedLead = await Lead.findById(id)
        .populate('notes.createdBy', 'name email')
        .populate('createdBy', 'name email');
      res.status(200).json({ success: true, data: updatedLead });
    } catch (error) {
      console.error('Error updating lead:', error.message);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const updateDates = async (req, res) => {
    try {
      const { id } = req.params;
      const { importantDates, noteText } = req.body;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid lead ID' });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      if (!Array.isArray(importantDates)) {
        return res.status(400).json({ success: false, message: 'importantDates must be an array' });
      }
      if (!noteText || !noteText.trim()) {
        return res.status(400).json({ success: false, message: 'Note text is required' });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const invalidDates = importantDates.filter(date => !dateRegex.test(date));
      if (invalidDates.length > 0) {
        return res.status(400).json({ success: false, message: 'Invalid date format in importantDates' });
      }

      const lead = await Lead.findById(id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      lead.importantDates = importantDates;
      lead.notes.push({
        text: noteText.trim(),
        createdAt: new Date(),
        createdBy: userId,
      });

      await lead.save();

      const updatedLead = await Lead.findById(id)
        .populate('notes.createdBy', 'name email')
        .populate('createdBy', 'name email');
      res.status(200).json({ success: true, data: updatedLead });
    } catch (error) {
      console.error('Error updating dates:', error.message);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const editStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('leadId from params:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lead ID format' });
    }

    const { disposition } = req.body;

    const validDispositions = ['Not Interested', 'Follow up', 'Sale'];
    if (!validDispositions.includes(disposition)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (lead.disposition === disposition) {
      return res.status(400).json({ success: false, message: `Status is already set to ${disposition}` });
    }

    const noteText = `Changed status from "${lead.disposition || 'None'}" to "${disposition}"`;
    const leadNote = {
      text: noteText,
      createdAt: new Date(),
      createdBy: req.user ? req.user.id : null,
    };

    lead.disposition = disposition;
    lead.notes.push(leadNote);

    if (disposition === 'Sale') {
      const existingSale = await Sale.findOne({ leadId: lead._id });
      if (existingSale) {
        lead.notes.push({
          text: `Lead status changed to "Sale". Existing sale found (Sale ID: ${existingSale._id}, saleId: ${existingSale.saleId}).`,
          createdAt: new Date(),
          createdBy: req.user ? req.user.id : null,
        });
        console.log('Existing sale found for leadId:', lead._id, 'Sale ID:', existingSale._id, 'saleId:', existingSale.saleId);
      } else {
        const counter = await SaleCounter.findOneAndUpdate(
          { _id: 'saleId' },
          { $inc: { sequence: 1 } },
          { new: true, upsert: true }
        );
        const saleId = counter.sequence;

        const sale = new Sale({
          saleId,
          leadId: lead._id,
          name: lead.name,
          email: lead.email,
          phoneNumber: lead.phoneNumber,
          businessName: lead.businessName,
          businessAddress: lead.businessAddress,
          billingAddress: lead.businessAddress,
          card: '****',
          exp: 'MM/YY',
          cvv: '***',
          totalAmount: 0,
          paymentType: null,
          contractTerm: null,
          paymentMethod: null,
          status: 'Pending',
          paymentDate: null,
          createdBy: req.user ? req.user.id : null, // Set createdBy
          notes: [{
            text: `Draft sale created with saleId ${saleId} by changing lead status to "Sale". Payment details pending.`,
            createdAt: new Date(),
            createdBy: req.user ? req.user.id : null,
          }],
        });
        await sale.save();
        lead.notes.push({
          text: `Draft sale created (Sale ID: ${sale._id}, saleId: ${sale.saleId}).`,
          createdAt: new Date(),
          createdBy: req.user ? req.user.id : null,
        });
        console.log('Draft sale created for leadId:', lead._id, 'Sale ID:', sale._id, 'saleId:', sale.saleId);
      }
    }

    await lead.save();

    const updatedLead = await Lead.findById(id)
      .populate('notes.createdBy', 'name')
      .populate('createdBy', 'name email');
    res.status(200).json({ success: true, data: updatedLead });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getLeadsForDownload = async (req, res) => {
  try {
    const leads = await Lead.find({})
      .populate('notes.createdBy', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error('Error fetching leads for download:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};