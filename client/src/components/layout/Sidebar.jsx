import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, CreditCard, Dumbbell,
  ClipboardList, Bot, ChevronLeft, ChevronRight, Zap, X, Bell,
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const navItems = [
  { path: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/members',       icon: Users,           label: 'Members' },
  { path: '/trainers',      icon: UserCheck,       label: 'Trainers' },
  { path: '/memberships',   icon: CreditCard,      label: 'Memberships' },
  { path: '/workouts',      icon: Dumbbell,        label: 'Workout Plans' },
  { path: '/attendance',    icon: ClipboardList,   label: 'Attendance' },
  { path: '/notifications', icon: Bell,            label: 'Notifications', badge: true },
  { path: '/ai-assistant',  icon: Bot,             label: 'AI Assistant' },
];

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const { unreadCount } = useNotifications();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-slate-900 text-white transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 min-h-[64px]">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm flex-shrink-0">
                <img src="/logo.png" alt="FitPro" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">FitPro</p>
                <p className="text-xs text-slate-400">Management</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto p-1 shadow-sm">
              <img src="/logo.png" alt="FitPro" className="w-6 h-6 object-contain" />
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navItems.map(({ path, icon: Icon, label, badge }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative
                  ${isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}`
                }
              >
                <div className="relative flex-shrink-0">
                  <Icon size={20} />
                  {badge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && <span className="text-sm font-medium flex-1">{label}</span>}
                {!collapsed && badge && unreadCount > 0 && (
                  <span className="ml-auto text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-xs rounded
                    opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 hidden lg:block">
                    {label}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-3">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-slate-400 truncate">admin@gymfit.com</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold mx-auto">
              A
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center absolute -right-3 top-20
            w-6 h-6 bg-slate-700 border border-slate-600 rounded-full text-slate-400
            hover:text-white hover:bg-indigo-600 transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}
