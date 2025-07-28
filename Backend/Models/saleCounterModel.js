import mongoose from 'mongoose';

const saleCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

const SaleCounter = mongoose.model('SaleCounter', saleCounterSchema);
export default SaleCounter;