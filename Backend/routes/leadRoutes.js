import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {createLead, getLeads, getLeadById, updateNotes, editLead, updateDates, editStatus ,getLeadsForDownload } from '../controllers/leadController.js';

const router = express.Router();

// Lead Routes
router.post('/createlead',authMiddleware,createLead)
router.get('/leads', authMiddleware, getLeads);
router.get('/getleadbyid/:id', authMiddleware, getLeadById);
router.put('/updateNotes/:id', authMiddleware, updateNotes);
router.put('/editlead/:id', authMiddleware, editLead);
router.put('/updateDates/:id', authMiddleware, updateDates);
router.put('/editstatus/:id', authMiddleware, editStatus);
router.get('/leads-download', authMiddleware, getLeadsForDownload);

export default router;