import mongoose from 'mongoose';
import Sale from '../Models/Sale.js'; // Adjust path to your Sale model
import Lead from '../Models/Lead.js'; // Adjust path to your Lead model

mongoose
  .connect(
    'mongodb+srv://sachinpradeepan27:d1HduFIZKJgKSkpQ@newcrm.ex72imw.mongodb.net/?retryWrites=true&w=majority&appName=newcrm',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    try {
      const sales = await Sale.find().populate('leadId');
      const updatePromises = sales.map(async (sale) => {
        const lead = sale.leadId;
        if (!lead) {
          console.warn(`⚠️ Sale ${sale._id} has no associated lead. Skipping.`);
          return;
        }

        const updateData = {
          name: lead.name || 'Unknown',
          email: lead.email || '',
          phoneNumber: lead.phoneNumber || '',
          businessName: lead.businessName || '',
          businessAddress: lead.businessAddress || '',
          billingAddress: sale.billingAddress || lead.businessAddress || '',
          card: sale.card || '****',
          exp: sale.exp || 'MM/YY',
          cvv: sale.cvv || '***',
          totalAmount: sale.totalAmount || sale.amount || 0, // Migrate amount to totalAmount
          paymentType: sale.paymentType === 'One-time' || sale.paymentType === 'Recurring' ? sale.paymentType : null,
          contractTerm: sale.contractTerm || null,
          paymentMethod: sale.paymentMethod === 'Credit Card' || sale.paymentMethod === 'Bank Transfer' || sale.paymentMethod === 'PayPal' || sale.paymentMethod === 'Other' ? sale.paymentMethod : null,
          paymentDate: sale.status === 'Pending' && (sale.totalAmount === 0 || sale.amount === 0) ? null : sale.paymentDate || null,
          $unset: sale.amount ? { amount: '' } : {}, // Remove old amount field if it exists
        };

        return Sale.updateOne(
          { _id: sale._id },
          { $set: updateData, $unset: updateData.$unset }
        );
      });

      const results = await Promise.all(updatePromises);
      const modifiedCount = results.reduce((sum, result) => sum + (result.modifiedCount || 0), 0);
      console.log(`✅ Updated ${modifiedCount} sales with new schema fields.`);

      const malformedSales = await Sale.find({
        $or: [
          { name: { $exists: false } },
          { email: { $exists: false } },
          { phoneNumber: { $exists: false } },
          { businessName: { $exists: false } },
          { businessAddress: { $exists: false } },
          { billingAddress: { $exists: false } },
          { card: { $exists: false } },
          { exp: { $exists: false } },
          { cvv: { $exists: false } },
          { totalAmount: { $exists: false } },
        ],
      });

      if (malformedSales.length > 0) {
        console.warn(`⚠️ Found ${malformedSales.length} sales with missing required fields. Manual review required.`);
        console.log(malformedSales.map((sale) => sale._id));
      } else {
        console.log('✅ All sales are in the correct format.');
      }

      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (err) {
      console.error('❌ Error during migration:', err);
      await mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err);
  });