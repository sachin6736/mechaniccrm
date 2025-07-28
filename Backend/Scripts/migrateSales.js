import mongoose from 'mongoose';
import { Sale, Counter } from '../Models/Sale.js'; // Adjust path to your Sale model, ensure both Sale and Counter are exported

const migrateSales = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://sachinpradeepan27:d1HduFIZKJgKSkpQ@newcrm.ex72imw.mongodb.net/?retryWrites=true&w=majority&appName=newcrm'
    );
    console.log('Connected to MongoDB');

    // Fetch all sales without a sale_id
    const sales = await Sale.find({ sale_id: { $exists: false } }).sort({ createdAt: 1 });
    console.log(`Found ${sales.length} sales without sale_id`);

    let currentSequence = 0;

    // Get the current sequence value from the Counter collection
    const counter = await Counter.findOne({ _id: 'sale_id' });
    if (counter) {
      currentSequence = counter.sequence_value;
    }

    // Update each sale with an incremental sale_id
    for (let i = 0; i < sales.length; i++) {
      const sale = sales[i];
      currentSequence += 1;
      await Sale.updateOne(
        { _id: sale._id },
        { $set: { sale_id: currentSequence } }
      );
    }

    // Update or create the Counter document with the highest sale_id
    await Counter.updateOne(
      { _id: 'sale_id' },
      { $set: { sequence_value: currentSequence } },
      { upsert: true }
    );

    console.log(`Assigned sale_id to ${sales.length} sales. Highest sale_id: ${currentSequence}`);

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateSales();