import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getLeads ,getLeadById,updateNotes,editLead,updateDates} from '../controllers/leadController.js';

const router = express.Router();


router.get('/leads',authMiddleware,getLeads);
router.get('/getleadbyid/:id',authMiddleware ,getLeadById);
router.put('/updateNotes/:id', authMiddleware, updateNotes);
router.put('/editlead/:id', authMiddleware, editLead);
router.put('/updateDates/:id', authMiddleware, updateDates);


export default router;