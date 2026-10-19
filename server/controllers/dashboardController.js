const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const MemberMembership = require('../models/MemberMembership');
const Attendance = require('../models/Attendance');
const MembershipRequest = require('../models/MembershipRequest');

// @desc Get top-level dashboard stats
// @route GET /api/dashboard/stats
const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Auto-expire stale active memberships
    await MemberMembership.updateMany(
      { status: 'Active', expiryDate: { $lt: now } },
      { $set: { status: 'Expired' } }
    );

    const [
      totalMembers, activeMembers, totalTrainers,
      revenueResult, activeMemberships, expiringMemberships,
      expiringSoon, expiredMemberships, pendingRequests,
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: 'Active' }),
      Trainer.countDocuments({ status: 'Active' }),
      MemberMembership.aggregate([
        { $match: { paymentStatus: 'Paid', status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      MemberMembership.countDocuments({ status: 'Active' }),
      MemberMembership.countDocuments({
        status: 'Active',
        expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
      }),
      MemberMembership.countDocuments({
        status: 'Active',
        expiryDate: { $gte: now, $lte: sevenDaysFromNow },
      }),
      MemberMembership.countDocuments({ status: 'Expired' }),
      MembershipRequest.countDocuments({ status: 'Pending' }),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        inactiveMembers: totalMembers - activeMembers,
        totalTrainers,
        totalRevenue,
        activeMemberships,
        expiringMemberships,
        expiringSoon,
        expiredMemberships,
        pendingRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get revenue breakdown by membership plan
// @route GET /api/dashboard/revenue-by-plan
const getRevenueByPlan = async (req, res, next) => {
  try {
    const result = await MemberMembership.aggregate([
      { $match: { paymentStatus: 'Paid', status: { $ne: 'Cancelled' } } },
      {
        $lookup: {
          from: 'memberships',
          localField: 'membershipId',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$membershipId',
          planName: { $first: { $ifNull: ['$plan.planName', '$planSnapshot.planName'] } },
          totalRevenue: { $sum: '$amountPaid' },
          totalMembers: { $sum: 1 },
          avgAmount: { $avg: '$amountPaid' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc Get member count per trainer
// @route GET /api/dashboard/members-per-trainer
const getMembersPerTrainer = async (req, res, next) => {
  try {
    const result = await Member.aggregate([
      { $match: { trainerId: { $ne: null } } },
      { $group: { _id: '$trainerId', memberCount: { $sum: 1 } } },
      {
        $lookup: {
          from: 'trainers',
          localField: '_id',
          foreignField: '_id',
          as: 'trainer',
        },
      },
      { $unwind: '$trainer' },
      {
        $project: {
          trainerName: '$trainer.name',
          specialization: '$trainer.specialization',
          memberCount: 1,
          _id: 1,
        },
      },
      { $sort: { memberCount: -1 } },
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc Get monthly revenue for last 12 months
// @route GET /api/dashboard/monthly-revenue
const getMonthlyRevenue = async (req, res, next) => {
  try {
    const result = await MemberMembership.aggregate([
      { $match: { paymentStatus: 'Paid', status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: '%Y-%m',
              date: { $dateFromParts: { year: '$_id.year', month: '$_id.month', day: 1 } },
            },
          },
          revenue: 1,
          count: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
      { $limit: 12 },
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc Get daily attendance counts for the last 30 days
// @route GET /api/dashboard/daily-attendance
const getDailyAttendance = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Attendance.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo }, status: 'Present' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, present: { $sum: 1 } } },
      { $project: { date: '$_id', present: 1, _id: 0 } },
      { $sort: { date: 1 } },
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc Get 5 most recently joined members
// @route GET /api/dashboard/recent-members
const getRecentMembers = async (req, res, next) => {
  try {
    const members = await Member.find()
      .populate('trainerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

// @desc Get 10 most recent attendance records
// @route GET /api/dashboard/recent-attendance
const getRecentAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find()
      .populate('memberId', 'name memberId')
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats, getRevenueByPlan, getMembersPerTrainer,
  getMonthlyRevenue, getDailyAttendance, getRecentMembers, getRecentAttendance,
};
