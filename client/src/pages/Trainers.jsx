import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, UserCheck, Star, Users, Phone, Mail, DollarSign } from 'lucide-react';
import { trainerAPI } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchBar from '../components/common/SearchBar';
import { PageLoader } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import FormField, { Input, Select, Textarea } from '../components/common/FormField';

const SPECIALIZATIONS = [
  'Weight Training', 'Cardio', 'Yoga', 'CrossFit', 'Personal Training',
  'Strength Training', 'Pilates', 'HIIT', 'Boxing', 'Swimming',
];

const INITIAL_FORM = {
  name: '', phone: '', email: '', specialization: 'Weight Training',
  experience: '', salary: '', status: 'Active', bio: '',
};

const SPEC_COLORS = {
  'Weight Training': 'bg-indigo-100 text-indigo-700',
  'Cardio': 'bg-rose-100 text-rose-700',
  'Yoga': 'bg-emerald-100 text-emerald-700',
  'CrossFit': 'bg-orange-100 text-orange-700',
  'Personal Training': 'bg-violet-100 text-violet-700',
  'Strength Training': 'bg-blue-100 text-blue-700',
  'Pilates': 'bg-pink-100 text-pink-700',
  'HIIT': 'bg-red-100 text-red-700',
  'Boxing': 'bg-yellow-100 text-yellow-700',
  'Swimming': 'bg-cyan-100 text-cyan-700',
};

function TrainerCard({ trainer, onEdit, onDelete }) {
  const specColor = SPEC_COLORS[trainer.specialization] || 'bg-slate-100 text-slate-600';
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {trainer.name?.[0]}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{trainer.name}</h3>
            <p className="text-xs text-slate-400">{trainer.trainerId}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(trainer)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => onDelete(trainer._id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${specColor}`}>
        {trainer.specialization}
      </span>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Star size={14} className="text-amber-500 flex-shrink-0" />
          <span>{trainer.experience} years experience</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users size={14} className="text-indigo-500 flex-shrink-0" />
          <span>{trainer.memberCount || 0} assigned members</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone size={14} className="text-slate-400 flex-shrink-0" />
          <span>{trainer.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Mail size={14} className="text-slate-400 flex-shrink-0" />
          <span className="truncate">{trainer.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <DollarSign size={14} className="text-emerald-500 flex-shrink-0" />
          <span>&#8377;{trainer.salary?.toLocaleString('en-IN')}/month</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0
          ${trainer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {trainer.status}
        </span>
        {trainer.bio && (
          <p className="text-xs text-slate-400 truncate">{trainer.bio}</p>
        )}
      </div>
    </div>
  );
}

export default function Trainers() {
  const toast = useToast();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTrainers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await trainerAPI.getAll({
        search,
        status: filterStatus,
        specialization: filterSpec,
      });
      setTrainers(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterSpec]);

  useEffect(() => { fetchTrainers(); }, [fetchTrainers]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (form.experience !== '' && Number(form.experience) < 0) errs.experience = 'Cannot be negative';
    if (form.salary !== '' && Number(form.salary) < 0) errs.salary = 'Cannot be negative';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAdd = () => {
    setForm(INITIAL_FORM);
    setEditingTrainer(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setForm({
      name: t.name, phone: t.phone, email: t.email,
      specialization: t.specialization, experience: t.experience,
      salary: t.salary, status: t.status, bio: t.bio || '',
    });
    setEditingTrainer(t);
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
        experience: Number(form.experience),
        salary: Number(form.salary),
      };
      if (editingTrainer) {
        await trainerAPI.update(editingTrainer._id, payload);
        toast.success('Trainer updated successfully');
      } else {
        await trainerAPI.create(payload);
        toast.success('Trainer added successfully');
      }
      setModalOpen(false);
      fetchTrainers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await trainerAPI.delete(deleteId);
      toast.success('Trainer deleted successfully');
      setDeleteId(null);
      fetchTrainers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Trainers</h2>
          <p className="text-sm text-slate-500 mt-0.5">{trainers.length} trainers on staff</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Plus size={18} />
          <span>Add Trainer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={v => setSearch(v)} placeholder="Search trainers..." className="flex-1" />
          <select
            value={filterSpec}
            onChange={e => setFilterSpec(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Specializations</option>
            {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 h-64 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(j => <div key={j} className="h-3 bg-slate-200 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      ) : trainers.length === 0 ? (
        <EmptyState
          title="No trainers found"
          message="Add your first trainer to get started."
          icon={UserCheck}
          action={
            <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
              Add Trainer
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map(t => (
            <TrainerCard key={t._id} trainer={t} onEdit={openEdit} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTrainer ? 'Edit Trainer' : 'Add New Trainer'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required error={formErrors.name}>
              <Input value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Rajesh Kumar" error={formErrors.name} />
            </FormField>
            <FormField label="Phone" required error={formErrors.phone}>
              <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="e.g. 9876543210" error={formErrors.phone} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Email" required error={formErrors.email}>
                <Input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="trainer@gym.com" error={formErrors.email} />
              </FormField>
            </div>
            <FormField label="Specialization">
              <Select value={form.specialization} onChange={e => handleChange('specialization', e.target.value)}>
                {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Experience (years)" error={formErrors.experience}>
              <Input type="number" value={form.experience} onChange={e => handleChange('experience', e.target.value)} min={0} placeholder="e.g. 5" />
            </FormField>
            <FormField label="Salary (&#8377;/month)" error={formErrors.salary}>
              <Input type="number" value={form.salary} onChange={e => handleChange('salary', e.target.value)} min={0} placeholder="e.g. 45000" />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={e => handleChange('status', e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
              </Select>
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Bio">
                <Textarea value={form.bio} onChange={e => handleChange('bio', e.target.value)} rows={2} placeholder="Brief description..." />
              </FormField>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm disabled:opacity-60">
              {submitting ? 'Saving...' : editingTrainer ? 'Update Trainer' : 'Add Trainer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Trainer"
        message="This will also unassign the trainer from all their members. Continue?"
        isLoading={deleting}
      />
    </div>
  );
}
