import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getLeads ,getLeadById,updateNotes} from '../controllers/leadController.js';

const router = express.Router();


router.get('/leads',authMiddleware,getLeads);
router.get('/getleadbyid/:id',authMiddleware ,getLeadById);
router.put('/updateNotes/:id', authMiddleware, updateNotes);


export default router;