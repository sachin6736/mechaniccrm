import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {getAllSales,getSaleById,updateNotes,updateSale, } from '../controllers/saleController.js';

const router = express.Router();

// Sale Routes
router.get('/sales', authMiddleware, getAllSales);
router.get('/getsalebyid/:id',authMiddleware, getSaleById);
router.put('/updatenotes/:id', authMiddleware, updateNotes);
router.put('/updatesale/:id', authMiddleware, updateSale);


export default router;