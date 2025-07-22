import express from 'express';
import { signup, login,logout, createLead } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/check-auth', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    isAuthenticated: true,
    user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
});

router.post('/signup', signup);
router.post('/login', login);
router.post('/createleads', authMiddleware, createLead);
router.post('/logout', authMiddleware, logout);

export default router;