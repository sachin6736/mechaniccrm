import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  saleId: {
    type: Number,
    unique: true,
    required: true,
  },
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
    type: String,
    required: false,
    default: null,
  },
  exp: {
    type: String,
    required: false,
    default: null,
  },
  cvv: {
    type: String,
    required: false,
    default: null,
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
    enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Part-Payment'],
    default: 'Pending',
  },
  paymentDate: {
    type: Date,
    required: false,
    default: null,
  },
  contractEndDate: {
    type: Date,
    required: false,
    default: null,
  },
  partialPayments: [{
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  }],
  previousContracts: [{
    totalAmount: { type: Number, required: true },
    paymentType: { type: String, enum: ['Recurring', 'One-time', null] },
    contractTerm: { type: String },
    paymentMethod: { type: String, enum: ['Credit Card', 'Bank Transfer', 'PayPal', 'Other', null] },
    card: { type: String, default: null },
    exp: { type: String, default: null },
    cvv: { type: String, default: null },
    paymentDate: { type: Date },
    contractEndDate: { type: Date },
    partialPayments: [{
      amount: { type: Number, required: true },
      paymentDate: { type: Date, required: true },
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    }],
    createdAt: { type: Date, default: Date.now },
  }],
  notes: [{
    text: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;