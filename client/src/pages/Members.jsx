import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Users, Phone, Mail, Calendar } from 'lucide-react';
import { memberAPI, trainerAPI } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchBar from '../components/common/SearchBar';
import { TableSkeleton } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import FormField, { Input, Select, Textarea } from '../components/common/FormField';

const INITIAL_FORM = {
  name: '', age: '', gender: 'Male', phone: '', email: '',
  address: '', trainerId: '', status: 'Active',
};

function MemberForm({ form, onChange, trainers, errors }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField label="Full Name" required error={errors?.name}>
        <Input
          value={form.name}
          onChange={e => onChange('name', e.target.value)}
          placeholder="e.g. Arjun Nair"
          error={errors?.name}
        />
      </FormField>
      <FormField label="Age" error={errors?.age}>
        <Input
          type="number"
          value={form.age}
          onChange={e => onChange('age', e.target.value)}
          placeholder="e.g. 28"
          min={5}
          max={120}
        />
      </FormField>
      <FormField label="Gender">
        <Select value={form.gender} onChange={e => onChange('gender', e.target.value)}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </Select>
      </FormField>
      <FormField label="Phone" required error={errors?.phone}>
        <Input
          value={form.phone}
          onChange={e => onChange('phone', e.target.value)}
          placeholder="e.g. 9876543210"
          error={errors?.phone}
        />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Email" required error={errors?.email}>
          <Input
            type="email"
            value={form.email}
            onChange={e => onChange('email', e.target.value)}
            placeholder="e.g. arjun@example.com"
            error={errors?.email}
          />
        </FormField>
      </div>
      <FormField label="Assign Trainer">
        <Select value={form.trainerId} onChange={e => onChange('trainerId', e.target.value)}>
          <option value="">No Trainer</option>
          {trainers.map(t => (
            <option key={t._id} value={t._id}>{t.name} &ndash; {t.specialization}</option>
          ))}
        </Select>
      </FormField>
      <FormField label="Status">
        <Select value={form.status} onChange={e => onChange('status', e.target.value)}>
          <option>Active</option>
          <option>Inactive</option>
        </Select>
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Address">
          <Textarea
            value={form.address}
            onChange={e => onChange('address', e.target.value)}
            placeholder="e.g. Mumbai, Maharashtra"
            rows={2}
          />
        </FormField>
      </div>
    </div>
  );
}

export default function Members() {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await memberAPI.getAll({
        search,
        status: filterStatus,
        trainerId: filterTrainer,
        page,
        limit: 10,
        sortBy: 'joinDate',
        sortOrder: 'desc',
      });
      setMembers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterTrainer, page]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    trainerAPI.getAll({ status: 'Active' })
      .then(r => setTrainers(r.data.data))
      .catch(() => {});
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAdd = () => {
    setForm(INITIAL_FORM);
    setEditingMember(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setForm({
      name: m.name || '',
      age: m.age || '',
      gender: m.gender || 'Male',
      phone: m.phone || '',
      email: m.email || '',
      address: m.address || '',
      trainerId: m.trainerId?._id || m.trainerId || '',
      status: m.status || 'Active',
    });
    setEditingMember(m);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        trainerId: form.trainerId || null,
      };
      if (editingMember) {
        await memberAPI.update(editingMember._id, payload);
        toast.success('Member updated successfully');
      } else {
        await memberAPI.create(payload);
        toast.success('Member added successfully');
      }
      setModalOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await memberAPI.delete(deleteId);
      toast.success('Member deleted successfully');
      setDeleteId(null);
      fetchMembers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Members</h2>
          <p className="text-sm text-slate-500 mt-0.5">{pagination.total} total members</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Plus size={18} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder="Search by name, email, phone..."
            className="flex-1"
          />
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            value={filterTrainer}
            onChange={e => { setFilterTrainer(e.target.value); setPage(1); }}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Trainers</option>
            {trainers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} /></div>
        ) : members.length === 0 ? (
          <EmptyState
            title="No members found"
            message="Add your first member to get started."
            icon={Users}
            action={
              <button
                onClick={openAdd}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
              >
                Add Member
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Member</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 hidden lg:table-cell">Trainer</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 hidden sm:table-cell">Join Date</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map(m => (
                  <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.memberId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />{m.phone}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail size={12} />{m.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-sm text-slate-600">{m.trainerId?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{m.trainerId?.specialization}</p>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(m.joinDate).toLocaleDateString('en-IN')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                        ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(m._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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
            <p className="text-sm text-slate-500">
              Showing {((page - 1) * 10) + 1}&ndash;{Math.min(page * 10, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors
                    ${page === p ? 'bg-indigo-600 text-white' : 'border border-slate-200 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? 'Edit Member' : 'Add New Member'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <MemberForm form={form} onChange={handleChange} trainers={trainers} errors={formErrors} />
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone."
        isLoading={deleting}
      />
    </div>
  );
}
