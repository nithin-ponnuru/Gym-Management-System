/**
 * expiryCheckCron.js
 * 
 * Runs daily to check memberships about to expire:
 *  - 7 days before expiry  → MEMBERSHIP_EXPIRING (urgent)
 *  - 3 days before expiry  → MEMBERSHIP_EXPIRING (urgent)
 *  - On expiry day         → MEMBERSHIP_EXPIRING (urgent)
 *  - Already expired       → marks as Expired + MEMBERSHIP_EXPIRED
 * 
 * Uses a `meta.reminderSent` array to prevent duplicate notifications.
 */

const cron = require('node-cron');
const MemberMembership = require('../models/MemberMembership');
const Notification = require('../models/Notification');
const { createNotification } = require('./notificationHelper');

function startExpiryCheckCron() {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running membership expiry check...');
    try {
      await runExpiryCheck();
    } catch (err) {
      console.error('[Cron] Expiry check error:', err.message);
    }
  });

  // Also run once on server startup (after 5 seconds)
  setTimeout(async () => {
    console.log('[Cron] Running initial expiry check on startup...');
    try {
      await runExpiryCheck();
    } catch (err) {
      console.error('[Cron] Initial expiry check error:', err.message);
    }
  }, 5000);
}

async function runExpiryCheck() {
  const now = new Date();

  // 1. Auto-expire overdue Active memberships
  const expired = await MemberMembership.updateMany(
    { status: 'Active', expiryDate: { $lt: now } },
    { $set: { status: 'Expired' } }
  );
  if (expired.modifiedCount > 0) {
    console.log(`[Cron] Expired ${expired.modifiedCount} memberships`);
  }

  // 2. Check UPCOMING expiries and send reminders (7, 3, 0 days)
  const reminderDays = [7, 3, 0];

  for (const days of reminderDays) {
    const targetStart = new Date(now);
    targetStart.setDate(targetStart.getDate() + days);
    targetStart.setHours(0, 0, 0, 0);

    const targetEnd = new Date(targetStart);
    targetEnd.setHours(23, 59, 59, 999);

    const expiringMemberships = await MemberMembership.find({
      status: 'Active',
      expiryDate: { $gte: targetStart, $lte: targetEnd },
    })
      .populate('memberId', 'name memberId email')
      .populate('membershipId', 'planName');

    for (const mm of expiringMemberships) {
      const reminderKey = `expiry_${days}d_${mm._id}`;

      // Check if we already sent this specific reminder
      const alreadySent = await Notification.findOne({
        type: 'MEMBERSHIP_EXPIRING',
        'meta.reminderKey': reminderKey,
      });

      if (alreadySent) continue;

      const memberName = mm.memberId?.name || 'Unknown Member';
      const memberId = mm.memberId?.memberId || '';
      const planName = mm.membershipId?.planName || mm.planSnapshot?.planName || 'Plan';
      const expiryDateStr = new Date(mm.expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      const title = days === 0
        ? 'Membership Expires Today!'
        : `Membership Expiring in ${days} Days`;

      const message = days === 0
        ? `${memberName} (${memberId}) — ${planName} expires today (${expiryDateStr}).`
        : `${memberName} (${memberId}) — ${planName} expires in ${days} days on ${expiryDateStr}.`;

      await createNotification({
        type: 'MEMBERSHIP_EXPIRING',
        title,
        message,
        link: '/memberships',
        refId: mm._id,
        refModel: 'MemberMembership',
        priority: days === 0 ? 'urgent' : 'high',
        meta: {
          memberName,
          memberId,
          planName,
          expiryDate: mm.expiryDate,
          daysLeft: days,
          reminderKey, // Deduplication key
        },
      });

      console.log(`[Cron] Sent ${days}d expiry reminder for ${memberName} (${memberId})`);
    }
  }
}

module.exports = { startExpiryCheckCron, runExpiryCheck };
