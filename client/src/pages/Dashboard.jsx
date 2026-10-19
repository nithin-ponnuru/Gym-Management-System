import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, DollarSign, CreditCard, TrendingUp, Clock, AlertTriangle, Bell, XCircle
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import AttendanceChart from '../components/dashboard/AttendanceChart';
import { PageLoader } from '../components/common/Loader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [revenueByPlan, setRevenueByPlan] = useState([]);
  const [membersPerTrainer, setMembersPerTrainer] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [recentMembers, setRecentMembers] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [
          statsRes, revenueByPlanRes, membersPerTrainerRes,
          monthlyRevenueRes, dailyAttRes, recentMembersRes, recentAttRes
        ] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRevenueByPlan(),
          dashboardAPI.getMembersPerTrainer(),
          dashboardAPI.getMonthlyRevenue(),
          dashboardAPI.getDailyAttendance(),
          dashboardAPI.getRecentMembers(),
          dashboardAPI.getRecentAttendance(),
        ]);
        setStats(statsRes.data.data);
        setRevenueByPlan(revenueByPlanRes.data.data);
        setMembersPerTrainer(membersPerTrainerRes.data.data);
        setMonthlyRevenue(monthlyRevenueRes.data.data);
        setDailyAttendance(dailyAttRes.data.data);
        setRecentMembers(recentMembersRes.data.data);
        setRecentAttendance(recentAttRes.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <AlertTriangle className="mx-auto text-red-500 mb-3" size={36} />
      <p className="text-red-700 font-semibold text-lg">Failed to load dashboard</p>
      <p className="text-red-500 text-sm mt-1">{error}</p>
      <p className="text-slate-500 text-xs mt-3">Make sure the backend server is running on port 5000 and MongoDB is connected.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={stats?.totalMembers || 0}
          icon={Users}
          color="indigo"
          trendLabel="All registered members"
        />
        <StatCard
          title="Active Members"
          value={stats?.activeMembers || 0}
          icon={TrendingUp}
          color="emerald"
          trendLabel={`${stats?.inactiveMembers || 0} inactive`}
        />
        <StatCard
          title="Active Trainers"
          value={stats?.totalTrainers || 0}
          icon={UserCheck}
          color="violet"
          trendLabel="Current trainers"
        />
        <StatCard
          title="Total Revenue"
          value={stats?.totalRevenue || 0}
          icon={DollarSign}
          color="amber"
          prefix="&#8377;"
          trendLabel="All time revenue"
        />
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Memberships"
          value={stats?.activeMemberships || 0}
          icon={CreditCard}
          color="sky"
          trendLabel="Currently active plans"
        />
        <StatCard
          title="Expiring in 7 Days"
          value={stats?.expiringSoon || 0}
          icon={Clock}
          color="rose"
          trendLabel="Needs urgent renewal"
        />
        <StatCard
          title="Expired Memberships"
          value={stats?.expiredMemberships || 0}
          icon={XCircle}
          color="slate"
          trendLabel="Total expired plans"
        />
        <div
          onClick={() => navigate('/memberships')}
          className={`relative cursor-pointer rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md
            ${stats?.pendingRequests > 0
              ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
              : 'bg-white border-slate-100'}`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center
              ${stats?.pendingRequests > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <Bell size={22} className={stats?.pendingRequests > 0 ? 'text-amber-600' : 'text-slate-400'} />
            </div>
            {stats?.pendingRequests > 0 && (
              <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full font-bold animate-pulse">
                New!
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{stats?.pendingRequests || 0}</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">Pending Requests</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {stats?.pendingRequests > 0 ? 'Click to review' : 'No pending requests'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenueChart data={monthlyRevenue} />
        <AttendanceChart data={dailyAttendance} />
      </div>

      {/* Revenue by Plan + Members per Trainer */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">Revenue by Plan</h3>
          {revenueByPlan.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No revenue data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueByPlan} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `&#8377;${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="planName" type="category" tick={{ fontSize: 12 }} width={70} />
                <Tooltip formatter={(v) => [`&#8377;${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="totalRevenue" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">Members per Trainer</h3>
          <div className="space-y-3">
            {membersPerTrainer.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No trainer data available</p>
            ) : (
              membersPerTrainer.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                    {t.trainerName?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{t.trainerName}</span>
                      <span className="text-slate-500">{t.memberCount} members</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min((t.memberCount / (membersPerTrainer[0]?.memberCount || 1)) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Members + Recent Attendance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">Recent Members</h3>
          <div className="space-y-3">
            {recentMembers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No members yet</p>
            ) : (
              recentMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 truncate">{m.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0
                    ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">Recent Attendance</h3>
          <div className="space-y-3">
            {recentAttendance.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No attendance records yet</p>
            ) : (
              recentAttendance.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                    {a.memberId?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{a.memberId?.name}</p>
                    <p className="text-xs text-slate-400">
                      {a.checkInTime} &bull; {new Date(a.date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700 flex-shrink-0">
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
