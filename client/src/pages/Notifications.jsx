import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, UserPlus, CreditCard, AlertTriangle,
  DollarSign, Clock, UserCheck, Users, X, Filter, RefreshCw
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const TYPE_CONFIG = {
  NEW_MEMBER:            { icon: UserPlus,     color: 'text-emerald-600', bg: 'bg-emerald-50',  label: 'New Member',  badge: 'bg-emerald-100 text-emerald-700' },
  MEMBERSHIP_REQUEST:    { icon: CreditCard,   color: 'text-violet-600',  bg: 'bg-violet-50',   label: 'Request',     badge: 'bg-violet-100 text-violet-700' },
  MEMBERSHIP_APPROVED:   { icon: CheckCheck,   color: 'text-green-600',   bg: 'bg-green-50',    label: 'Approved',    badge: 'bg-green-100 text-green-700' },
  MEMBERSHIP_REJECTED:   { icon: X,            color: 'text-red-600',     bg: 'bg-red-50',      label: 'Rejected',    badge: 'bg-red-100 text-red-700' },
  MEMBERSHIP_CANCELLED:  { icon: X,            color: 'text-slate-600',   bg: 'bg-slate-100',   label: 'Cancelled',   badge: 'bg-slate-100 text-slate-700' },
  PAYMENT_VERIFIED:      { icon: DollarSign,   color: 'text-blue-600',    bg: 'bg-blue-50',     label: 'Payment',     badge: 'bg-blue-100 text-blue-700' },
  PAYMENT_FAILED:        { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50',      label: 'Failed',      badge: 'bg-red-100 text-red-700' },
  MEMBERSHIP_EXPIRING:   { icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',    label: 'Expiring',    badge: 'bg-amber-100 text-amber-700' },
  MEMBERSHIP_EXPIRED:    { icon: AlertTriangle, color: 'text-rose-600',   bg: 'bg-rose-50',     label: 'Expired',     badge: 'bg-rose-100 text-rose-700' },
  TRAINER_ADDED:         { icon: UserCheck,    color: 'text-indigo-600',  bg: 'bg-indigo-50',   label: 'Trainer',     badge: 'bg-indigo-100 text-indigo-700' },
  MEMBER_STATUS_CHANGED: { icon: Users,        color: 'text-slate-600',   bg: 'bg-slate-100',   label: 'Status',      badge: 'bg-slate-100 text-slate-700' },
};
const DEFAULT_CONFIG = { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Info', badge: 'bg-slate-100 text-slate-700' };

const PRIORITY_BADGE = {
  urgent: 'bg-red-100 text-red-700 border border-red-200',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-50 text-blue-600',
  low: 'bg-slate-100 text-slate-500',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'New Members', value: 'new_members', types: ['NEW_MEMBER', 'MEMBER_STATUS_CHANGED'] },
  { label: 'Requests', value: 'requests', types: ['MEMBERSHIP_REQUEST'] },
  { label: 'Approved', value: 'approved', types: ['MEMBERSHIP_APPROVED'] },
  { label: 'Expiring', value: 'expiring', types: ['MEMBERSHIP_EXPIRING', 'MEMBERSHIP_EXPIRED'] },
  { label: 'Payments', value: 'payments', types: ['PAYMENT_VERIFIED', 'PAYMENT_FAILED'] },
  { label: 'Trainers', value: 'trainers', types: ['TRAINER_ADDED'] },
];

export default function Notifications() {
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading,
    fetchNotifications, markRead, markAllRead,
    deleteNotification, clearReadNotifications,
  } = useNotifications();

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    const group = FILTER_OPTIONS.find(g => g.value === filter);
    if (group?.types) return group.types.includes(n.type);
    return true;
  });

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <Bell size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Notifications</h1>
              <p className="text-sm text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            <button
              onClick={clearReadNotifications}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Clear read
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors
              ${filter === f.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification Cards */}
      {loading && notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <Bell size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold">No notifications found</p>
          <p className="text-slate-400 text-sm mt-1">
            {filter !== 'all' ? 'Try a different filter' : 'Activity will appear here in real time'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const config = TYPE_CONFIG[n.type] || DEFAULT_CONFIG;
            const Icon = config.icon;
            return (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`bg-white rounded-2xl shadow-sm border cursor-pointer transition-all hover:shadow-md group
                  ${!n.isRead ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100'}`}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1">
                    {!n.isRead ? (
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center ring-2 ring-indigo-200`}>
                        <Icon size={18} className={config.color} />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center opacity-60`}>
                        <Icon size={18} className={config.color} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                          {config.label}
                        </span>
                        {n.priority && n.priority !== 'medium' && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${PRIORITY_BADGE[n.priority] || ''}`}>
                            {n.priority}
                          </span>
                        )}
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                    </div>

                    <h4 className={`text-sm font-semibold mt-1 ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                      {n.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>

                    {n.meta && Object.keys(n.meta).length > 0 && n.meta.memberName && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {n.meta.memberName && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                            👤 {n.meta.memberName}
                          </span>
                        )}
                        {n.meta.planName && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                            📋 {n.meta.planName}
                          </span>
                        )}
                        {n.meta.price && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                            ₹{Number(n.meta.price).toLocaleString('en-IN')}
                          </span>
                        )}
                        {n.meta.daysLeft !== undefined && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-semibold">
                            {n.meta.daysLeft === 0 ? 'Expires Today!' : `${n.meta.daysLeft} days left`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                        className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
