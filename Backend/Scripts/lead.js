import mongoose from 'mongoose';
import Sale from '../Models/Sale.js'; // Adjust path to your Sale model
import Lead from '../Models/Lead.js'; // Adjust path to your Lead model

const migrateSales = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://sachinpradeepan27:d1HduFIZKJgKSkpQ@newcrm.ex72imw.mongodb.net/?retryWrites=true&w=majority&appName=newcrm',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Connected to MongoDB');

    const result = await Sale.updateMany(
      { status: { $in: ['Verifying', 'PartPayment'] } },
      { $set: { status: 'Pending' } }
    );

    console.log(`Updated ${result.modifiedCount} sales with status Verifying or PartPayment to Pending`);

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateSales();