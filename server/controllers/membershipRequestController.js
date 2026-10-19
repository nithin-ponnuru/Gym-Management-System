const MembershipRequest = require('../models/MembershipRequest');
const MemberMembership = require('../models/MemberMembership');
const Membership = require('../models/Membership');
const Member = require('../models/Member');
const { createNotification } = require('../utils/notificationHelper');

// @desc Member submits a membership request
// @route POST /api/membership-requests
const createRequest = async (req, res, next) => {
  try {
    const { membershipId, preferredStartDate, message, requestType } = req.body;
    const memberId = req.user.id; // Always from JWT — never from body

    if (req.user.role === 'admin') {
      res.status(403);
      throw new Error('Admins cannot submit membership requests. Use direct assignment.');
    }

    const plan = await Membership.findById(membershipId);
    if (!plan || plan.status === 'Inactive') {
      res.status(404);
      throw new Error('Membership plan not found or inactive');
    }

    // Prevent duplicate pending requests
    const existing = await MembershipRequest.findOne({
      memberId,
      membershipId,
      status: 'Pending',
    });
    if (existing) {
      res.status(409);
      throw new Error('You already have a pending request for this plan. Please wait for admin to process it.');
    }

    const request = await MembershipRequest.create({
      memberId,
      membershipId,
      requestType: requestType || 'New',
      preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : new Date(),
      message: message || '',
    });

    await request.populate([
      { path: 'memberId', select: 'name email memberId' },
      { path: 'membershipId', select: 'planName price durationMonths' },
    ]);

    // Notify admin
    createNotification({
      type: 'MEMBERSHIP_REQUEST',
      title: 'New Membership Request',
      message: `${request.memberId?.name} (${request.memberId?.memberId}) requested ${request.membershipId?.planName} — ₹${request.membershipId?.price?.toLocaleString('en-IN')}`,
      link: '/memberships',
      refId: request._id,
      refModel: 'MembershipRequest',
      priority: 'high',
      meta: {
        memberName: request.memberId?.name,
        memberId: request.memberId?.memberId,
        planName: request.membershipId?.planName,
        price: request.membershipId?.price,
        requestType: request.requestType,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Membership request submitted successfully. The gym admin will review it shortly.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get membership requests
// @route GET /api/membership-requests
const getRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role !== 'admin') {
      query.memberId = req.user.id;
    }
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      MembershipRequest.find(query)
        .populate('memberId', 'name email memberId')
        .populate('membershipId', 'planName price durationMonths features')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      MembershipRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Admin approves a request → creates membership assignment
// @route PUT /api/membership-requests/:id/approve
const approveRequest = async (req, res, next) => {
  try {
    const { amountPaid, paymentStatus, paymentMethod, transactionRef, adminNote } = req.body;

    const request = await MembershipRequest.findById(req.params.id).populate('membershipId');

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }
    if (request.status !== 'Pending') {
      res.status(400);
      throw new Error(`Request has already been ${request.status.toLowerCase()}`);
    }

    const plan = request.membershipId;

    // Check for overlapping active membership
    const existingActive = await MemberMembership.findOne({
      memberId: request.memberId,
      status: { $in: ['Active', 'Upcoming'] },
    });
    if (existingActive) {
      res.status(409);
      throw new Error('Member already has an active membership. Cancel it first before approving this request.');
    }

    const start = new Date(request.preferredStartDate);
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + plan.durationMonths);

    const now = new Date();
    const psStatus = paymentStatus || 'Paid';
    let status = 'Active';
    if (psStatus === 'Pending' || psStatus === 'Failed') status = 'Pending Payment';
    else if (start > now) status = 'Upcoming';

    const assignment = await MemberMembership.create({
      memberId: request.memberId,
      membershipId: plan._id,
      planSnapshot: {
        planName: plan.planName,
        price: plan.price,
        durationMonths: plan.durationMonths,
        features: plan.features,
      },
      startDate: start,
      expiryDate: expiry,
      amountPaid: amountPaid !== undefined ? Number(amountPaid) : plan.price,
      paymentStatus: psStatus,
      paymentMethod: paymentMethod || 'Cash',
      transactionRef: transactionRef || '',
      status,
    });

    request.status = 'Approved';
    request.adminNote = adminNote || '';
    request.processedAt = new Date();
    request.processedBy = req.user.email || 'Admin';
    request.assignedMembershipId = assignment._id;
    await request.save();

    // Populate member info for notification
    const memberDoc = await Member.findById(request.memberId).select('name memberId email');
    createNotification({
      type: 'MEMBERSHIP_APPROVED',
      title: 'Membership Approved',
      message: `${memberDoc?.name || 'Member'} (${memberDoc?.memberId}) — ${plan.planName} approved. Payment: ${psStatus}`,
      link: '/memberships',
      refId: assignment._id,
      refModel: 'MemberMembership',
      priority: 'medium',
      meta: { memberName: memberDoc?.name, memberId: memberDoc?.memberId, planName: plan.planName, paymentStatus: psStatus },
    });

    if (psStatus === 'Paid') {
      createNotification({
        type: 'PAYMENT_VERIFIED',
        title: 'Payment Verified',
        message: `Payment of ₹${assignment.amountPaid.toLocaleString('en-IN')} verified for ${memberDoc?.name} (${plan.planName})`,
        link: '/memberships',
        refId: assignment._id,
        refModel: 'MemberMembership',
        priority: 'medium',
        meta: { memberName: memberDoc?.name, planName: plan.planName, price: assignment.amountPaid },
      });
    }

    res.json({ success: true, message: 'Request approved and membership activated', data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc Admin rejects a membership request
// @route PUT /api/membership-requests/:id/reject
const rejectRequest = async (req, res, next) => {
  try {
    const { adminNote } = req.body;
    const request = await MembershipRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }
    if (request.status !== 'Pending') {
      res.status(400);
      throw new Error(`Request has already been ${request.status.toLowerCase()}`);
    }

    request.status = 'Rejected';
    request.adminNote = adminNote || '';
    request.processedAt = new Date();
    request.processedBy = req.user.email || 'Admin';
    await request.save();

    await request.populate([
      { path: 'memberId', select: 'name email memberId' },
      { path: 'membershipId', select: 'planName price' },
    ]);

    createNotification({
      type: 'MEMBERSHIP_REJECTED',
      title: 'Membership Request Rejected',
      message: `Request for ${request.membershipId?.planName} by ${request.memberId?.name} was rejected.`,
      link: '/memberships',
      refId: request._id,
      refModel: 'MembershipRequest',
      priority: 'medium',
      meta: { memberName: request.memberId?.name, planName: request.membershipId?.planName, reason: adminNote },
    });

    res.json({ success: true, message: 'Request rejected', data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRequest, getRequests, approveRequest, rejectRequest };
