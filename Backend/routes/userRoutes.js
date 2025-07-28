import express from 'express';
import { login, logout, createUser, getUsers } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/check-auth', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    isAuthenticated: true,
    user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
});

router.post('/create-user', authMiddleware, createUser);
router.get('/users', authMiddleware, getUsers);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);

export default router;