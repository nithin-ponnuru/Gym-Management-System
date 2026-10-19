const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const { createNotification } = require('../utils/notificationHelper');

// @desc Get all trainers with search, filter, and member counts
// @route GET /api/trainers
const getTrainers = async (req, res, next) => {
  try {
    const { search, status, specialization } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (specialization) query.specialization = specialization;

    const trainers = await Trainer.find(query).sort({ createdAt: -1 }).lean();

    // Add member count to each trainer
    const trainerIds = trainers.map(t => t._id);
    const memberCounts = await Member.aggregate([
      { $match: { trainerId: { $in: trainerIds } } },
      { $group: { _id: '$trainerId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    memberCounts.forEach(item => {
      countMap[item._id.toString()] = item.count;
    });

    const trainersWithCount = trainers.map(t => ({
      ...t,
      memberCount: countMap[t._id.toString()] || 0,
    }));

    res.json({ success: true, data: trainersWithCount });
  } catch (error) {
    next(error);
  }
};

// @desc Get single trainer
// @route GET /api/trainers/:id
const getTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      res.status(404);
      throw new Error('Trainer not found');
    }
    const memberCount = await Member.countDocuments({ trainerId: req.params.id });
    res.json({ success: true, data: { ...trainer.toObject(), memberCount } });
  } catch (error) {
    next(error);
  }
};

// @desc Create trainer
// @route POST /api/trainers
const createTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.create(req.body);
    createNotification({
      type: 'TRAINER_ADDED',
      title: 'New Trainer Added',
      message: `${trainer.name} joined as a trainer — ${trainer.specialization} (${trainer.experience} yrs exp)`,
      link: '/trainers',
      refId: trainer._id,
      refModel: 'Trainer',
      priority: 'low',
      meta: { trainerName: trainer.name, specialization: trainer.specialization },
    });
    res.status(201).json({ success: true, message: 'Trainer created successfully', data: trainer });
  } catch (error) {
    next(error);
  }
};

// @desc Update trainer
// @route PUT /api/trainers/:id
const updateTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!trainer) {
      res.status(404);
      throw new Error('Trainer not found');
    }
    res.json({ success: true, message: 'Trainer updated successfully', data: trainer });
  } catch (error) {
    next(error);
  }
};

// @desc Delete trainer and unassign from members
// @route DELETE /api/trainers/:id
const deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) {
      res.status(404);
      throw new Error('Trainer not found');
    }
    // Unassign trainer from members
    await Member.updateMany({ trainerId: req.params.id }, { $set: { trainerId: null } });
    res.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTrainers, getTrainer, createTrainer, updateTrainer, deleteTrainer };
