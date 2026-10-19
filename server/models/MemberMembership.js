const mongoose = require('mongoose');

const memberMembershipSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member is required'],
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Membership',
      required: [true, 'Membership plan is required'],
    },
    // Snapshot of plan at time of assignment (for historical accuracy)
    planSnapshot: {
      planName: { type: String, default: '' },
      price: { type: Number, default: 0 },
      durationMonths: { type: Number, default: 1 },
      features: { type: [String], default: [] },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial', 'Failed'],
      default: 'Paid',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'],
      default: 'Cash',
    },
    transactionRef: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Cancelled', 'Upcoming', 'Pending Payment'],
      default: 'Active',
    },
    renewedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MemberMembership',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

memberMembershipSchema.index({ memberId: 1, status: 1 });
memberMembershipSchema.index({ expiryDate: 1 });
memberMembershipSchema.index({ membershipId: 1 });
memberMembershipSchema.index({ memberId: 1, startDate: -1 });

module.exports = mongoose.model('MemberMembership', memberMembershipSchema);
