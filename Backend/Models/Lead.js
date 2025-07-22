import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
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

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;