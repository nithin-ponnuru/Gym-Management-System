import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Dumbbell, ChevronDown, ChevronUp, X } from 'lucide-react';
import { workoutAPI, trainerAPI } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchBar from '../components/common/SearchBar';
import { PageLoader } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import FormField, { Input, Select, Textarea } from '../components/common/FormField';

const GOALS = [
  'Weight Loss', 'Muscle Gain', 'Strength', 'Endurance',
  'General Fitness', 'Flexibility', 'Athletic Performance',
];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const GOAL_COLORS = {
  'Weight Loss': 'bg-rose-100 text-rose-700',
  'Muscle Gain': 'bg-indigo-100 text-indigo-700',
  'Strength': 'bg-slate-100 text-slate-700',
  'Endurance': 'bg-emerald-100 text-emerald-700',
  'General Fitness': 'bg-blue-100 text-blue-700',
  'Flexibility': 'bg-violet-100 text-violet-700',
  'Athletic Performance': 'bg-orange-100 text-orange-700',
};

const DIFF_COLORS = {
  'Beginner': 'bg-emerald-100 text-emerald-700',
  'Intermediate': 'bg-amber-100 text-amber-700',
  'Advanced': 'bg-red-100 text-red-700',
};

const EMPTY_EXERCISE = { name: '', sets: 3, reps: 10, restSeconds: 60, notes: '' };

const INITIAL_FORM = {
  planName: '', goal: 'Muscle Gain', durationWeeks: 8,
  trainerId: '', difficulty: 'Intermediate', description: '',
  exercises: [{ ...EMPTY_EXERCISE }],
};

function ExerciseRow({ exercise, index, onChange, onRemove, isOnly }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="col-span-12 sm:col-span-4">
        <Input
          value={exercise.name}
          onChange={e => onChange(index, 'name', e.target.value)}
          placeholder="Exercise name"
          className="text-sm"
        />
      </div>
      <div className="col-span-3 sm:col-span-2">
        <Input
          type="number"
          value={exercise.sets}
          onChange={e => onChange(index, 'sets', e.target.value)}
          min={1}
          placeholder="Sets"
          className="text-sm text-center"
        />
      </div>
      <div className="col-span-3 sm:col-span-2">
        <Input
          type="number"
          value={exercise.reps}
          onChange={e => onChange(index, 'reps', e.target.value)}
          min={1}
          placeholder="Reps"
          className="text-sm text-center"
        />
      </div>
      <div className="col-span-3 sm:col-span-2">
        <Input
          type="number"
          value={exercise.restSeconds}
          onChange={e => onChange(index, 'restSeconds', e.target.value)}
          min={0}
          placeholder="Rest (s)"
          className="text-sm text-center"
        />
      </div>
      <div className="col-span-3 sm:col-span-2 flex items-center justify-center">
        {!isOnly && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function WorkoutCard({ plan, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const goalColor = GOAL_COLORS[plan.goal] || 'bg-slate-100 text-slate-700';
  const diffColor = DIFF_COLORS[plan.difficulty] || 'bg-slate-100 text-slate-600';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-slate-900 text-lg truncate">{plan.planName}</h3>
            <p className="text-sm text-slate-400">{plan.trainerId?.name || 'No trainer assigned'}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(plan)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(plan._id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${goalColor}`}>{plan.goal}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${diffColor}`}>{plan.difficulty}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-lg font-bold text-slate-900">{plan.durationWeeks}</p>
            <p className="text-xs text-slate-400">Weeks</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-lg font-bold text-slate-900">{plan.exercises?.length || 0}</p>
            <p className="text-xs text-slate-400">Exercises</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-lg font-bold text-slate-900">
              {plan.exercises?.reduce((s, e) => s + (Number(e.sets) || 0), 0)}
            </p>
            <p className="text-xs text-slate-400">Total Sets</p>
          </div>
        </div>

        {plan.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{plan.description}</p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Hide exercises' : `View ${plan.exercises?.length || 0} exercises`}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-400 uppercase px-2 mb-2">
              <span className="col-span-1">Exercise</span>
              <span className="text-center">Sets</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Rest</span>
            </div>
            {plan.exercises?.map((ex, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 text-sm bg-white rounded-lg px-3 py-2 border border-slate-100">
                <span className="font-medium text-slate-700 col-span-1 truncate">{ex.name}</span>
                <span className="text-center text-slate-600">{ex.sets}</span>
                <span className="text-center text-slate-600">{ex.reps}</span>
                <span className="text-center text-slate-600">{ex.restSeconds}s</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutPlans() {
  const toast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGoal, setFilterGoal] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workoutAPI.getAll({ search, goal: filterGoal });
      setWorkouts(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterGoal]);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  useEffect(() => {
    trainerAPI.getAll({ status: 'Active' })
      .then(r => setTrainers(r.data.data))
      .catch(() => {});
  }, []);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleExerciseChange = (idx, field, value) => {
    setForm(prev => {
      const exercises = [...prev.exercises];
      exercises[idx] = { ...exercises[idx], [field]: value };
      return { ...prev, exercises };
    });
  };

  const addExercise = () => setForm(prev => ({
    ...prev, exercises: [...prev.exercises, { ...EMPTY_EXERCISE }]
  }));

  const removeExercise = (idx) => setForm(prev => ({
    ...prev, exercises: prev.exercises.filter((_, i) => i !== idx)
  }));

  const openAdd = () => {
    setForm(INITIAL_FORM);
    setEditingWorkout(null);
    setModalOpen(true);
  };

  const openEdit = (w) => {
    setForm({
      planName: w.planName,
      goal: w.goal,
      durationWeeks: w.durationWeeks,
      trainerId: w.trainerId?._id || '',
      difficulty: w.difficulty || 'Intermediate',
      description: w.description || '',
      exercises: w.exercises?.length
        ? w.exercises.map(e => ({
            name: e.name, sets: e.sets, reps: e.reps,
            restSeconds: e.restSeconds, notes: e.notes || '',
          }))
        : [{ ...EMPTY_EXERCISE }],
    });
    setEditingWorkout(w);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.planName.trim()) { toast.error('Plan name is required'); return; }
    if (form.exercises.some(ex => !ex.name.trim())) {
      toast.error('All exercises must have a name');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        durationWeeks: Number(form.durationWeeks),
        trainerId: form.trainerId || null,
        exercises: form.exercises.map(ex => ({
          ...ex,
          sets: Number(ex.sets),
          reps: Number(ex.reps),
          restSeconds: Number(ex.restSeconds),
        })),
      };
      if (editingWorkout) {
        await workoutAPI.update(editingWorkout._id, payload);
        toast.success('Workout plan updated');
      } else {
        await workoutAPI.create(payload);
        toast.success('Workout plan created');
      }
      setModalOpen(false);
      fetchWorkouts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await workoutAPI.delete(deleteId);
      toast.success('Workout plan deleted');
      setDeleteId(null);
      fetchWorkouts();
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
          <h2 className="text-2xl font-bold text-slate-900">Workout Plans</h2>
          <p className="text-sm text-slate-500 mt-0.5">{workouts.length} plans available</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Plus size={18} />
          <span>New Plan</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search workout plans..." className="flex-1" />
          <select
            value={filterGoal}
            onChange={e => setFilterGoal(e.target.value)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Goals</option>
            {GOALS.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : workouts.length === 0 ? (
        <EmptyState
          title="No workout plans"
          message="Create your first workout plan to get started."
          icon={Dumbbell}
          action={
            <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
              Create Plan
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {workouts.map(w => (
            <WorkoutCard key={w._id} plan={w} onEdit={openEdit} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingWorkout ? 'Edit Workout Plan' : 'New Workout Plan'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Plan Name" required>
                <Input value={form.planName} onChange={e => handleChange('planName', e.target.value)} placeholder="e.g. Muscle Builder Elite" />
              </FormField>
            </div>
            <FormField label="Goal">
              <Select value={form.goal} onChange={e => handleChange('goal', e.target.value)}>
                {GOALS.map(g => <option key={g}>{g}</option>)}
              </Select>
            </FormField>
            <FormField label="Difficulty">
              <Select value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </Select>
            </FormField>
            <FormField label="Duration (weeks)">
              <Input type="number" value={form.durationWeeks} onChange={e => handleChange('durationWeeks', e.target.value)} min={1} />
            </FormField>
            <FormField label="Assign Trainer">
              <Select value={form.trainerId} onChange={e => handleChange('trainerId', e.target.value)}>
                <option value="">No Trainer</option>
                {trainers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </Select>
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Description">
                <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={2} placeholder="Brief description..." />
              </FormField>
            </div>
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-700">Exercises ({form.exercises.length})</h4>
              <button
                type="button"
                onClick={addExercise}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus size={14} />Add Exercise
              </button>
            </div>
            <div className="hidden sm:grid grid-cols-12 gap-2 px-3 mb-2 text-xs font-semibold text-slate-400 uppercase">
              <span className="col-span-4">Exercise Name</span>
              <span className="col-span-2 text-center">Sets</span>
              <span className="col-span-2 text-center">Reps</span>
              <span className="col-span-2 text-center">Rest (s)</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {form.exercises.map((ex, idx) => (
                <ExerciseRow
                  key={idx}
                  exercise={ex}
                  index={idx}
                  onChange={handleExerciseChange}
                  onRemove={removeExercise}
                  isOnly={form.exercises.length === 1}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm disabled:opacity-60">
              {submitting ? 'Saving...' : editingWorkout ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Workout Plan"
        message="Are you sure you want to delete this workout plan? This cannot be undone."
        isLoading={deleting}
      />
    </div>
  );
}
