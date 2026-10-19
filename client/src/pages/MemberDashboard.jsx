import { useState, useEffect, useCallback } from 'react';
import {
  User, CreditCard, Clock, Dumbbell, Calendar, CheckCircle,
  XCircle, LogOut, ChevronDown, ChevronUp, Phone, Mail, MapPin,
  LayoutDashboard, History, Star, Edit2, Save, X, AlertTriangle,
  TrendingUp, Bell
} from 'lucide-react';
import { memberDataAPI, membershipAPI, membershipRequestAPI, attendanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from '../components/common/Loader';
import { useToast } from '../components/common/Toast';

// ── Helpers ────────────────────────────────────────────────────────────────
function daysLeft(expiryDate) {
  return Math.max(0, Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)));
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_STYLES = {
  Active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Expired: 'bg-red-100 text-red-700 border border-red-200',
  Cancelled: 'bg-slate-100 text-slate-600 border border-slate-200',
  Upcoming: 'bg-blue-100 text-blue-700 border border-blue-200',
  'Pending Payment': 'bg-amber-100 text-amber-700 border border-amber-200',
};

const PAYMENT_STYLES = {
  Paid: 'text-emerald-600',
  Pending: 'text-amber-600',
  Partial: 'text-blue-600',
  Failed: 'text-red-600',
};

const PLAN_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-violet-500 to-purple-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-700',
  'from-emerald-500 to-teal-600',
];

// ── Sub-components ─────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label, color = 'text-indigo-600' }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function NavTab({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
        ${active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
          : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
      <Icon size={16} />
      {label}
      {badge > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
          ${active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MemberDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [membershipHistory, setMembershipHistory] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [alreadyMarkedToday, setAlreadyMarkedToday] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [thisMonthCount, setThisMonthCount] = useState(0);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ address: '', phone: '', age: '', gender: 'Male' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Request state
  const [requestingPlan, setRequestingPlan] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, activeMRes, historyRes, attendanceRes, workoutRes, plansRes, requestsRes] = await Promise.all([
        memberDataAPI.getProfile(),
        memberDataAPI.getActiveMembership(),
        memberDataAPI.getMembershipHistory(),
        memberDataAPI.getAttendance({ limit: 50 }),
        memberDataAPI.getWorkout(),
        membershipAPI.getAll(),
        membershipRequestAPI.getAll(),
      ]);

      setProfile(profileRes.data.data);
      setActiveMembership(activeMRes.data.data);
      setMembershipHistory(historyRes.data.data);
      setAvailablePlans(plansRes.data.data);
      setMyRequests(requestsRes.data.data);

      const att = attendanceRes.data.data;
      setAttendance(att);

      // Today check
      const todayUTC = new Date().toISOString().split('T')[0];
      const todayRecord = att.find(a => new Date(a.date).toISOString().split('T')[0] === todayUTC);
      setAlreadyMarkedToday(!!todayRecord);

      // This month count
      const now = new Date();
      const thisMonth = att.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      setThisMonthCount(thisMonth.length);

      setWorkout(workoutRes.data.data);

      // Set profile form defaults
      const p = profileRes.data.data;
      setProfileForm({ address: p.address || '', phone: p.phone || '', age: p.age || '', gender: p.gender || 'Male' });
    } catch (err) {
      toast.error('Failed to load dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Mark attendance
  const handleMarkAttendance = async () => {
    if (!activeMembership || activeMembership.status !== 'Active') {
      toast.error('You need an active membership to mark attendance. Please contact the gym admin.');
      return;
    }
    setMarkingAttendance(true);
    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      await attendanceAPI.mark({
        memberId: user._id,
        date: todayStr,
        checkInTime: timeStr,
        status: 'Present',
      });

      toast.success('Attendance marked! Have a great workout! 💪');
      setAlreadyMarkedToday(true);
      setThisMonthCount(c => c + 1);

      const res = await memberDataAPI.getAttendance({ limit: 50 });
      setAttendance(res.data.data);
    } catch (err) {
      if (err.message.includes('already marked')) {
        setAlreadyMarkedToday(true);
        toast.error('Attendance already marked for today');
      } else if (err.message.includes('active membership')) {
        toast.error('You need an active membership to mark attendance');
      } else {
        toast.error(err.message);
      }
    } finally {
      setMarkingAttendance(false);
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await memberDataAPI.updateProfile(profileForm);
      setProfile(res.data.data);
      setEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Request membership
  const handleRequestMembership = async (plan) => {
    if (activeMembership && activeMembership.status === 'Active') {
      const confirm = window.confirm(
        `You already have an active ${activeMembership.membershipId?.planName || 'membership'}. Do you want to request a renewal/upgrade for "${plan.planName}"?`
      );
      if (!confirm) return;
    }

    setRequestingPlan(plan);
  };

  const submitRequest = async () => {
    if (!requestingPlan) return;
    setSubmittingRequest(true);
    try {
      const hasActive = activeMembership && activeMembership.status === 'Active';
      await membershipRequestAPI.create({
        membershipId: requestingPlan._id,
        message: requestMessage,
        requestType: hasActive ? 'Renewal' : 'New',
      });
      toast.success('Membership request submitted! The gym admin will review it.');
      setRequestingPlan(null);
      setRequestMessage('');
      // Refresh requests
      const res = await membershipRequestAPI.getAll();
      setMyRequests(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) return <PageLoader />;

  const days = activeMembership ? daysLeft(activeMembership.expiryDate) : 0;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const attendancePct = Math.round((thisMonthCount / daysInMonth) * 100);
  const pendingRequests = myRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center p-1 shadow-sm flex-shrink-0">
              <img src="/logo.png" alt="FitPro" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-none">FitPro</h1>
              <p className="text-xs text-slate-400">Member Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeMembership?.status === 'Active' && days <= 7 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full">
                <Bell size={12} />
                Membership expires in {days} day{days !== 1 ? 's' : ''}
              </div>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{profile?.name}</p>
              <p className="text-xs text-slate-400">{profile?.memberId}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Welcome + Mark Attendance */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm">Welcome back,</p>
            <h2 className="text-2xl font-black mt-0.5">{profile?.name}</h2>
            <p className="text-indigo-200 text-sm mt-1">
              {profile?.memberId} · Joined {fmtDate(profile?.joinDate)}
            </p>
            {activeMembership?.status === 'Active' && days <= 7 && (
              <p className="text-amber-300 text-xs mt-2 font-medium">
                ⚠️ Your membership expires in {days} day{days !== 1 ? 's' : ''}!
              </p>
            )}
          </div>
          <button
            onClick={handleMarkAttendance}
            disabled={alreadyMarkedToday || markingAttendance || !activeMembership || activeMembership.status !== 'Active'}
            className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all
              ${alreadyMarkedToday
                ? 'bg-white/20 text-white/60 cursor-not-allowed'
                : (!activeMembership || activeMembership.status !== 'Active')
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg'
              }`}
          >
            {markingAttendance ? (
              <span>Marking...</span>
            ) : alreadyMarkedToday ? (
              <><CheckCircle size={16} /> Already Checked In</>
            ) : !activeMembership || activeMembership.status !== 'Active' ? (
              <><XCircle size={16} /> No Active Plan</>
            ) : (
              <><CheckCircle size={16} /> Mark Today's Attendance</>
            )}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <NavTab active={tab === 'overview'} onClick={() => setTab('overview')} icon={LayoutDashboard} label="Overview" />
          <NavTab active={tab === 'membership'} onClick={() => setTab('membership')} icon={CreditCard} label="My Membership" />
          <NavTab active={tab === 'plans'} onClick={() => setTab('plans')} icon={Star} label="Plans" badge={pendingRequests} />
          <NavTab active={tab === 'history'} onClick={() => setTab('history')} icon={History} label="History" />
          <NavTab active={tab === 'profile'} onClick={() => setTab('profile')} icon={User} label="My Profile" />
        </div>

        {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left column */}
            <div className="space-y-5">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard value={thisMonthCount} label="This Month" color="text-indigo-600" />
                <StatCard value={`${attendancePct}%`} label="Attendance Rate" color="text-emerald-600" />
                <StatCard value={attendance.length} label="Total Visits" color="text-violet-600" />
                <StatCard
                  value={activeMembership?.status === 'Active' ? `${days}d` : '—'}
                  label="Days Remaining"
                  color={days < 7 ? 'text-red-600' : 'text-amber-600'}
                />
              </div>

              {/* Profile mini card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <User size={16} className="text-indigo-500" /> My Profile
                </h3>
                <div className="space-y-3">
                  <InfoRow icon={Mail} label="Email" value={profile?.email} />
                  <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
                  {profile?.age && <InfoRow icon={User} label="Age" value={`${profile.age} years · ${profile.gender}`} />}
                  <InfoRow icon={MapPin} label="Address" value={profile?.address} />
                </div>
                {profile?.trainerId && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2">My Trainer</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {profile.trainerId.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{profile.trainerId.name}</p>
                        <p className="text-xs text-slate-400">{profile.trainerId.specialization}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Current Membership */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-200 text-xs">Current Plan</p>
                      <h3 className="text-white font-bold text-lg">
                        {activeMembership
                          ? (activeMembership.membershipId?.planName || activeMembership.planSnapshot?.planName || 'Active Plan')
                          : 'No Active Plan'}
                      </h3>
                    </div>
                    {activeMembership ? (
                      <span className={`text-xs px-3 py-1.5 rounded-full font-bold
                        ${STATUS_STYLES[activeMembership.status] || 'bg-white/20 text-white'}`}>
                        {activeMembership.status}
                      </span>
                    ) : (
                      <CreditCard size={28} className="text-white/40" />
                    )}
                  </div>
                </div>

                {activeMembership ? (
                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Start Date</p>
                        <p className="text-sm font-semibold text-slate-800">{fmtDate(activeMembership.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Expiry Date</p>
                        <p className="text-sm font-semibold text-slate-800">{fmtDate(activeMembership.expiryDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Days Remaining</p>
                        <p className={`text-sm font-bold ${days < 15 ? 'text-red-600' : 'text-slate-800'}`}>
                          {activeMembership.status === 'Active' ? `${days} days` : activeMembership.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Amount Paid</p>
                        <p className="text-sm font-semibold text-slate-800">₹{activeMembership.amountPaid?.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Payment</p>
                        <p className={`text-sm font-semibold ${PAYMENT_STYLES[activeMembership.paymentStatus] || ''}`}>
                          {activeMembership.paymentStatus}
                        </p>
                      </div>
                      {activeMembership.paymentMethod && (
                        <div>
                          <p className="text-xs text-slate-400">Payment Method</p>
                          <p className="text-sm font-semibold text-slate-800">{activeMembership.paymentMethod}</p>
                        </div>
                      )}
                    </div>
                    {activeMembership.status === 'Active' && days <= 7 && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                          Your membership expires in <strong>{days} days</strong>. Contact the gym admin to renew.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <XCircle size={40} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-medium text-slate-500">No active membership</p>
                    <p className="text-xs text-slate-400 mt-1">Contact the gym admin or browse available plans.</p>
                    <button
                      onClick={() => setTab('plans')}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Browse Plans
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Attendance */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Calendar size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Recent Attendance</h3>
                    <p className="text-xs text-slate-400">Last {Math.min(attendance.length, 10)} check-ins</p>
                  </div>
                </div>
                {attendance.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No attendance records yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {attendance.slice(0, 10).map((a, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${a.status === 'Present' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            {a.checkInTime && <p className="text-xs text-slate-400">Check-in: {a.checkInTime}</p>}
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                          ${a.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MEMBERSHIP TAB ─────────────────────────────────────────────── */}
        {tab === 'membership' && (
          <div className="space-y-5">
            {activeMembership ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-indigo-200 text-sm">Current Membership</p>
                      <h2 className="text-2xl font-black mt-1">
                        {activeMembership.membershipId?.planName || activeMembership.planSnapshot?.planName}
                      </h2>
                      <p className="text-indigo-200 text-sm mt-1">
                        ₹{(activeMembership.membershipId?.price || activeMembership.planSnapshot?.price || 0).toLocaleString('en-IN')}
                        {' '}/{' '}
                        {activeMembership.membershipId?.durationMonths || activeMembership.planSnapshot?.durationMonths} month(s)
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold text-white
                      ${activeMembership.status === 'Active' ? 'bg-emerald-500' :
                        activeMembership.status === 'Upcoming' ? 'bg-blue-500' :
                        activeMembership.status === 'Pending Payment' ? 'bg-amber-500' :
                        'bg-slate-500'}`}>
                      {activeMembership.status}
                    </span>
                  </div>

                  {activeMembership.status === 'Active' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-indigo-200 mb-1.5">
                        <span>{fmtDate(activeMembership.startDate)}</span>
                        <span>{days} days left</span>
                        <span>{fmtDate(activeMembership.expiryDate)}</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all"
                          style={{
                            width: `${Math.max(2, Math.min(100, 100 - (days / ((activeMembership.membershipId?.durationMonths || 1) * 30)) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6">
                    {[
                      ['Start Date', fmtDate(activeMembership.startDate)],
                      ['Expiry Date', fmtDate(activeMembership.expiryDate)],
                      ['Days Remaining', activeMembership.status === 'Active' ? `${days} days` : activeMembership.status],
                      ['Amount Paid', `₹${activeMembership.amountPaid?.toLocaleString('en-IN')}`],
                      ['Payment Status', activeMembership.paymentStatus],
                      ['Payment Method', activeMembership.paymentMethod || '—'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className={`text-sm font-semibold mt-0.5
                          ${label === 'Payment Status' ? (PAYMENT_STYLES[value] || 'text-slate-800') : 'text-slate-800'}`}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {activeMembership.transactionRef && (
                    <div className="bg-slate-50 rounded-xl p-3 text-sm mb-5">
                      <span className="text-slate-400">Transaction Ref: </span>
                      <span className="font-medium text-slate-700">{activeMembership.transactionRef}</span>
                    </div>
                  )}

                  {/* Plan features */}
                  {(activeMembership.membershipId?.features || activeMembership.planSnapshot?.features)?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-3">Plan Features</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(activeMembership.membershipId?.features || activeMembership.planSnapshot?.features || []).map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeMembership.status === 'Active' && days <= 7 && (
                    <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Membership Expiring Soon</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Your membership expires in <strong>{days} days</strong>. Contact the gym admin for renewal or browse plans below.
                        </p>
                        <button
                          onClick={() => setTab('plans')}
                          className="mt-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors"
                        >
                          Browse Renewal Plans
                        </button>
                      </div>
                    </div>
                  )}

                  {activeMembership.status === 'Pending Payment' && (
                    <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-amber-800">Payment Pending</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Your membership is pending payment. Please contact the gym admin to complete the payment.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
                <CreditCard size={48} className="mx-auto mb-4 text-slate-200" />
                <h3 className="text-lg font-bold text-slate-700">No Active Membership</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                  You don't have an active membership yet. Browse available plans and request one, or contact the gym admin.
                </p>
                <button
                  onClick={() => setTab('plans')}
                  className="mt-5 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Browse Plans
                </button>
              </div>
            )}

            {/* My Requests */}
            {myRequests.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">My Membership Requests</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {myRequests.map(req => (
                    <div key={req._id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {req.membershipId?.planName}
                          <span className="ml-2 text-xs text-slate-400">({req.requestType})</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Preferred start: {fmtDate(req.preferredStartDate)} · Submitted: {fmtDate(req.createdAt)}
                        </p>
                        {req.adminNote && (
                          <p className="text-xs text-slate-500 mt-1 italic">Admin: "{req.adminNote}"</p>
                        )}
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0
                        ${req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'}`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PLANS TAB ──────────────────────────────────────────────────── */}
        {tab === 'plans' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Available Membership Plans</h3>
              <p className="text-sm text-slate-400 mt-1">Choose a plan and request membership. The admin will review and activate it.</p>
            </div>

            {availablePlans.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
                <Star size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-500">No membership plans available. Please contact the gym admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {availablePlans.map((plan, idx) => {
                  const myPendingRequest = myRequests.find(r => r.membershipId?._id === plan._id && r.status === 'Pending');
                  const isCurrentPlan = activeMembership?.membershipId?._id === plan._id && activeMembership?.status === 'Active';

                  return (
                    <div key={plan._id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all
                      ${isCurrentPlan ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-slate-100'}`}>
                      {/* Badges */}
                      <div className="relative">
                        <div className={`bg-gradient-to-br ${PLAN_GRADIENTS[idx % PLAN_GRADIENTS.length]} p-5 text-white`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold">{plan.planName}</h3>
                              <div className="flex items-baseline gap-1 mt-1">
                                <p className="text-3xl font-black">₹{plan.price.toLocaleString('en-IN')}</p>
                              </div>
                              <p className="text-white/70 text-sm mt-1">
                                {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
                                {plan.durationMonths > 1 && (
                                  <span className="ml-1 text-white/50">
                                    · ₹{Math.round(plan.price / plan.durationMonths).toLocaleString('en-IN')}/mo
                                  </span>
                                )}
                              </p>
                              {plan.discountPercent > 0 && (
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-2 inline-block">
                                  {plan.discountPercent}% off — {plan.discountNote}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {plan.isBestValue && (
                                <span className="text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold">Best Value</span>
                              )}
                              {plan.isPopular && (
                                <span className="text-xs bg-rose-400 text-white px-2 py-0.5 rounded-full font-bold">Popular</span>
                              )}
                              {plan.badge && !plan.isBestValue && !plan.isPopular && (
                                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">{plan.badge}</span>
                              )}
                              {isCurrentPlan && (
                                <span className="text-xs bg-emerald-400 text-white px-2 py-0.5 rounded-full font-bold">Current</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        {plan.description && (
                          <p className="text-xs text-slate-500 mb-3">{plan.description}</p>
                        )}
                        <ul className="space-y-1.5 mb-5">
                          {(plan.features || []).map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {myPendingRequest ? (
                          <div className="w-full py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-medium text-center">
                            ⏳ Request Pending Review
                          </div>
                        ) : isCurrentPlan ? (
                          <div className="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium text-center flex items-center justify-center gap-1">
                            <CheckCircle size={13} /> Your Current Plan
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRequestMembership(plan)}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                          >
                            {activeMembership?.status === 'Active' ? 'Request Renewal / Upgrade' : 'Request Membership'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* My pending requests status */}
            {myRequests.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h4 className="font-semibold text-slate-800">My Requests</h4>
                </div>
                <div className="divide-y divide-slate-50">
                  {myRequests.slice(0, 5).map(req => (
                    <div key={req._id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{req.membershipId?.planName} — {req.requestType}</p>
                        <p className="text-xs text-slate-400">{fmtDate(req.createdAt)}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                        ${req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'}`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ────────────────────────────────────────────────── */}
        {tab === 'history' && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-800">Membership History</h3>
            {membershipHistory.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
                <History size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="text-slate-500">No membership history yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {membershipHistory.map((m, i) => (
                  <div key={m._id} className={`bg-white rounded-2xl shadow-sm border p-5
                    ${m.status === 'Active' ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-800">
                            {m.membershipId?.planName || m.planSnapshot?.planName}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[m.status] || ''}`}>
                            {m.status}
                          </span>
                          {i === 0 && m.status === 'Active' && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-slate-400">Start Date</p>
                            <p className="text-sm font-medium text-slate-700">{fmtDate(m.startDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Expiry Date</p>
                            <p className="text-sm font-medium text-slate-700">{fmtDate(m.expiryDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Amount Paid</p>
                            <p className="text-sm font-medium text-slate-700">₹{m.amountPaid?.toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Payment</p>
                            <p className={`text-sm font-medium ${PAYMENT_STYLES[m.paymentStatus] || 'text-slate-700'}`}>
                              {m.paymentStatus}
                            </p>
                          </div>
                        </div>
                        {m.cancelReason && (
                          <p className="text-xs text-red-500 mt-2">Cancelled: {m.cancelReason}</p>
                        )}
                        {m.renewedFrom && (
                          <p className="text-xs text-slate-400 mt-1">🔄 This is a renewal</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full Attendance History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h4 className="font-bold text-slate-800">Full Attendance History</h4>
                <p className="text-xs text-slate-400 mt-0.5">{attendance.length} total records</p>
              </div>
              {attendance.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No attendance records.</div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                  {attendance.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'Present' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {a.checkInTime && <p className="text-xs text-slate-400">Check-in: {a.checkInTime}</p>}
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                        ${a.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROFILE TAB ────────────────────────────────────────────────── */}
        {tab === 'profile' && (
          <div className="max-w-2xl space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                  {profile?.name?.[0]?.toUpperCase()}
                </div>
                <div className="text-white">
                  <h3 className="text-xl font-black">{profile?.name}</h3>
                  <p className="text-indigo-200 text-sm">{profile?.memberId}</p>
                  <p className="text-indigo-200 text-sm">{profile?.email}</p>
                </div>
              </div>

              <div className="p-6">
                {!editingProfile ? (
                  <>
                    <div className="grid grid-cols-2 gap-5 mb-6">
                      {[
                        ['Full Name', profile?.name],
                        ['Member ID', profile?.memberId],
                        ['Email', profile?.email],
                        ['Phone', profile?.phone],
                        ['Age', profile?.age ? `${profile.age} years` : '—'],
                        ['Gender', profile?.gender || '—'],
                        ['Address', profile?.address || '—'],
                        ['Joined', fmtDate(profile?.joinDate)],
                        ['Status', profile?.status],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-xs text-slate-400">{label}</p>
                          <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</p>
                        </div>
                      ))}
                    </div>

                    {profile?.trainerId && (
                      <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold">
                          {profile.trainerId.name?.[0]}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Assigned Trainer</p>
                          <p className="font-semibold text-slate-800">{profile.trainerId.name}</p>
                          <p className="text-xs text-slate-500">{profile.trainerId.specialization}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setEditingProfile(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <Edit2 size={15} /> Edit Profile
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                      You can update your phone, address, age, and gender. Email and Member ID cannot be changed.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
                        <input
                          value={profileForm.phone}
                          onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Age</label>
                        <input
                          type="number"
                          value={profileForm.age}
                          onChange={e => setProfileForm(p => ({ ...p, age: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Gender</label>
                        <select
                          value={profileForm.gender}
                          onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Address</label>
                      <textarea
                        value={profileForm.address}
                        onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        <X size={15} /> Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                      >
                        <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Request Membership Modal */}
      {requestingPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Request Membership</h3>
                <p className="text-sm text-slate-500">{requestingPlan.planName} — ₹{requestingPlan.price.toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setRequestingPlan(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 mb-4 text-sm">
              <p className="font-medium text-indigo-800">{requestingPlan.planName}</p>
              <p className="text-indigo-600 text-xs mt-1">{requestingPlan.durationMonths} month(s) · ₹{requestingPlan.price.toLocaleString('en-IN')}</p>
              {requestingPlan.description && <p className="text-indigo-600 text-xs mt-1">{requestingPlan.description}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Message to Admin (optional)</label>
              <textarea
                value={requestMessage}
                onChange={e => setRequestMessage(e.target.value)}
                placeholder="Any special requirements or notes..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <p className="text-xs text-slate-400 mb-5">
              Your request will be reviewed by the gym admin. Once approved, your membership will be activated.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setRequestingPlan(null); setRequestMessage(''); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitRequest}
                disabled={submittingRequest}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm disabled:opacity-60"
              >
                {submittingRequest ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
