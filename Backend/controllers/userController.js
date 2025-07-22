import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../Models/User.js';
import Lead from '../Models/Lead.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'sales'
    });
    await user.save();
    res.status(201).json({ message: 'User created successfully', user: { name, email, role } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password if hidden in schema
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    // Send response
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
    // Clear the authToken cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const { name, email, phoneNumber, businessName, businessAddress, notes, disposition } = req.body;
    if (!name || !email || !phoneNumber || !businessName || !businessAddress) {
      return res.status(400).json({ message: 'All required fields are required' });
    }
    const existingLead = await Lead.findOne({ email });
    if (existingLead) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new lead
    const lead = new Lead({
      name,
      email,
      phoneNumber,
      businessName,
      businessAddress,
      notes: notes || '',
      disposition: disposition || 'Follow up', // Default value from model
    });

    await lead.save();

    res.status(201).json({ 
      message: 'Lead created successfully', 
      lead: { 
        name, 
        email, 
        phoneNumber, 
        businessName, 
        businessAddress, 
        notes: notes || '', 
        disposition: disposition || 'Follow up' 
      }
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};