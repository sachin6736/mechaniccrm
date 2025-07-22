import mongoose from 'mongoose';
import Lead from '../Models/Lead.js'; // Adjust path to your Lead model

// Connect to MongoDB
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
      // Update leads where notes is a string
      const stringNotesResult = await Lead.updateMany(
        { notes: { $type: 'string' } },
        [
          {
            $set: {
              notes: [
                {
                  text: '$notes',
                  createdAt: { $ifNull: ['$createdAt', new Date()] },
                  createdBy: null, // Set to null or a default user ID if available
                },
              ],
            },
          },
        ]
      );

      console.log(`✅ Updated ${stringNotesResult.modifiedCount} leads with string notes converted to array format.`);

      // Update leads where notes exist but lack createdBy
      const notesWithoutCreatedByResult = await Lead.updateMany(
        { 'notes.createdBy': { $exists: false } },
        [
          {
            $set: {
              notes: {
                $map: {
                  input: '$notes',
                  as: 'note',
                  in: {
                    text: '$$note.text',
                    createdAt: { $ifNull: ['$$note.createdAt', new Date()] },
                    createdBy: null, // Set to null or a default user ID if available
                  },
                },
              },
            },
          },
        ]
      );

      console.log(`✅ Added createdBy to ${notesWithoutCreatedByResult.modifiedCount} leads' notes.`);

      // Ensure importantDates exists as an array
      const importantDatesResult = await Lead.updateMany(
        { importantDates: { $exists: false } },
        { $set: { importantDates: [] } }
      );

      console.log(`✅ Ensured importantDates field for ${importantDatesResult.modifiedCount} leads.`);

      // Validate schema by checking for any malformed notes
      const malformedNotes = await Lead.find({
        $or: [
          { notes: { $not: { $type: 'array' } } },
          { 'notes.text': { $exists: false } },
        ],
      });

      if (malformedNotes.length > 0) {
        console.warn(`⚠️ Found ${malformedNotes.length} leads with malformed notes. Manual review required.`);
        console.log(malformedNotes.map((lead) => lead._id));
      } else {
        console.log('✅ All notes are in the correct format.');
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