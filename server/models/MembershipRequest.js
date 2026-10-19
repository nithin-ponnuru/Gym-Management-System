const mongoose = require('mongoose');

const membershipRequestSchema = new mongoose.Schema(
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
    requestType: {
      type: String,
      enum: ['New', 'Renewal', 'Upgrade'],
      default: 'New',
    },
    preferredStartDate: {
      type: Date,
      default: Date.now,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: String,
      default: '',
    },
    assignedMembershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MemberMembership',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

membershipRequestSchema.index({ memberId: 1, status: 1 });
membershipRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MembershipRequest', membershipRequestSchema);
