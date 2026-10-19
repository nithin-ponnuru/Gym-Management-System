const Member = require('../models/Member');
const mongoose = require('mongoose');
const { createNotification } = require('../utils/notificationHelper');

// @desc Get all members with search, filter, sort, pagination
// @route GET /api/members
const getMembers = async (req, res, next) => {
  try {
    const {
      search,
      status,
      trainerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (trainerId && trainerId !== 'all') {
      query.trainerId = mongoose.Types.ObjectId.isValid(trainerId) ? new mongoose.Types.ObjectId(trainerId) : null;
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [members, total] = await Promise.all([
      Member.find(query)
        .populate('trainerId', 'name specialization')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Member.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: members,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single member
// @route GET /api/members/:id
const getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('trainerId', 'name specialization phone email');

    if (!member) {
      res.status(404);
      throw new Error('Member not found');
    }

    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

// @desc Create member
// @route POST /api/members
const createMember = async (req, res, next) => {
  try {
    const member = await Member.create(req.body);
    await member.populate('trainerId', 'name specialization');

    createNotification({
      type: 'NEW_MEMBER',
      title: 'New Member Registered',
      message: `${member.name} (${member.memberId}) registered. Email: ${member.email}`,
      link: '/members',
      refId: member._id,
      refModel: 'Member',
      priority: 'medium',
      meta: { memberName: member.name, memberId: member.memberId, email: member.email },
    });

    res.status(201).json({ success: true, message: 'Member created successfully', data: member });
  } catch (error) {
    next(error);
  }
};

// @desc Update member
// @route PUT /api/members/:id
const updateMember = async (req, res, next) => {
  try {
    const oldMember = await Member.findById(req.params.id);
    if (!oldMember) {
      res.status(404);
      throw new Error('Member not found');
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('trainerId', 'name specialization');

    if (req.body.status && req.body.status !== oldMember.status) {
      createNotification({
        type: 'MEMBER_STATUS_CHANGED',
        title: 'Member Status Changed',
        message: `${member.name} (${member.memberId}) status changed from ${oldMember.status} to ${member.status}`,
        link: '/members',
        refId: member._id,
        refModel: 'Member',
        priority: 'medium',
        meta: { memberName: member.name, oldStatus: oldMember.status, newStatus: member.status },
      });
    }

    res.json({ success: true, message: 'Member updated successfully', data: member });
  } catch (error) {
    next(error);
  }
};

// @desc Delete member
// @route DELETE /api/members/:id
const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);

    if (!member) {
      res.status(404);
      throw new Error('Member not found');
    }

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMembers, getMember, createMember, updateMember, deleteMember };
