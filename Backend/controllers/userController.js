import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../Models/User.js';
import mongoose from 'mongoose';
import Lead, { Counter } from '../Models/Lead.js';

export const createUser = async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create users' });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!['admin', 'sales'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be admin or sales' });
    }

    const nameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ success: false, message: 'Invalid name format. Use 3-30 characters (letters, numbers, or underscores)' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Name already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can view users' });
    }

    const users = await User.find().select('name email role').lean();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ success: false, message: 'Name and password are required' });
    }
    const user = await User.findOne({ name }).select('+password'); // Explicitly select password if hidden in schema
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid name or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid name or password' });
    }
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 12 * 60 * 60 * 1000 , 
    });
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Same as login
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Match login settings
      path: '/', // Ensure the path matches the cookie's creation
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('name email').lean();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};