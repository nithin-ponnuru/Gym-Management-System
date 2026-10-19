import { Menu, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

const pageTitles = {
  '/dashboard':      { title: 'Dashboard',          subtitle: 'Welcome back, Admin' },
  '/members':        { title: 'Members',             subtitle: 'Manage your gym members' },
  '/trainers':       { title: 'Trainers',            subtitle: 'Manage your fitness trainers' },
  '/memberships':    { title: 'Memberships',         subtitle: 'Manage membership plans' },
  '/workouts':       { title: 'Workout Plans',       subtitle: 'Create and manage workout plans' },
  '/attendance':     { title: 'Attendance',          subtitle: 'Track daily attendance' },
  '/ai-assistant':   { title: 'AI Fitness Assistant', subtitle: 'Powered by OpenRouter AI' },
  '/notifications':  { title: 'Notifications',       subtitle: 'Real-time gym activity alerts' },
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pageInfo = pageTitles[location.pathname] || { title: 'FitPro', subtitle: '' };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">{pageInfo.title}</h1>
          <p className="text-xs text-slate-500 hidden sm:block">{pageInfo.subtitle}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Real notification bell — only rendered for admin */}
        <NotificationBell />

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2 ml-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
