const Membership = require('../models/Membership');
const MemberMembership = require('../models/MemberMembership');

// @desc Get all membership plans
// @route GET /api/memberships
const getMemberships = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const query = isAdmin ? {} : { status: 'Active' };
    const memberships = await Membership.find(query).sort({ price: 1 });

    if (isAdmin) {
      const counts = await MemberMembership.aggregate([
        { $match: { status: { $in: ['Active', 'Upcoming'] } } },
        { $group: { _id: '$membershipId', count: { $sum: 1 } } },
      ]);
      const countMap = {};
      counts.forEach(c => { countMap[c._id.toString()] = c.count; });
      const withCounts = memberships.map(m => ({
        ...m.toObject(),
        subscriberCount: countMap[m._id.toString()] || 0,
      }));
      return res.json({ success: true, data: withCounts });
    }

    res.json({ success: true, data: memberships });
  } catch (error) {
    next(error);
  }
};

// @desc Get single membership plan
// @route GET /api/memberships/:id
const getMembership = async (req, res, next) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      res.status(404);
      throw new Error('Membership plan not found');
    }
    res.json({ success: true, data: membership });
  } catch (error) {
    next(error);
  }
};

// @desc Create membership plan (admin only)
// @route POST /api/memberships
const createMembership = async (req, res, next) => {
  try {
    const membership = await Membership.create(req.body);
    res.status(201).json({ success: true, message: 'Membership plan created', data: membership });
  } catch (error) {
    next(error);
  }
};

// @desc Update membership plan (admin only)
// @route PUT /api/memberships/:id
const updateMembership = async (req, res, next) => {
  try {
    const membership = await Membership.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!membership) {
      res.status(404);
      throw new Error('Membership plan not found');
    }
    res.json({ success: true, message: 'Membership plan updated', data: membership });
  } catch (error) {
    next(error);
  }
};

// @desc Delete or deactivate membership plan (admin only)
// @route DELETE /api/memberships/:id
const deleteMembership = async (req, res, next) => {
  try {
    const activeCount = await MemberMembership.countDocuments({
      membershipId: req.params.id,
      status: { $in: ['Active', 'Upcoming'] },
    });

    if (activeCount > 0) {
      await Membership.findByIdAndUpdate(req.params.id, { status: 'Inactive' });
      return res.json({
        success: true,
        message: `Plan has ${activeCount} active membership(s). Plan deactivated instead of deleted to preserve history.`,
        deactivated: true,
      });
    }

    const membership = await Membership.findByIdAndDelete(req.params.id);
    if (!membership) {
      res.status(404);
      throw new Error('Membership plan not found');
    }
    res.json({ success: true, message: 'Membership plan deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMemberships, getMembership, createMembership, updateMembership, deleteMembership };
