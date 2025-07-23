import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  businessName: {
    type: String,
    required: true,
  },
  businessAddress: {
    type: String,
    required: true,
  },
  billingAddress: {
    type: String,
    required: true,
  },
  card: {
    type: String, // Store last 4 digits or tokenized card info for security
    required: true,
  },
  exp: {
    type: String, // Format: MM/YY
    required: true,
  },
  cvv: {
    type: String, // Store securely or avoid storing sensitive data
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  paymentType: {
    type: String,
    enum: ['Recurring', 'One-time', null],
    required: false,
    default: null,
  },
  contractTerm: {
    type: String,
    required: false,
    default: null,
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Bank Transfer', 'PayPal', 'Other', null],
    required: false,
    default: null,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending',
  },
  paymentDate: {
    type: Date,
    required: false,
    default: null, // Set to null for draft sales
  },
  partialPayments: [{
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  }],
  notes: [{
    text: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;