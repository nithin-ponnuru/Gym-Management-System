const Notification = require('../models/Notification');

// @desc  Get all notifications (admin)
// @route GET /api/notifications
const getNotifications = async (req, res) => {
  const { type, isRead, page = 1, limit = 50 } = req.query;
  const query = {};

  if (isRead !== undefined && isRead !== '') {
    query.isRead = isRead === 'true';
  }

  if (type && type !== 'all' && type !== 'unread') {
    const categoryMap = {
      'New Members': ['NEW_MEMBER', 'MEMBER_STATUS_CHANGED'],
      'NEW_MEMBER': ['NEW_MEMBER', 'MEMBER_STATUS_CHANGED'],
      'Requests': ['MEMBERSHIP_REQUEST'],
      'MEMBERSHIP_REQUEST': ['MEMBERSHIP_REQUEST'],
      'Approved': ['MEMBERSHIP_APPROVED'],
      'MEMBERSHIP_APPROVED': ['MEMBERSHIP_APPROVED'],
      'Expiring': ['MEMBERSHIP_EXPIRING', 'MEMBERSHIP_EXPIRED'],
      'MEMBERSHIP_EXPIRING': ['MEMBERSHIP_EXPIRING', 'MEMBERSHIP_EXPIRED'],
      'MEMBERSHIP_EXPIRED': ['MEMBERSHIP_EXPIRING', 'MEMBERSHIP_EXPIRED'],
      'Payments': ['PAYMENT_VERIFIED', 'PAYMENT_FAILED'],
      'PAYMENT_VERIFIED': ['PAYMENT_VERIFIED', 'PAYMENT_FAILED'],
      'PAYMENT_FAILED': ['PAYMENT_VERIFIED', 'PAYMENT_FAILED'],
      'Trainers': ['TRAINER_ADDED'],
      'TRAINER_ADDED': ['TRAINER_ADDED'],
    };

    if (categoryMap[type]) {
      query.type = { $in: categoryMap[type] };
    } else {
      query.type = type;
    }
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ isRead: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
};

// @desc  Get unread count only (fast poll fallback)
// @route GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ isRead: false });
  res.json({ success: true, data: { count } });
};

// @desc  Mark a single notification as read
// @route PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  const unreadCount = await Notification.countDocuments({ isRead: false });
  res.json({ success: true, data: notification, unreadCount });
};

// @desc  Mark all notifications as read
// @route PUT /api/notifications/mark-all-read
const markAllRead = async (req, res) => {
  await Notification.updateMany({ isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read', unreadCount: 0 });
};

// @desc  Delete a notification
// @route DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json({ success: true, message: 'Notification deleted' });
};

// @desc  Delete all read notifications (cleanup)
// @route DELETE /api/notifications/clear-read
const clearReadNotifications = async (req, res) => {
  const result = await Notification.deleteMany({ isRead: true });
  res.json({ success: true, message: `Cleared ${result.deletedCount} read notifications` });
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification, clearReadNotifications };
