import mongoose from 'mongoose';
import { Lead, Counter } from '../Models/Lead.js'; // Adjust path to your Lead model, ensure both Lead and Counter are exported

const migrateLeads = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://sachinpradeepan27:d1HduFIZKJgKSkpQ@newcrm.ex72imw.mongodb.net/?retryWrites=true&w=majority&appName=newcrm'
    );
    console.log('Connected to MongoDB');

    // Fetch all leads without a lead_id
    const leads = await Lead.find({ lead_id: { $exists: false } }).sort({ createdAt: 1 });
    console.log(`Found ${leads.length} leads without lead_id`);

    let currentSequence = 0;

    // Get the current sequence value from the Counter collection
    const counter = await Counter.findOne({ _id: 'lead_id' });
    if (counter) {
      currentSequence = counter.sequence_value;
    }

    // Update each lead with an incremental lead_id
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      currentSequence += 1;
      await Lead.updateOne(
        { _id: lead._id },
        { $set: { lead_id: currentSequence } }
      );
    }

    // Update or create the Counter document with the highest lead_id
    await Counter.updateOne(
      { _id: 'lead_id' },
      { $set: { sequence_value: currentSequence } },
      { upsert: true }
    );

    console.log(`Assigned lead_id to ${leads.length} leads. Highest lead_id: ${currentSequence}`);

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateLeads();