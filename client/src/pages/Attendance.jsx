import { useState, useEffect, useCallback } from 'react';
import { UserCheck, Calendar, Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { attendanceAPI, memberAPI } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { TableSkeleton } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import FormField from '../components/common/FormField';

export default function Attendance() {
  const toast = useToast();
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Mark form state
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [marking, setMarking] = useState(false);

  // Filter state
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMember, setFilterMember] = useState('');
  const [page, setPage] = useState(1);

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (searchDate) params.date = searchDate;
      if (filterMember) params.memberId = filterMember;
      const res = await attendanceAPI.getAll(params);
      setAttendance(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchDate, filterMember, page]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  useEffect(() => {
    memberAPI.getAll({ status: 'Active', limit: 100 })
      .then(r => setMembers(r.data.data))
      .catch(() => {});
  }, []);

  const handleMarkAttendance = async () => {
    if (!selectedMember) {
      toast.error('Please select a member');
      return;
    }
    setMarking(true);
    try {
      await attendanceAPI.mark({
        memberId: selectedMember,
        date: selectedDate,
        checkInTime,
        status: 'Present',
      });
      toast.success('Attendance marked successfully');
      setSelectedMember('');
      setSearchDate(selectedDate);
      setPage(1);
      fetchAttendance();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMarking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await attendanceAPI.delete(deleteId);
      toast.success('Attendance record deleted');
      setDeleteId(null);
      fetchAttendance();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchDate('');
    setFilterMember('');
    setPage(1);
  };

  const todayPresent = attendance.filter(a => a.status === 'Present').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Attendance</h2>
        <p className="text-sm text-slate-500 mt-0.5">Track and manage daily member attendance</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Shown Records', value: pagination.total, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Present', value: todayPresent, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Total Members', value: members.length, color: 'bg-violet-50 text-violet-700' },
          {
            label: 'Attendance Rate',
            value: members.length > 0 ? `${Math.round((todayPresent / members.length) * 100)}%` : '0%',
            color: 'bg-amber-50 text-amber-700',
          },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mark Attendance Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-900 mb-4">Mark Attendance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <FormField label="Select Member">
            <select
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose member...</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.name} ({m.memberId})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Date">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>

          <FormField label="Check-in Time">
            <input
              type="time"
              value={checkInTime}
              onChange={e => setCheckInTime(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </FormField>

          <button
            onClick={handleMarkAttendance}
            disabled={marking || !selectedMember}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm disabled:opacity-60"
          >
            {marking ? (
              <span>Marking...</span>
            ) : (
              <><UserCheck size={18} /><span>Mark Present</span></>
            )}
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={searchDate}
                onChange={e => { setSearchDate(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterMember}
              onChange={e => { setFilterMember(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Members</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} /></div>
        ) : attendance.length === 0 ? (
          <EmptyState
            title="No attendance records"
            message="No records found. Mark attendance or adjust your filters."
            icon={UserCheck}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Member</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 hidden sm:table-cell">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 hidden md:table-cell">Check In</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 hidden md:table-cell">Check Out</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendance.map(a => (
                  <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                          {a.memberId?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{a.memberId?.name}</p>
                          <p className="text-xs text-slate-400">{a.memberId?.memberId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm text-slate-600">
                        {new Date(a.date).toLocaleDateString('en-IN', {
                          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        {a.checkInTime || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-600">{a.checkOutTime || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                        ${a.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setDeleteId(a._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">Total: {pagination.total} records</p>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-600 font-medium">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        message="Are you sure you want to delete this attendance record?"
        isLoading={deleting}
      />
    </div>
  );
}
