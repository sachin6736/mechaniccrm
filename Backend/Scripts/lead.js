import mongoose from 'mongoose';
import Sale from '../Models/Sale.js'; // Adjust path to your Sale model
import Lead from '../Models/Lead.js'; // Adjust path to your Lead model

const migrateCardDetails = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://sachinpradeepan27:d1HduFIZKJgKSkpQ@newcrm.ex72imw.mongodb.net/?retryWrites=true&w=majority&appName=newcrm',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Connected to MongoDB');

    // Update top-level card, exp, and cvv for non-Credit Card payment methods
    const topLevelResult = await Sale.updateMany(
      { paymentMethod: { $ne: 'Credit Card' } },
      { $set: { card: null, exp: null, cvv: null } }
    );

    console.log(`Updated ${topLevelResult.modifiedCount} sales with non-Credit Card payment methods at top level`);

    // Update previousContracts array for non-Credit Card payment methods
    const previousContractsResult = await Sale.updateMany(
      { 'previousContracts.paymentMethod': { $ne: 'Credit Card' } },
      { $set: { 'previousContracts.$[elem].card': null, 'previousContracts.$[elem].exp': null, 'previousContracts.$[elem].cvv': null } },
      { arrayFilters: [{ 'elem.paymentMethod': { $ne: 'Credit Card' } }] }
    );

    console.log(`Updated ${previousContractsResult.modifiedCount} sales with non-Credit Card payment methods in previousContracts`);

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateCardDetails();