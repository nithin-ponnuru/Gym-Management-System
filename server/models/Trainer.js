const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema(
  {
    trainerId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      enum: [
        'Weight Training',
        'Cardio',
        'Yoga',
        'CrossFit',
        'Personal Training',
        'Strength Training',
        'Pilates',
        'HIIT',
        'Boxing',
        'Swimming',
      ],
    },
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    bio: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate trainerId before saving safely without collisions
trainerSchema.pre('save', async function () {
  if (!this.trainerId) {
    const lastTrainer = await mongoose.model('Trainer').findOne({ trainerId: { $regex: /^TRN\d+$/ } }).sort({ createdAt: -1, _id: -1 });
    let nextNum = 1;
    if (lastTrainer && lastTrainer.trainerId) {
      const num = parseInt(lastTrainer.trainerId.replace('TRN', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    let candidate = `TRN${String(nextNum).padStart(3, '0')}`;
    while (await mongoose.model('Trainer').exists({ trainerId: candidate })) {
      nextNum++;
      candidate = `TRN${String(nextNum).padStart(3, '0')}`;
    }
    this.trainerId = candidate;
  }
});

trainerSchema.index({ name: 'text', specialization: 'text' });
trainerSchema.index({ status: 1 });

module.exports = mongoose.model('Trainer', trainerSchema);
