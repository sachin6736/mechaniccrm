import mongoose from 'mongoose';

// Counter schema to manage auto-incrementing leadId
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// Lead schema with leadId and createdBy fields
const leadSchema = new mongoose.Schema({
  leadId: { type: Number, unique: true, required: true },
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
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
export { Counter };