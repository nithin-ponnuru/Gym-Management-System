const express = require('express');
const router = express.Router();
const { getMemberships, getMembership, createMembership, updateMembership, deleteMembership } = require('../controllers/membershipController');
const { adminOnly } = require('../middleware/authMiddleware');

// GET: any authenticated user (members browse plans)
// POST: admin only
router.route('/').get(getMemberships).post(adminOnly, createMembership);
router.route('/:id').get(getMembership).put(adminOnly, updateMembership).delete(adminOnly, deleteMembership);

module.exports = router;
