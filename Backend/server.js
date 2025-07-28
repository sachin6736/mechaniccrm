import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/userRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import saleRoutes from './routes/saleRoutes.js';

dotenv.config();
const app = express();

const allowedOrigins = (process.env.FRONTEND_URLS || '').split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    console.log('🛰️ Incoming origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// routes
app.use('/Auth', userRoutes);
app.use('/Lead', leadRoutes);
app.use('/Sale', saleRoutes);

const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Mongo error', err));

// (optional) simple health check
app.get('/health', (_, res) => res.send('ok'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
