import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

//routes
import userRoutes from './routes/userRoutes.js'
import leadRoutes from './routes/leadRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
const app = express();
dotenv.config();
const FRONTEND_URL = 'http://localhost:5173';
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
  }));

// Middleware to parse JSON and cookies
app.use(express.json());
app.use(cookieParser());

//routes
app.use('/Auth', userRoutes);
app.use('/Lead',leadRoutes);
app.use('/Sale', saleRoutes);

const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('Error occurred', err));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
  