import mongoose from 'mongoose';

// Counter schema for auto-incrementing sale_id (can be shared with Lead.js if in same file)
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// Sale schema with sale_id field
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
    required: true,
  },
  exp: {
    type: String,
    required: true,
  },
  cvv: {
    type: String,
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
    card: { type: String },
    exp: { type: String },
    cvv: { type: String },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to auto-increment sale_id
saleSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'sale_id' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.sale_id = counter.sequence_value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Sale = mongoose.model('Sale', saleSchema);
export { Sale, Counter }; // Export both Sale and Counter models
