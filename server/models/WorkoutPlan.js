const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
  },
  sets: {
    type: Number,
    required: [true, 'Sets is required'],
    min: [1, 'Sets must be at least 1'],
  },
  reps: {
    type: Number,
    required: [true, 'Reps is required'],
    min: [1, 'Reps must be at least 1'],
  },
  restSeconds: {
    type: Number,
    default: 60,
    min: [0, 'Rest cannot be negative'],
  },
  notes: {
    type: String,
    trim: true,
  },
});

const workoutPlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      minlength: [2, 'Plan name must be at least 2 characters'],
    },
    goal: {
      type: String,
      required: [true, 'Goal is required'],
      enum: ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'General Fitness', 'Flexibility', 'Athletic Performance'],
    },
    durationWeeks: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 week'],
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      default: null,
    },
    exercises: {
      type: [exerciseSchema],
      validate: {
        validator: function (v) {
          return v.length >= 1;
        },
        message: 'Workout plan must have at least one exercise',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
  },
  {
    timestamps: true,
  }
);

workoutPlanSchema.index({ goal: 1 });
workoutPlanSchema.index({ trainerId: 1 });
workoutPlanSchema.index({ planName: 'text' });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
