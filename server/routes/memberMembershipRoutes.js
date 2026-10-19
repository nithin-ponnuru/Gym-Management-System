const express = require('express');
const router = express.Router();
const {
  getMemberMemberships,
  createMemberMembership,
  renewMembership,
  updateMemberMembership,
  cancelMembership,
  deleteMemberMembership,
} = require('../controllers/memberMembershipController');
const { adminOnly } = require('../middleware/authMiddleware');

router.route('/').get(getMemberMemberships).post(adminOnly, createMemberMembership);
router.post('/:id/renew', adminOnly, renewMembership);
router.put('/:id/cancel', adminOnly, cancelMembership);
router.route('/:id').put(adminOnly, updateMemberMembership).delete(adminOnly, deleteMemberMembership);

module.exports = router;
