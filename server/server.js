require('dotenv').config();
require('express-async-errors');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { protect, adminOnly } = require('./middleware/authMiddleware');
const { setIO, addAdminSocket, removeAdminSocket } = require('./utils/socketManager');
const { startExpiryCheckCron } = require('./utils/expiryCheckCron');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const memberMembershipRoutes = require('./routes/memberMembershipRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const membershipRequestRoutes = require('./routes/membershipRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

connectDB();
const app = express();
const httpServer = http.createServer(app);

// ── Socket.IO Setup ───────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Register io in the singleton so controllers can emit without circular imports
setIO(io);

// Authenticate Socket.IO connections via JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gym_secret_key_change_this');
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const { role, email } = socket.user || {};
  if (role === 'admin') {
    socket.join('admin');
    addAdminSocket(socket.id);
    console.log(`[Socket] Admin connected to room 'admin': ${email} (${socket.id})`);

    socket.on('disconnect', () => {
      removeAdminSocket(socket.id);
      console.log(`[Socket] Admin disconnected: ${email} (${socket.id})`);
    });
  }
});

// ── Express Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── PUBLIC ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ success: true, message: 'API running', timestamp: new Date() }));
app.use('/api/auth', authRoutes);

// ── AUTHENTICATED (any role) ──────────────────────────────────────────────────
app.use('/api/memberships', protect, membershipRoutes);
app.use('/api/member-memberships', protect, memberMembershipRoutes);
app.use('/api/membership-requests', protect, membershipRequestRoutes);
app.use('/api/attendance', protect, attendanceRoutes);
app.use('/api/ai', protect, aiRoutes);

// ── ADMIN-ONLY ────────────────────────────────────────────────────────────────
app.use('/api/members', protect, adminOnly, memberRoutes);
app.use('/api/trainers', protect, adminOnly, trainerRoutes);
app.use('/api/workouts', protect, adminOnly, workoutRoutes);
app.use('/api/dashboard', protect, adminOnly, dashboardRoutes);
app.use('/api/notifications', protect, adminOnly, notificationRoutes);

// ── MEMBER SELF-DATA ROUTES ───────────────────────────────────────────────────
app.get('/api/member-data/profile', protect, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ success: false, message: 'Admin should use /api/members' });
  const Member = require('./models/Member');
  const member = await Member.findById(req.user.id).populate('trainerId', 'name specialization phone email');
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  res.json({ success: true, data: member });
});

app.put('/api/member-data/profile', protect, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ success: false, message: 'Admins use /api/members' });
  const Member = require('./models/Member');
  const allowed = ['address', 'phone', 'age', 'gender'];
  const update = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
  const member = await Member.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true })
    .populate('trainerId', 'name specialization phone email');
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  res.json({ success: true, message: 'Profile updated successfully', data: member });
});

app.get('/api/member-data/active-membership', protect, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ success: false, message: 'Use /api/member-memberships' });
  const MemberMembership = require('./models/MemberMembership');
  await MemberMembership.updateMany(
    { memberId: req.user.id, status: 'Active', expiryDate: { $lt: new Date() } },
    { $set: { status: 'Expired' } }
  );
  await MemberMembership.updateMany(
    { memberId: req.user.id, status: 'Upcoming', startDate: { $lte: new Date() }, paymentStatus: 'Paid' },
    { $set: { status: 'Active' } }
  );
  const active = await MemberMembership.findOne({
    memberId: req.user.id,
    status: { $in: ['Active', 'Upcoming', 'Pending Payment'] },
  })
    .populate('membershipId', 'planName durationMonths price features color description badge isPopular isBestValue discountPercent discountNote')
    .sort({ startDate: -1 });
  res.json({ success: true, data: active || null });
});

app.get('/api/member-data/membership-history', protect, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ success: false, message: 'Use /api/member-memberships' });
  const MemberMembership = require('./models/MemberMembership');
  const history = await MemberMembership.find({ memberId: req.user.id })
    .populate('membershipId', 'planName durationMonths price features color description badge')
    .sort({ startDate: -1 });
  res.json({ success: true, data: history });
});

app.get('/api/member-data/membership', protect, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ success: false, message: 'Use /api/member-memberships' });
  const MemberMembership = require('./models/MemberMembership');
  const memberships = await MemberMembership.find({ memberId: req.user.id })
    .populate('membershipId', 'planName durationMonths price features color description badge isPopular isBestValue')
    .sort({ startDate: -1 });
  res.json({ success: true, data: memberships });
});

app.get('/api/member-data/attendance', protect, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ success: false, message: 'Use /api/attendance' });
  const Attendance = require('./models/Attendance');
  const { page = 1, limit = 30 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const [records, total] = await Promise.all([
    Attendance.find({ memberId: req.user.id }).sort({ date: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Attendance.countDocuments({ memberId: req.user.id }),
  ]);
  res.json({ success: true, data: records, pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) } });
});

app.get('/api/member-data/workout', protect, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ success: false, message: 'Use /api/workouts' });
  const WorkoutPlan = require('./models/WorkoutPlan');
  const Member = require('./models/Member');
  const member = await Member.findById(req.user.id);
  const plan = await WorkoutPlan.findOne({ trainerId: member?.trainerId }).populate('trainerId', 'name specialization');
  res.json({ success: true, data: plan || null });
});

// ── 404 & Error ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO enabled on ws://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  // Start the daily expiry check cron job
  startExpiryCheckCron();
});

module.exports = app;
