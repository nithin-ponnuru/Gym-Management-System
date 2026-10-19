const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');
const { createNotification } = require('../utils/notificationHelper');

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'gym_secret_key_change_this', { expiresIn: '7d' });

// @desc  Login — admin or member
// @route POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // ── ADMIN CHECK ──────────────────────────────────────────────────────────────
  const adminEmails = (process.env.ADMIN_EMAILS || 'admin@gymfit.com')
    .split(',')
    .map(e => e.trim().toLowerCase());

  if (adminEmails.includes(email.trim().toLowerCase())) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    if (password !== adminPassword) {
      return res.status(401).json({ success: false, message: 'Incorrect admin password' });
    }
    const token = generateToken({ role: 'admin', email: email.trim().toLowerCase() });
    return res.json({
      success: true,
      data: {
        token,
        role: 'admin',
        user: { name: 'Admin', email: email.trim().toLowerCase(), role: 'admin' },
      },
    });
  }

  // ── MEMBER CHECK ─────────────────────────────────────────────────────────────
  const member = await Member.findOne({ email: email.trim().toLowerCase() })
    .populate('trainerId', 'name specialization phone');

  if (!member) {
    return res.status(401).json({ success: false, message: 'No account found with this email' });
  }

  // Default password = phone number; if member has a hashed password, compare with bcrypt
  let passwordValid = false;
  if (member.password) {
    passwordValid = await bcrypt.compare(password, member.password);
  } else {
    // No password set yet → default is phone number
    passwordValid = password === member.phone;
  }

  if (!passwordValid) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect password. Your default password is your phone number.',
    });
  }

  if (member.status === 'Inactive') {
    return res.status(403).json({
      success: false,
      message: 'Your membership is inactive. Please contact the gym admin.',
    });
  }

  const token = generateToken({ role: 'member', id: member._id, email: member.email });
  return res.json({
    success: true,
    data: {
      token,
      role: 'member',
      user: {
        _id: member._id,
        name: member.name,
        email: member.email,
        memberId: member.memberId,
        phone: member.phone,
        age: member.age,
        gender: member.gender,
        address: member.address,
        status: member.status,
        joinDate: member.joinDate,
        trainerId: member.trainerId,
        role: 'member',
      },
    },
  });
};

// @desc  Get current logged-in user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({
      success: true,
      data: { name: 'Admin', email: req.user.email, role: 'admin' },
    });
  }

  const member = await Member.findById(req.user.id)
    .populate('trainerId', 'name specialization phone email');

  if (!member) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  return res.json({
    success: true,
    data: {
      _id: member._id,
      name: member.name,
      email: member.email,
      memberId: member.memberId,
      phone: member.phone,
      age: member.age,
      gender: member.gender,
      address: member.address,
      status: member.status,
      joinDate: member.joinDate,
      trainerId: member.trainerId,
      role: 'member',
    },
  });
};

// @desc  Member self-registration
// @route POST /api/auth/signup
const signup = async (req, res) => {
  const { name, email, phone, age, gender, address } = req.body;

  // Basic validation
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Full name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
  if (!phone || phone.trim().length < 7) errors.push('Valid phone number is required');
  if (age && (isNaN(age) || Number(age) < 5 || Number(age) > 120)) errors.push('Age must be between 5 and 120');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  // Check duplicate email
  const existing = await Member.findOne({ email: email.trim().toLowerCase() });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists. Please log in instead.',
    });
  }

  // Create the member (same as admin creating one — auto-generates memberId)
  const member = await Member.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    age: age ? Number(age) : undefined,
    gender: gender || 'Male',
    address: address?.trim() || '',
    status: 'Active',
    joinDate: new Date(),
  });

  await member.populate('trainerId', 'name specialization phone');

  // Notify admin of new self-registration
  createNotification({
    type: 'NEW_MEMBER',
    title: 'New Member Registration',
    message: `${member.name} (${member.memberId}) just registered. Email: ${member.email}`,
    link: '/members',
    refId: member._id,
    refModel: 'Member',
    priority: 'medium',
    meta: { memberName: member.name, memberId: member.memberId, email: member.email },
  });

  // Auto-login after signup
  const token = generateToken({ role: 'member', id: member._id, email: member.email });

  return res.status(201).json({
    success: true,
    message: `Welcome to FitPro, ${member.name}! Your Member ID is ${member.memberId}. Your password is your phone number.`,
    data: {
      token,
      role: 'member',
      user: {
        _id: member._id,
        name: member.name,
        email: member.email,
        memberId: member.memberId,
        phone: member.phone,
        age: member.age,
        gender: member.gender,
        address: member.address,
        status: member.status,
        joinDate: member.joinDate,
        trainerId: member.trainerId,
        role: 'member',
      },
    },
  });
};

module.exports = { login, getMe, signup };
