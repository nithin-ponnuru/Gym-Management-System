const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'NEW_MEMBER',
        'MEMBERSHIP_REQUEST',
        'MEMBERSHIP_APPROVED',
        'MEMBERSHIP_REJECTED',
        'MEMBERSHIP_CANCELLED',
        'PAYMENT_VERIFIED',
        'PAYMENT_FAILED',
        'MEMBERSHIP_EXPIRING',
        'MEMBERSHIP_EXPIRED',
        'TRAINER_ADDED',
        'MEMBER_STATUS_CHANGED',
        'ATTENDANCE_MARKED',
      ],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    // Reference data for navigation
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    refModel: {
      type: String,
      enum: ['Member', 'MemberMembership', 'MembershipRequest', 'Trainer', null],
      default: null,
    },
    // Navigation target for frontend
    link: { type: String, default: '' },
    // Read status
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    // Extra metadata (member name, plan name etc.)
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
