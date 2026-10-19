const WorkoutPlan = require('../models/WorkoutPlan');

// @desc Get all workout plans with search and filter
// @route GET /api/workouts
const getWorkouts = async (req, res, next) => {
  try {
    const { search, goal, trainerId, difficulty } = req.query;
    const query = {};

    if (search) {
      query.planName = { $regex: search, $options: 'i' };
    }
    if (goal) query.goal = goal;
    if (trainerId && trainerId !== 'all') query.trainerId = trainerId;
    if (difficulty) query.difficulty = difficulty;

    const workouts = await WorkoutPlan.find(query)
      .populate('trainerId', 'name specialization')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: workouts });
  } catch (error) {
    next(error);
  }
};

// @desc Get single workout plan
// @route GET /api/workouts/:id
const getWorkout = async (req, res, next) => {
  try {
    const workout = await WorkoutPlan.findById(req.params.id).populate('trainerId', 'name specialization');
    if (!workout) {
      res.status(404);
      throw new Error('Workout plan not found');
    }
    res.json({ success: true, data: workout });
  } catch (error) {
    next(error);
  }
};

// @desc Create workout plan
// @route POST /api/workouts
const createWorkout = async (req, res, next) => {
  try {
    const workout = await WorkoutPlan.create(req.body);
    await workout.populate('trainerId', 'name specialization');
    res.status(201).json({ success: true, message: 'Workout plan created', data: workout });
  } catch (error) {
    next(error);
  }
};

// @desc Update workout plan
// @route PUT /api/workouts/:id
const updateWorkout = async (req, res, next) => {
  try {
    const workout = await WorkoutPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('trainerId', 'name specialization');
    if (!workout) {
      res.status(404);
      throw new Error('Workout plan not found');
    }
    res.json({ success: true, message: 'Workout plan updated', data: workout });
  } catch (error) {
    next(error);
  }
};

// @desc Delete workout plan
// @route DELETE /api/workouts/:id
const deleteWorkout = async (req, res, next) => {
  try {
    const workout = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!workout) {
      res.status(404);
      throw new Error('Workout plan not found');
    }
    res.json({ success: true, message: 'Workout plan deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkouts, getWorkout, createWorkout, updateWorkout, deleteWorkout };
