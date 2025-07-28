import mongoose from 'mongoose';

// Counter schema for auto-incrementing lead_id
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// Lead schema with lead_id field
const leadSchema = new mongoose.Schema({
  lead_id: { type: Number, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  businessName: { type: String, required: true },
  businessAddress: { type: String, required: true },
  notes: [{
    text: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  }],
  disposition: {
    type: String,
    enum: ['Not Interested', 'Follow up', 'Sale'],
    default: 'Follow up',
  },
  importantDates: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

// Pre-save middleware to auto-increment lead_id
leadSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'lead_id' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.lead_id = counter.sequence_value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Lead = mongoose.model('Lead', leadSchema);

export { Lead, Counter }; // Export both models