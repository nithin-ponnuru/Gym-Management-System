const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    age: {
      type: Number,
      min: [5, 'Age must be at least 5'],
      max: [120, 'Age must be at most 120'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
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
    address: {
      type: String,
      trim: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate memberId before saving safely without collisions
memberSchema.pre('save', async function () {
  if (!this.memberId) {
    const lastMember = await mongoose.model('Member').findOne({ memberId: { $regex: /^MEM\d+$/ } }).sort({ createdAt: -1, _id: -1 });
    let nextNum = 1;
    if (lastMember && lastMember.memberId) {
      const num = parseInt(lastMember.memberId.replace('MEM', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    let candidate = `MEM${String(nextNum).padStart(4, '0')}`;
    while (await mongoose.model('Member').exists({ memberId: candidate })) {
      nextNum++;
      candidate = `MEM${String(nextNum).padStart(4, '0')}`;
    }
    this.memberId = candidate;
  }
});

memberSchema.index({ name: 'text', email: 'text', phone: 'text' });
memberSchema.index({ status: 1 });
memberSchema.index({ trainerId: 1 });
memberSchema.index({ joinDate: -1 });

module.exports = mongoose.model('Member', memberSchema);
