const express = require('express');
const router = express.Router();
const { createRequest, getRequests, approveRequest, rejectRequest } = require('../controllers/membershipRequestController');
const { adminOnly } = require('../middleware/authMiddleware');

router.route('/').post(createRequest).get(getRequests);
router.put('/:id/approve', adminOnly, approveRequest);
router.put('/:id/reject', adminOnly, rejectRequest);

module.exports = router;
