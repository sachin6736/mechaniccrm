import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllSales, getSaleById, updateNotes, updateSale, getCompletedSales, getDueSales } from '../controllers/saleController.js';

const router = express.Router();

// Sale Routes
router.get('/sales', authMiddleware, getAllSales);
router.get('/completedsales', authMiddleware, getCompletedSales);
router.get('/due-sales', authMiddleware, getDueSales);
router.get('/getsalebyid/:id', authMiddleware, getSaleById);
router.put('/updatenotes/:id', authMiddleware, updateNotes);
router.put('/updatesale/:id', authMiddleware, updateSale);

export default router;