import mongoose from 'mongoose';
import Lead from "../Models/Lead.js";

export const getLeads = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const leads = await Lead.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      const totalLeads = await Lead.countDocuments(); 
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
      const lead = await Lead.findById(req.params.id).populate('notes.createdBy', 'name email');
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
      const { id } = req.params; // Lead ID
      const userId = req.user.id; // From authMiddleware
  
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, message: 'Note text is required' });
      }
  
      const lead = await Lead.findById(id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
  
      // Add new note with user ID
      lead.notes.push({
        text: text.trim(),
        createdAt: new Date(),
        createdBy: userId,
      });
  
      await lead.save();
  
      res.status(200).json({ success: true, message: 'Note added successfully', lead });
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
  
      // Validate input
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid lead ID' });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      // Allow partial updates, but ensure at least one field is provided
      const updates = { name, email, phoneNumber, businessName, businessAddress };
      const providedFields = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined && value !== '')
      );
      if (Object.keys(providedFields).length === 0) {
        return res.status(400).json({ success: false, message: 'At least one field must be provided for update' });
      }
  
      // Find the lead
      const lead = await Lead.findById(id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
  
      // Track changes
      const changes = [];
      for (const [field, newValue] of Object.entries(providedFields)) {
        const oldValue = lead[field];
        if (oldValue !== newValue && newValue !== undefined) {
          changes.push(`${field} from "${oldValue || 'N/A'}" to "${newValue}"`);
          lead[field] = newValue;
        }
      }
  
      // Add a note if changes were made
      if (changes.length > 0) {
        const noteText = `Edited lead: ${changes.join(', ')}`;
        lead.notes.push({
          text: noteText,
          createdAt: new Date(),
          createdBy: userId,
        });
      }
  
      // Save the updated lead
      try {
        await lead.save();
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        throw error;
      }
  
      // Populate createdBy for all notes in the response
      const updatedLead = await Lead.findById(id).populate('notes.createdBy', 'name email');
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
  
      const updatedLead = await Lead.findById(id).populate('notes.createdBy', 'name email');
      res.status(200).json({ success: true, data: updatedLead });
    } catch (error) {
      console.error('Error updating dates:', error.message);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };