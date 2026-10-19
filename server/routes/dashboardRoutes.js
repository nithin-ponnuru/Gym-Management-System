const express = require('express');
const router = express.Router();
const {
  getStats,
  getRevenueByPlan,
  getMembersPerTrainer,
  getMonthlyRevenue,
  getDailyAttendance,
  getRecentMembers,
  getRecentAttendance,
} = require('../controllers/dashboardController');

router.get('/stats', getStats);
router.get('/revenue-by-plan', getRevenueByPlan);
router.get('/members-per-trainer', getMembersPerTrainer);
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/daily-attendance', getDailyAttendance);
router.get('/recent-members', getRecentMembers);
router.get('/recent-attendance', getRecentAttendance);

module.exports = router;
