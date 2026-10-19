const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  clearReadNotifications,
} = require('../controllers/notificationController');

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllRead);
router.delete('/clear-read', clearReadNotifications);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
