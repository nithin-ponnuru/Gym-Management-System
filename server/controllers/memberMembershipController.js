const MemberMembership = require('../models/MemberMembership');
const Membership = require('../models/Membership');
const Member = require('../models/Member');
const { createNotification } = require('../utils/notificationHelper');

// ── Auto-expire stale active memberships ────────────────────────────────────
async function autoExpireStale(memberIdFilter) {
  const query = { status: 'Active', expiryDate: { $lt: new Date() } };
  if (memberIdFilter) query.memberId = memberIdFilter;
  await MemberMembership.updateMany(query, { $set: { status: 'Expired' } });
}

// ── Auto-activate upcoming memberships whose start date has passed ───────────
async function autoActivateUpcoming(memberIdFilter) {
  const query = {
    status: 'Upcoming',
    startDate: { $lte: new Date() },
    paymentStatus: 'Paid',
  };
  if (memberIdFilter) query.memberId = memberIdFilter;
  await MemberMembership.updateMany(query, { $set: { status: 'Active' } });
}

// @desc Get all member-membership assignments (admin) or current member's (member)
// @route GET /api/member-memberships
const getMemberMemberships = async (req, res, next) => {
  try {
    await autoExpireStale();
    await autoActivateUpcoming();

    const isAdmin = req.user.role === 'admin';
    const {
      memberId, status, paymentStatus, search, planId,
      sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20,
    } = req.query;

    const query = {};

    if (!isAdmin) {
      query.memberId = req.user.id;
    } else {
      if (memberId) query.memberId = memberId;
      if (planId) query.membershipId = planId;
    }

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let results = await MemberMembership.find(query)
      .populate('memberId', 'name email memberId phone')
      .populate('membershipId', 'planName durationMonths price features color description badge isPopular isBestValue')
      .sort(sortObj)
      .lean();

    // Admin search across member fields
    if (isAdmin && search) {
      const s = search.toLowerCase();
      results = results.filter(r =>
        r.memberId?.name?.toLowerCase().includes(s) ||
        r.memberId?.email?.toLowerCase().includes(s) ||
        r.memberId?.memberId?.toLowerCase().includes(s)
      );
    }

    const total = results.length;
    const paginated = results.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Assign a membership plan to a member (admin only)
// @route POST /api/member-memberships
const createMemberMembership = async (req, res, next) => {
  try {
    const { memberId, membershipId, startDate, amountPaid, paymentStatus, paymentMethod, transactionRef, notes } = req.body;

    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404);
      throw new Error('Member not found');
    }

    const plan = await Membership.findById(membershipId);
    if (!plan) {
      res.status(404);
      throw new Error('Membership plan not found');
    }
    if (plan.status === 'Inactive') {
      res.status(400);
      throw new Error('This membership plan is inactive and cannot be assigned');
    }

    // Auto-expire stale for this member first
    await autoExpireStale(memberId);

    // Check for overlapping active membership
    const existingActive = await MemberMembership.findOne({
      memberId,
      status: { $in: ['Active', 'Upcoming'] },
    });
    if (existingActive) {
      res.status(409);
      throw new Error(
        `Member already has an ${existingActive.status.toLowerCase()} membership. Cancel or expire it first, or use the Renew option.`
      );
    }

    const start = new Date(startDate || Date.now());
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + plan.durationMonths);

    const now = new Date();
    const psStatus = paymentStatus || 'Paid';
    let status = 'Active';
    if (psStatus === 'Pending' || psStatus === 'Failed') status = 'Pending Payment';
    else if (start > now) status = 'Upcoming';

    const memberMembership = await MemberMembership.create({
      memberId,
      membershipId,
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
      notes: notes || '',
    });

    await memberMembership.populate([
      { path: 'memberId', select: 'name email memberId' },
      { path: 'membershipId', select: 'planName durationMonths price features' },
    ]);

    // Send notifications
    createNotification({
      type: 'MEMBERSHIP_APPROVED',
      title: 'Membership Assigned',
      message: `${member.name} (${member.memberId}) assigned ${plan.planName} (${status})`,
      link: '/memberships',
      refId: memberMembership._id,
      refModel: 'MemberMembership',
      priority: 'medium',
      meta: { memberName: member.name, memberId: member.memberId, planName: plan.planName, price: memberMembership.amountPaid },
    });

    if (psStatus === 'Paid') {
      createNotification({
        type: 'PAYMENT_VERIFIED',
        title: 'Payment Verified',
        message: `Payment of ₹${memberMembership.amountPaid.toLocaleString('en-IN')} verified for ${member.name} (${plan.planName}) via ${memberMembership.paymentMethod}`,
        link: '/memberships',
        refId: memberMembership._id,
        refModel: 'MemberMembership',
        priority: 'medium',
        meta: { memberName: member.name, planName: plan.planName, price: memberMembership.amountPaid, paymentMethod: memberMembership.paymentMethod },
      });
    } else if (psStatus === 'Failed') {
      createNotification({
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: `Payment failed for ${member.name} — ${plan.planName}`,
        link: '/memberships',
        refId: memberMembership._id,
        refModel: 'MemberMembership',
        priority: 'high',
        meta: { memberName: member.name, planName: plan.planName },
      });
    }

    res.status(201).json({ success: true, message: 'Membership assigned successfully', data: memberMembership });
  } catch (error) {
    next(error);
  }
};

// @desc Renew a membership — creates new record, links to previous
// @route POST /api/member-memberships/:id/renew
const renewMembership = async (req, res, next) => {
  try {
    const { membershipId, startDate, amountPaid, paymentStatus, paymentMethod, transactionRef, notes } = req.body;

    const existing = await MemberMembership.findById(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error('Membership record not found');
    }

    const planId = membershipId || existing.membershipId;
    const plan = await Membership.findById(planId);
    if (!plan) {
      res.status(404);
      throw new Error('Membership plan not found');
    }

    const oldExpiry = new Date(existing.expiryDate);
    const today = new Date();
    const newStart = startDate ? new Date(startDate) : (oldExpiry > today ? oldExpiry : today);
    const newExpiry = new Date(newStart);
    newExpiry.setMonth(newExpiry.getMonth() + plan.durationMonths);

    const now = new Date();
    const psStatus = paymentStatus || 'Paid';
    let status = 'Active';
    if (psStatus === 'Pending' || psStatus === 'Failed') status = 'Pending Payment';
    else if (newStart > now) status = 'Upcoming';

    // Mark old as Expired if still Active/Upcoming
    if (['Active', 'Upcoming', 'Pending Payment'].includes(existing.status)) {
      await MemberMembership.findByIdAndUpdate(existing._id, { status: 'Expired' });
    }

    const renewal = await MemberMembership.create({
      memberId: existing.memberId,
      membershipId: planId,
      planSnapshot: {
        planName: plan.planName,
        price: plan.price,
        durationMonths: plan.durationMonths,
        features: plan.features,
      },
      startDate: newStart,
      expiryDate: newExpiry,
      amountPaid: amountPaid !== undefined ? Number(amountPaid) : plan.price,
      paymentStatus: psStatus,
      paymentMethod: paymentMethod || 'Cash',
      transactionRef: transactionRef || '',
      status,
      renewedFrom: existing._id,
      notes: notes || '',
    });

    await renewal.populate([
      { path: 'memberId', select: 'name email memberId' },
      { path: 'membershipId', select: 'planName durationMonths price features' },
    ]);

    const memberName = renewal.memberId?.name || 'Member';
    const memberIdStr = renewal.memberId?.memberId || '';

    createNotification({
      type: 'MEMBERSHIP_APPROVED',
      title: 'Membership Renewed',
      message: `${memberName} (${memberIdStr}) renewed ${plan.planName}`,
      link: '/memberships',
      refId: renewal._id,
      refModel: 'MemberMembership',
      priority: 'medium',
      meta: { memberName, memberId: memberIdStr, planName: plan.planName },
    });

    if (psStatus === 'Paid') {
      createNotification({
        type: 'PAYMENT_VERIFIED',
        title: 'Payment Verified',
        message: `Payment of ₹${renewal.amountPaid.toLocaleString('en-IN')} verified for renewal of ${memberName} (${plan.planName})`,
        link: '/memberships',
        refId: renewal._id,
        refModel: 'MemberMembership',
        priority: 'medium',
        meta: { memberName, planName: plan.planName, price: renewal.amountPaid },
      });
    }

    res.status(201).json({ success: true, message: 'Membership renewed successfully', data: renewal });
  } catch (error) {
    next(error);
  }
};

// @desc Update a member-membership record
// @route PUT /api/member-memberships/:id
const updateMemberMembership = async (req, res, next) => {
  try {
    const oldMm = await MemberMembership.findById(req.params.id);
    if (!oldMm) {
      res.status(404);
      throw new Error('Member membership not found');
    }

    const memberMembership = await MemberMembership.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'memberId', select: 'name email memberId' },
      { path: 'membershipId', select: 'planName durationMonths price features' },
    ]);

    const memberName = memberMembership.memberId?.name || 'Member';
    const planName = memberMembership.membershipId?.planName || memberMembership.planSnapshot?.planName || 'Plan';

    // Payment verification notification
    if (req.body.paymentStatus && req.body.paymentStatus !== oldMm.paymentStatus) {
      if (req.body.paymentStatus === 'Paid') {
        createNotification({
          type: 'PAYMENT_VERIFIED',
          title: 'Payment Verified',
          message: `Payment of ₹${memberMembership.amountPaid.toLocaleString('en-IN')} verified for ${memberName} (${planName})`,
          link: '/memberships',
          refId: memberMembership._id,
          refModel: 'MemberMembership',
          priority: 'medium',
          meta: { memberName, planName, price: memberMembership.amountPaid },
        });
      } else if (req.body.paymentStatus === 'Failed') {
        createNotification({
          type: 'PAYMENT_FAILED',
          title: 'Payment Failed',
          message: `Payment failed for ${memberName} (${planName})`,
          link: '/memberships',
          refId: memberMembership._id,
          refModel: 'MemberMembership',
          priority: 'high',
          meta: { memberName, planName },
        });
      }
    }

    res.json({ success: true, message: 'Membership updated successfully', data: memberMembership });
  } catch (error) {
    next(error);
  }
};

// @desc Cancel a membership
// @route PUT /api/member-memberships/:id/cancel
const cancelMembership = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const mm = await MemberMembership.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Cancelled',
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelled by admin',
      },
      { new: true }
    ).populate([
      { path: 'memberId', select: 'name email memberId' },
      { path: 'membershipId', select: 'planName durationMonths price' },
    ]);

    if (!mm) {
      res.status(404);
      throw new Error('Membership record not found');
    }

    const memberName = mm.memberId?.name || 'Member';
    const planName = mm.membershipId?.planName || mm.planSnapshot?.planName || 'Plan';

    createNotification({
      type: 'MEMBERSHIP_CANCELLED',
      title: 'Membership Cancelled',
      message: `Membership for ${memberName} (${planName}) was cancelled. Reason: ${reason || 'N/A'}`,
      link: '/memberships',
      refId: mm._id,
      refModel: 'MemberMembership',
      priority: 'high',
      meta: { memberName, planName, reason },
    });

    res.json({ success: true, message: 'Membership cancelled', data: mm });
  } catch (error) {
    next(error);
  }
};

// @desc Delete a member-membership record
// @route DELETE /api/member-memberships/:id
const deleteMemberMembership = async (req, res, next) => {
  try {
    const memberMembership = await MemberMembership.findByIdAndDelete(req.params.id);
    if (!memberMembership) {
      res.status(404);
      throw new Error('Member membership not found');
    }
    res.json({ success: true, message: 'Membership deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMemberMemberships,
  createMemberMembership,
  renewMembership,
  updateMemberMembership,
  cancelMembership,
  deleteMemberMembership,
};
