import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllSales, getSaleById, updateNotes, updateSale, getCompletedSales, getDueSales, getUserSales } from '../controllers/saleController.js';

const router = express.Router();

// Sale Routes
router.get('/sales', authMiddleware, getAllSales);
router.get('/completedsales', authMiddleware, getCompletedSales);
router.get('/due-sales', authMiddleware, getDueSales);
router.get('/getsalebyid/:id', authMiddleware, getSaleById);
router.put('/updatenotes/:id', authMiddleware, updateNotes);
router.put('/updatesale/:id', authMiddleware, updateSale);
router.get('/user-sales', authMiddleware, getUserSales); // New route for user-specific sales

export default router;