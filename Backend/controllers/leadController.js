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
    console.log("controller working")
    try {
      const lead = await Lead.findById(req.params.id).lean();
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      res.status(200).json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ success: false, message: 'Server error' });
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