/**
 * notificationHelper.js
 * 
 * Central helper to:
 *  1. Save a notification to MongoDB
 *  2. Emit it via Socket.IO to all connected admins
 * 
 * Import and call `createNotification(...)` from any controller.
 */

const Notification = require('../models/Notification');
const { emitToAdmins } = require('./socketManager');

/**
 * @param {Object} opts
 * @param {string} opts.type          - Notification type enum
 * @param {string} opts.title         - Short title
 * @param {string} opts.message       - Full message text
 * @param {string} [opts.link]        - Frontend route to navigate to on click
 * @param {ObjectId} [opts.refId]     - MongoDB ObjectId of related document
 * @param {string} [opts.refModel]    - Model name ('Member', 'MemberMembership' etc.)
 * @param {string} [opts.priority]    - 'low' | 'medium' | 'high' | 'urgent'
 * @param {Object} [opts.meta]        - Any extra metadata
 */
async function createNotification(opts) {
  try {
    const notification = await Notification.create({
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link || '',
      refId: opts.refId || null,
      refModel: opts.refModel || null,
      priority: opts.priority || 'medium',
      meta: opts.meta || {},
    });

    // Emit real-time to all connected admins
    emitToAdmins('notification:new', notification.toObject());

    return notification;
  } catch (err) {
    // Never crash the calling controller due to notification failure
    console.error('[Notification] Failed to create notification:', err.message);
    return null;
  }
}

module.exports = { createNotification };
