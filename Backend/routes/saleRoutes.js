import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllSales, getSaleById, getSaleByLead, updateSale, updateNotes } from '../controllers/saleController.js';

const router = express.Router();

// Sale Routes
router.get('/sales', authMiddleware, getAllSales);
router.get('/getsalebyid/:id', authMiddleware, getSaleById);
router.get('/getsalebylead/:leadId', authMiddleware, getSaleByLead);
router.put('/updatesale/:leadId', authMiddleware, updateSale);
router.put('/updatenotes/:id', authMiddleware, updateNotes);

export default router;