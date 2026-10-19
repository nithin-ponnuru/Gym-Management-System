import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, X, CheckCheck, Trash2, Users, CreditCard, AlertTriangle,
  UserPlus, DollarSign, Clock, UserCheck, ChevronRight
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

// ── Icon & color per notification type ─────────────────────────────────────
const TYPE_CONFIG = {
  NEW_MEMBER:            { icon: UserPlus,     color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'New Member' },
  MEMBERSHIP_REQUEST:    { icon: CreditCard,   color: 'text-violet-600',  bg: 'bg-violet-50',  label: 'Request' },
  MEMBERSHIP_APPROVED:   { icon: CheckCheck,   color: 'text-green-600',   bg: 'bg-green-50',   label: 'Approved' },
  MEMBERSHIP_REJECTED:   { icon: X,            color: 'text-red-600',     bg: 'bg-red-50',     label: 'Rejected' },
  MEMBERSHIP_CANCELLED:  { icon: X,            color: 'text-slate-600',   bg: 'bg-slate-100',  label: 'Cancelled' },
  PAYMENT_VERIFIED:      { icon: DollarSign,   color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Payment' },
  PAYMENT_FAILED:        { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50',     label: 'Failed' },
  MEMBERSHIP_EXPIRING:   { icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',   label: 'Expiring' },
  MEMBERSHIP_EXPIRED:    { icon: AlertTriangle, color: 'text-rose-600',   bg: 'bg-rose-50',    label: 'Expired' },
  TRAINER_ADDED:         { icon: UserCheck,    color: 'text-indigo-600',  bg: 'bg-indigo-50',  label: 'Trainer' },
  MEMBER_STATUS_CHANGED: { icon: Users,        color: 'text-slate-600',   bg: 'bg-slate-100',  label: 'Status' },
  ATTENDANCE_MARKED:     { icon: CheckCheck,   color: 'text-teal-600',    bg: 'bg-teal-50',    label: 'Attendance' },
};

const DEFAULT_CONFIG = { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Info' };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Filter categories ───────────────────────────────────────────────────────
const FILTER_GROUPS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'New Members', value: 'new_members', types: ['NEW_MEMBER', 'MEMBER_STATUS_CHANGED'] },
  { label: 'Requests', value: 'requests', types: ['MEMBERSHIP_REQUEST'] },
  { label: 'Approved', value: 'approved', types: ['MEMBERSHIP_APPROVED'] },
  { label: 'Expiring', value: 'expiring', types: ['MEMBERSHIP_EXPIRING', 'MEMBERSHIP_EXPIRED'] },
  { label: 'Payments', value: 'payments', types: ['PAYMENT_VERIFIED', 'PAYMENT_FAILED'] },
  { label: 'Trainers', value: 'trainers', types: ['TRAINER_ADDED'] },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Refresh when opening
  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) fetchNotifications();
  };

  // Filter logic
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    const group = FILTER_GROUPS.find(g => g.value === filter);
    if (group?.types) return group.types.includes(n.type);
    return true;
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) await markRead(notification._id);
    if (notification.link) navigate(notification.link);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 flex flex-col max-h-[600px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <CheckCheck size={13} />
                  All read
                </button>
              )}
              <button
                onClick={clearReadNotifications}
                title="Clear read notifications"
                className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 px-3 py-2 border-b border-slate-100 overflow-x-auto flex-shrink-0">
            {FILTER_GROUPS.map(g => (
              <button
                key={g.value}
                onClick={() => setFilter(g.value)}
                className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors font-medium
                  ${filter === g.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">
                  {filter === 'unread' ? 'All caught up! No unread notifications.' : 'No notifications yet.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const config = TYPE_CONFIG[n.type] || DEFAULT_CONFIG;
                const Icon = config.icon;
                return (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors group relative
                      ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
                  >
                    {/* Unread indicator */}
                    {!n.isRead && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    )}

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={config.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <div className="flex items-center gap-0.5 mt-1 text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>View details</span>
                          <ChevronRight size={10} />
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5 flex-shrink-0">
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="w-full text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1 hover:bg-indigo-50 py-1.5 rounded-xl transition-colors"
            >
              View all notifications
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
