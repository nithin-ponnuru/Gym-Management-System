import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Trainers from './pages/Trainers';
import Memberships from './pages/Memberships';
import WorkoutPlans from './pages/WorkoutPlans';
import Attendance from './pages/Attendance';
import AIAssistant from './pages/AIAssistant';
import MemberDashboard from './pages/MemberDashboard';
import Notifications from './pages/Notifications';
import { PageLoader } from './components/common/Loader';

// Redirect to login if not authenticated
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Admin-only guard — redirects members to their dashboard
function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/member-dashboard" replace />;
  return children;
}

// Redirect to appropriate dashboard if already logged in
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />;
  if (user?.role === 'member') return <Navigate to="/member-dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login"  element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

            {/* Member portal — full page, no admin sidebar */}
            <Route
              path="/member-dashboard"
              element={<RequireAuth><MemberDashboard /></RequireAuth>}
            />

            {/* Admin portal — protected with layout */}
            <Route element={<RequireAdmin><MainLayout /></RequireAdmin>}>
              <Route path="/dashboard"     element={<Dashboard />} />
              <Route path="/members"       element={<Members />} />
              <Route path="/trainers"      element={<Trainers />} />
              <Route path="/memberships"   element={<Memberships />} />
              <Route path="/workouts"      element={<WorkoutPlans />} />
              <Route path="/attendance"    element={<Attendance />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/ai-assistant"  element={<AIAssistant />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}
