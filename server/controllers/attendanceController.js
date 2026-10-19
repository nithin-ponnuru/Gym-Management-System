const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const MemberMembership = require('../models/MemberMembership');

function toUTCMidnight(dateStr) {
  if (!dateStr) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  return new Date(Date.UTC(year, month - 1, day));
}

// @desc Get attendance records
// @route GET /api/attendance
const getAttendance = async (req, res, next) => {
  try {
    const { date, memberId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (date) {
      const dayStart = toUTCMidnight(date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      query.date = { $gte: dayStart, $lt: dayEnd };
    } else if (startDate && endDate) {
      query.date = {
        $gte: toUTCMidnight(startDate),
        $lte: new Date(toUTCMidnight(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    }

    if (memberId) query.memberId = memberId;
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('memberId', 'name memberId email')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Attendance.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: attendance,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Mark attendance
// @route POST /api/attendance
const markAttendance = async (req, res, next) => {
  try {
    const { memberId, date, checkInTime, checkOutTime, status } = req.body;

    // Members can only mark for themselves
    let targetMemberId = memberId;
    if (req.user && req.user.role === 'member') {
      targetMemberId = req.user.id;
    }

    if (!targetMemberId) {
      res.status(400);
      throw new Error('Member is required');
    }

    const member = await Member.findById(targetMemberId);
    if (!member) {
      res.status(404);
      throw new Error('Member not found');
    }

    // Membership check for members (admins bypass this check)
    if (req.user && req.user.role === 'member') {
      // Auto-expire stale memberships
      await MemberMembership.updateMany(
        { memberId: targetMemberId, status: 'Active', expiryDate: { $lt: new Date() } },
        { $set: { status: 'Expired' } }
      );
      const activeMembership = await MemberMembership.findOne({
        memberId: targetMemberId,
        status: 'Active',
      });
      if (!activeMembership) {
        return res.status(403).json({
          success: false,
          message: 'You need an active membership to mark attendance. Please contact the gym admin.',
          requiresMembership: true,
        });
      }
    }

    const attendanceDate = toUTCMidnight(date);

    const existing = await Attendance.findOne({ memberId: targetMemberId, date: attendanceDate });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this member on this date',
      });
    }

    const now = new Date();
    const timeStr = checkInTime ||
      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const attendance = await Attendance.create({
      memberId: targetMemberId,
      date: attendanceDate,
      checkInTime: timeStr,
      checkOutTime: checkOutTime || null,
      status: status || 'Present',
    });

    await attendance.populate('memberId', 'name memberId email');
    res.status(201).json({ success: true, message: 'Attendance marked successfully', data: attendance });
  } catch (error) {
    next(error);
  }
};

// @desc Update attendance
// @route PUT /api/attendance/:id
const updateAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate('memberId', 'name memberId email');
    if (!attendance) {
      res.status(404);
      throw new Error('Attendance record not found');
    }
    res.json({ success: true, message: 'Attendance updated', data: attendance });
  } catch (error) {
    next(error);
  }
};

// @desc Delete attendance
// @route DELETE /api/attendance/:id
const deleteAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      res.status(404);
      throw new Error('Attendance record not found');
    }
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAttendance, markAttendance, updateAttendance, deleteAttendance };
