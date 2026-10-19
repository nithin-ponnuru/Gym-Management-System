import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Check, CreditCard, Users, RefreshCw,
  XCircle, Eye, Search, Filter, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Clock, Bell, MoreVertical
} from 'lucide-react';
import { membershipAPI, memberMembershipAPI, memberAPI, membershipRequestAPI } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { PageLoader } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import FormField, { Input, Select } from '../components/common/FormField';

const PLAN_GRADIENTS = [
  'from-indigo-500 to-indigo-700',
  'from-violet-500 to-violet-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
  'from-emerald-500 to-emerald-700',
];

const INITIAL_PLAN_FORM = {
  planName: '', durationMonths: '', price: '', description: '', features: '',
  isPopular: false, isBestValue: false, badge: '', discountPercent: '', discountNote: '', status: 'Active',
};

const INITIAL_ASSIGN_FORM = {
  memberId: '',
  membershipId: '',
  startDate: new Date().toISOString().split('T')[0],
  amountPaid: '',
  paymentStatus: 'Paid',
  paymentMethod: 'Cash',
  transactionRef: '',
  notes: '',
};

const STATUS_STYLES = {
  'Active': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'Expired': 'bg-red-100 text-red-700 border border-red-200',
  'Cancelled': 'bg-slate-100 text-slate-600 border border-slate-200',
  'Upcoming': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Pending Payment': 'bg-amber-100 text-amber-700 border border-amber-200',
};

const PAYMENT_STYLES = {
  'Paid': 'text-emerald-600 font-semibold',
  'Pending': 'text-amber-600 font-semibold',
  'Partial': 'text-blue-600 font-semibold',
  'Failed': 'text-red-600 font-semibold',
};

function TabButton({ active, onClick, children, badge }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors
        ${active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {children}
      {badge > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
          ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default function Memberships() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Modals
  const [planModal, setPlanModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [renewModal, setRenewModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);

  // Selection state
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Forms
  const [planForm, setPlanForm] = useState(INITIAL_PLAN_FORM);
  const [assignForm, setAssignForm] = useState(INITIAL_ASSIGN_FORM);
  const [renewForm, setRenewForm] = useState({ membershipId: '', startDate: '', amountPaid: '', paymentStatus: 'Paid', paymentMethod: 'Cash', transactionRef: '' });
  const [approveForm, setApproveForm] = useState({ amountPaid: '', paymentStatus: 'Paid', paymentMethod: 'Cash', transactionRef: '', adminNote: '' });
  const [rejectNote, setRejectNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Filters for assignments table
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [assignPage, setAssignPage] = useState(1);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await membershipAPI.getAll();
      setPlans(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      setAssignmentsLoading(true);
      const params = { page: assignPage, limit: 15 };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterPlan) params.planId = filterPlan;
      const res = await memberMembershipAPI.getAll(params);
      setAssignments(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [search, filterStatus, filterPlan, assignPage]);

  const fetchRequests = useCallback(async () => {
    try {
      setRequestsLoading(true);
      const res = await membershipRequestAPI.getAll();
      setRequests(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  useEffect(() => {
    memberAPI.getAll({ status: 'Active', limit: 200 })
      .then(r => setMembers(r.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'assignments') fetchAssignments();
  }, [activeTab, fetchAssignments]);

  useEffect(() => {
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab, fetchRequests]);

  const pendingRequestCount = requests.filter(r => r.status === 'Pending').length;

  // Plan form handlers
  const handlePlanChange = (field, value) => setPlanForm(prev => ({ ...prev, [field]: value }));

  const openAddPlan = () => {
    setPlanForm(INITIAL_PLAN_FORM);
    setEditingPlan(null);
    setPlanModal(true);
  };

  const openEditPlan = (plan) => {
    setPlanForm({
      planName: plan.planName,
      durationMonths: plan.durationMonths,
      price: plan.price,
      description: plan.description || '',
      features: plan.features?.join('\n') || '',
      isPopular: plan.isPopular || false,
      isBestValue: plan.isBestValue || false,
      badge: plan.badge || '',
      discountPercent: plan.discountPercent || '',
      discountNote: plan.discountNote || '',
      status: plan.status || 'Active',
    });
    setEditingPlan(plan);
    setPlanModal(true);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!planForm.planName || !planForm.price || !planForm.durationMonths) {
      toast.error('Plan name, price, and duration are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        planName: planForm.planName,
        durationMonths: Number(planForm.durationMonths),
        price: Number(planForm.price),
        description: planForm.description,
        features: planForm.features
          ? planForm.features.split('\n').map(f => f.trim()).filter(Boolean)
          : [],
        isPopular: planForm.isPopular,
        isBestValue: planForm.isBestValue,
        badge: planForm.badge,
        discountPercent: planForm.discountPercent ? Number(planForm.discountPercent) : 0,
        discountNote: planForm.discountNote,
        status: planForm.status,
      };
      if (editingPlan) {
        await membershipAPI.update(editingPlan._id, payload);
        toast.success('Plan updated successfully');
      } else {
        await membershipAPI.create(payload);
        toast.success('Plan created successfully');
      }
      setPlanModal(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    setDeleting(true);
    try {
      const res = await membershipAPI.delete(deleteId);
      if (res.data.deactivated) {
        toast.success(res.data.message);
      } else {
        toast.success('Plan deleted');
      }
      setDeleteId(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Assign membership
  const openAssign = (plan) => {
    setSelectedPlan(plan);
    setAssignForm({ ...INITIAL_ASSIGN_FORM, membershipId: plan._id, amountPaid: plan.price });
    setAssignModal(true);
  };

  const openAssignGeneral = () => {
    setSelectedPlan(null);
    setAssignForm(INITIAL_ASSIGN_FORM);
    setAssignModal(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.memberId || !assignForm.membershipId) {
      toast.error('Please select a member and a plan');
      return;
    }
    setSubmitting(true);
    try {
      await memberMembershipAPI.create({
        memberId: assignForm.memberId,
        membershipId: assignForm.membershipId,
        startDate: assignForm.startDate,
        amountPaid: Number(assignForm.amountPaid),
        paymentStatus: assignForm.paymentStatus,
        paymentMethod: assignForm.paymentMethod,
        transactionRef: assignForm.transactionRef,
        notes: assignForm.notes,
      });
      toast.success('Membership assigned successfully');
      setAssignModal(false);
      if (activeTab === 'assignments') fetchAssignments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Plan auto-fill when plan changes in assign form
  const handleAssignPlanChange = (planId) => {
    const plan = plans.find(p => p._id === planId);
    setAssignForm(prev => ({
      ...prev,
      membershipId: planId,
      amountPaid: plan ? plan.price : prev.amountPaid,
    }));
  };

  // Renew
  const openRenew = (assignment) => {
    setSelectedAssignment(assignment);
    const planId = typeof assignment.membershipId === 'object' ? assignment.membershipId._id : assignment.membershipId;
    setRenewForm({
      membershipId: planId || '',
      startDate: '',
      amountPaid: assignment.membershipId?.price || '',
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      transactionRef: '',
    });
    setRenewModal(true);
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await memberMembershipAPI.renew(selectedAssignment._id, {
        membershipId: renewForm.membershipId || undefined,
        startDate: renewForm.startDate || undefined,
        amountPaid: Number(renewForm.amountPaid),
        paymentStatus: renewForm.paymentStatus,
        paymentMethod: renewForm.paymentMethod,
        transactionRef: renewForm.transactionRef,
      });
      toast.success('Membership renewed successfully');
      setRenewModal(false);
      fetchAssignments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel
  const handleCancel = async () => {
    setDeleting(true);
    try {
      await memberMembershipAPI.cancel(cancelId, { reason: cancelReason });
      toast.success('Membership cancelled');
      setCancelId(null);
      setCancelReason('');
      fetchAssignments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Approve request
  const openApprove = (req) => {
    setSelectedRequest(req);
    setApproveForm({
      amountPaid: req.membershipId?.price || '',
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      transactionRef: '',
      adminNote: '',
    });
    setApproveModal(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await membershipRequestAPI.approve(selectedRequest._id, {
        amountPaid: Number(approveForm.amountPaid),
        paymentStatus: approveForm.paymentStatus,
        paymentMethod: approveForm.paymentMethod,
        transactionRef: approveForm.transactionRef,
        adminNote: approveForm.adminNote,
      });
      toast.success('Request approved and membership activated');
      setApproveModal(false);
      fetchRequests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await membershipRequestAPI.reject(requestId, { adminNote: rejectNote });
      toast.success('Request rejected');
      setRejectNote('');
      fetchRequests();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <PageLoader />;

  const assignmentsList = assignments.data || [];
  const assignmentsPagination = assignments.pagination || {};

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Membership Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {plans.filter(p => p.status === 'Active').length} active plans · {assignmentsPagination.total || 0} assignments
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAssignGeneral}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm"
          >
            <Users size={16} />
            Assign Plan
          </button>
          <button
            onClick={openAddPlan}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            <Plus size={16} />
            New Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        <TabButton active={activeTab === 'plans'} onClick={() => setActiveTab('plans')}>
          <CreditCard size={15} /> Plans ({plans.length})
        </TabButton>
        <TabButton active={activeTab === 'assignments'} onClick={() => { setActiveTab('assignments'); }}>
          <Users size={15} /> Assignments
        </TabButton>
        <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} badge={pendingRequestCount}>
          <Bell size={15} /> Requests
        </TabButton>
      </div>

      {/* ── TAB: PLANS ─────────────────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <>
          {plans.length === 0 ? (
            <EmptyState
              title="No membership plans"
              message="Create your first membership plan to get started."
              icon={CreditCard}
              action={
                <button onClick={openAddPlan} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                  Add Plan
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {plans.map((plan, idx) => (
                <div key={plan._id} className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all
                  ${plan.status === 'Inactive' ? 'border-slate-200 opacity-70' : 'border-slate-100'}`}>
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
                    {plan.isBestValue && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Best Value</span>
                    )}
                    {plan.isPopular && (
                      <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Popular</span>
                    )}
                    {plan.badge && !plan.isBestValue && !plan.isPopular && (
                      <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{plan.badge}</span>
                    )}
                    {plan.status === 'Inactive' && (
                      <span className="bg-slate-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>

                  {/* Header */}
                  <div className={`bg-gradient-to-br ${PLAN_GRADIENTS[idx % PLAN_GRADIENTS.length]} p-5 text-white`}>
                    <h3 className="text-lg font-bold pr-16">{plan.planName}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
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
                      <p className="text-xs bg-white/20 px-2 py-0.5 rounded-full inline-block mt-1">
                        {plan.discountPercent}% off — {plan.discountNote}
                      </p>
                    )}
                    {plan.subscriberCount > 0 && (
                      <p className="text-xs text-white/70 mt-2">
                        {plan.subscriberCount} active subscriber{plan.subscriberCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {plan.description && (
                      <p className="text-xs text-slate-500 mb-3">{plan.description}</p>
                    )}
                    <ul className="space-y-1.5 mb-4 min-h-[60px]">
                      {(plan.features || []).slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <Check size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                      {plan.features?.length > 5 && (
                        <li className="text-xs text-slate-400">+{plan.features.length - 5} more</li>
                      )}
                    </ul>
                    <div className="space-y-2">
                      <button
                        onClick={() => openAssign(plan)}
                        disabled={plan.status === 'Inactive'}
                        className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Users size={13} /> Assign to Member
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditPlan(plan)}
                          className="flex-1 px-2 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-center gap-1"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(plan._id)}
                          className="flex-1 px-2 py-1.5 border border-red-100 text-red-500 rounded-lg text-xs hover:bg-red-50 flex items-center justify-center gap-1"
                        >
                          <Trash2 size={11} /> {plan.status === 'Active' ? 'Delete' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: ASSIGNMENTS ──────────────────────────────────────────── */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setAssignPage(1); }}
                placeholder="Search by name, email, member ID..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setAssignPage(1); }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">All Status</option>
              <option>Active</option>
              <option>Expired</option>
              <option>Upcoming</option>
              <option>Pending Payment</option>
              <option>Cancelled</option>
            </select>
            <select
              value={filterPlan}
              onChange={e => { setFilterPlan(e.target.value); setAssignPage(1); }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">All Plans</option>
              {plans.map(p => <option key={p._id} value={p._id}>{p.planName}</option>)}
            </select>
            <button
              onClick={fetchAssignments}
              className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Table */}
          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
          ) : assignmentsList.length === 0 ? (
            <EmptyState title="No assignments found" message="Assign a membership plan to a member to get started." icon={Users} />
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {['Member', 'Plan', 'Start Date', 'Expiry Date', 'Amount', 'Payment', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {assignmentsList.map(a => (
                        <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-slate-800">{a.memberId?.name || '—'}</p>
                              <p className="text-xs text-slate-400">{a.memberId?.memberId} · {a.memberId?.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-700">
                              {a.membershipId?.planName || a.planSnapshot?.planName || '—'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {a.membershipId?.durationMonths || a.planSnapshot?.durationMonths} month(s)
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {new Date(a.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {new Date(a.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                            ₹{a.amountPaid?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${PAYMENT_STYLES[a.paymentStatus] || ''}`}>
                              {a.paymentStatus}
                            </span>
                            {a.paymentMethod && (
                              <p className="text-xs text-slate-400">{a.paymentMethod}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap
                              ${STATUS_STYLES[a.status] || 'bg-slate-100 text-slate-600'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => { setSelectedAssignment(a); setDetailModal(true); }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye size={14} />
                              </button>
                              {(a.status === 'Active' || a.status === 'Expired' || a.status === 'Upcoming') && (
                                <button
                                  onClick={() => openRenew(a)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Renew"
                                >
                                  <RefreshCw size={14} />
                                </button>
                              )}
                              {['Active', 'Upcoming', 'Pending Payment'].includes(a.status) && (
                                <button
                                  onClick={() => { setCancelId(a._id); setCancelReason(''); }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Cancel"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {assignmentsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Showing {((assignPage - 1) * 15) + 1}–{Math.min(assignPage * 15, assignmentsPagination.total)} of {assignmentsPagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAssignPage(p => Math.max(1, p - 1))}
                      disabled={assignPage <= 1}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setAssignPage(p => Math.min(assignmentsPagination.totalPages, p + 1))}
                      disabled={assignPage >= assignmentsPagination.totalPages}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: REQUESTS ────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requestsLoading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
          ) : requests.length === 0 ? (
            <EmptyState title="No membership requests" message="Members can request memberships from their portal." icon={Bell} />
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req._id} className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4
                  ${req.status === 'Pending' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{req.memberId?.name}</p>
                      <span className="text-xs text-slate-400">({req.memberId?.memberId})</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'}`}>
                        {req.status}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{req.requestType}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Requesting: <span className="font-medium">{req.membershipId?.planName}</span>
                      {' · '}₹{req.membershipId?.price?.toLocaleString('en-IN')}
                      {' · '}{req.membershipId?.durationMonths} month(s)
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Preferred start: {new Date(req.preferredStartDate).toLocaleDateString('en-IN')}
                      {' · '}Requested: {new Date(req.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    {req.message && (
                      <p className="text-xs text-slate-500 mt-1 italic">"{req.message}"</p>
                    )}
                    {req.adminNote && (
                      <p className="text-xs text-slate-500 mt-1">Admin note: {req.adminNote}</p>
                    )}
                  </div>
                  {req.status === 'Pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openApprove(req)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          handleReject(req._id);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────── */}

      {/* Plan Create/Edit Modal */}
      <Modal isOpen={planModal} onClose={() => setPlanModal(false)} title={editingPlan ? 'Edit Plan' : 'New Membership Plan'} size="lg">
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FormField label="Plan Name" required>
                <Input value={planForm.planName} onChange={e => handlePlanChange('planName', e.target.value)} placeholder="e.g. Yearly Plan" />
              </FormField>
            </div>
            <FormField label="Duration (months)" required>
              <Input type="number" value={planForm.durationMonths} onChange={e => handlePlanChange('durationMonths', e.target.value)} min={1} />
            </FormField>
            <FormField label="Price (₹)" required>
              <Input type="number" value={planForm.price} onChange={e => handlePlanChange('price', e.target.value)} min={0} />
            </FormField>
          </div>
          <FormField label="Description">
            <Input value={planForm.description} onChange={e => handlePlanChange('description', e.target.value)} placeholder="Brief description of the plan" />
          </FormField>
          <FormField label="Features (one per line)">
            <textarea
              value={planForm.features}
              onChange={e => handlePlanChange('features', e.target.value)}
              rows={4}
              placeholder={"Gym Access\nAll Equipment\nLocker Access"}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Badge (e.g. Popular)">
              <Input value={planForm.badge} onChange={e => handlePlanChange('badge', e.target.value)} placeholder="e.g. Best Value" />
            </FormField>
            <FormField label="Status">
              <Select value={planForm.status} onChange={e => handlePlanChange('status', e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Discount %">
              <Input type="number" value={planForm.discountPercent} onChange={e => handlePlanChange('discountPercent', e.target.value)} min={0} max={100} placeholder="0" />
            </FormField>
            <FormField label="Discount Note">
              <Input value={planForm.discountNote} onChange={e => handlePlanChange('discountNote', e.target.value)} placeholder="e.g. Limited time offer" />
            </FormField>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={planForm.isPopular} onChange={e => handlePlanChange('isPopular', e.target.checked)} className="w-4 h-4 rounded accent-rose-500" />
              Mark as Popular
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={planForm.isBestValue} onChange={e => handlePlanChange('isBestValue', e.target.checked)} className="w-4 h-4 rounded accent-amber-500" />
              Mark as Best Value
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setPlanModal(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm disabled:opacity-60">
              {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Membership Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Membership" size="lg">
        <form onSubmit={handleAssign} className="space-y-4">
          <FormField label="Select Member" required>
            <Select value={assignForm.memberId} onChange={e => setAssignForm(prev => ({ ...prev, memberId: e.target.value }))}>
              <option value="">Choose a member...</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.memberId})</option>)}
            </Select>
          </FormField>
          <FormField label="Select Plan" required>
            <Select value={assignForm.membershipId} onChange={e => handleAssignPlanChange(e.target.value)}>
              <option value="">Choose a plan...</option>
              {plans.filter(p => p.status === 'Active').map(p => (
                <option key={p._id} value={p._id}>{p.planName} — ₹{p.price.toLocaleString('en-IN')} / {p.durationMonths}mo</option>
              ))}
            </Select>
          </FormField>

          {assignForm.membershipId && (() => {
            const plan = plans.find(p => p._id === assignForm.membershipId);
            const start = assignForm.startDate ? new Date(assignForm.startDate) : new Date();
            const expiry = new Date(start);
            expiry.setMonth(expiry.getMonth() + (plan?.durationMonths || 0));
            return plan ? (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-800">
                <p><span className="font-medium">Plan:</span> {plan.planName} · ₹{plan.price.toLocaleString('en-IN')}</p>
                <p><span className="font-medium">Expiry:</span> {expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            ) : null;
          })()}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date">
              <Input type="date" value={assignForm.startDate} onChange={e => setAssignForm(prev => ({ ...prev, startDate: e.target.value }))} />
            </FormField>
            <FormField label="Amount Paid (₹)">
              <Input type="number" value={assignForm.amountPaid} onChange={e => setAssignForm(prev => ({ ...prev, amountPaid: e.target.value }))} min={0} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Payment Status">
              <Select value={assignForm.paymentStatus} onChange={e => setAssignForm(prev => ({ ...prev, paymentStatus: e.target.value }))}>
                <option>Paid</option>
                <option>Pending</option>
                <option>Partial</option>
              </Select>
            </FormField>
            <FormField label="Payment Method">
              <Select value={assignForm.paymentMethod} onChange={e => setAssignForm(prev => ({ ...prev, paymentMethod: e.target.value }))}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
                <option>Other</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Transaction Ref / UPI ID">
            <Input value={assignForm.transactionRef} onChange={e => setAssignForm(prev => ({ ...prev, transactionRef: e.target.value }))} placeholder="Optional" />
          </FormField>
          <FormField label="Notes">
            <Input value={assignForm.notes} onChange={e => setAssignForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Optional notes" />
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAssignModal(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm disabled:opacity-60">
              {submitting ? 'Assigning...' : 'Assign Membership'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal isOpen={renewModal} onClose={() => setRenewModal(false)} title="Renew Membership" size="lg">
        <form onSubmit={handleRenew} className="space-y-4">
          {selectedAssignment && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
              <p><span className="font-medium">Member:</span> {selectedAssignment.memberId?.name}</p>
              <p><span className="font-medium">Current plan:</span> {selectedAssignment.membershipId?.planName || selectedAssignment.planSnapshot?.planName}</p>
              <p><span className="font-medium">Current expiry:</span> {new Date(selectedAssignment.expiryDate).toLocaleDateString('en-IN')}</p>
            </div>
          )}
          <FormField label="Renew with Plan">
            <Select value={renewForm.membershipId} onChange={e => {
              const plan = plans.find(p => p._id === e.target.value);
              setRenewForm(prev => ({ ...prev, membershipId: e.target.value, amountPaid: plan ? plan.price : prev.amountPaid }));
            }}>
              <option value="">Same plan</option>
              {plans.filter(p => p.status === 'Active').map(p => (
                <option key={p._id} value={p._id}>{p.planName} — ₹{p.price.toLocaleString('en-IN')} / {p.durationMonths}mo</option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="New Start Date (optional)">
              <Input type="date" value={renewForm.startDate} onChange={e => setRenewForm(prev => ({ ...prev, startDate: e.target.value }))} />
            </FormField>
            <FormField label="Amount (₹)">
              <Input type="number" value={renewForm.amountPaid} onChange={e => setRenewForm(prev => ({ ...prev, amountPaid: e.target.value }))} min={0} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Payment Status">
              <Select value={renewForm.paymentStatus} onChange={e => setRenewForm(prev => ({ ...prev, paymentStatus: e.target.value }))}>
                <option>Paid</option>
                <option>Pending</option>
              </Select>
            </FormField>
            <FormField label="Payment Method">
              <Select value={renewForm.paymentMethod} onChange={e => setRenewForm(prev => ({ ...prev, paymentMethod: e.target.value }))}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
                <option>Other</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Transaction Ref">
            <Input value={renewForm.transactionRef} onChange={e => setRenewForm(prev => ({ ...prev, transactionRef: e.target.value }))} placeholder="Optional" />
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setRenewModal(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm disabled:opacity-60">
              {submitting ? 'Renewing...' : 'Renew Membership'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Membership Details">
        {selectedAssignment && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Member', selectedAssignment.memberId?.name],
                ['Member ID', selectedAssignment.memberId?.memberId],
                ['Email', selectedAssignment.memberId?.email],
                ['Plan', selectedAssignment.membershipId?.planName || selectedAssignment.planSnapshot?.planName],
                ['Duration', `${selectedAssignment.membershipId?.durationMonths || selectedAssignment.planSnapshot?.durationMonths} month(s)`],
                ['Start Date', new Date(selectedAssignment.startDate).toLocaleDateString('en-IN')],
                ['Expiry Date', new Date(selectedAssignment.expiryDate).toLocaleDateString('en-IN')],
                ['Amount Paid', `₹${selectedAssignment.amountPaid?.toLocaleString('en-IN')}`],
                ['Payment Status', selectedAssignment.paymentStatus],
                ['Payment Method', selectedAssignment.paymentMethod || '—'],
                ['Transaction Ref', selectedAssignment.transactionRef || '—'],
                ['Status', selectedAssignment.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-medium text-slate-800">{value || '—'}</p>
                </div>
              ))}
            </div>
            {selectedAssignment.notes && (
              <div>
                <p className="text-xs text-slate-400">Notes</p>
                <p className="text-slate-700">{selectedAssignment.notes}</p>
              </div>
            )}
            {selectedAssignment.cancelReason && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs text-red-500 font-medium">Cancellation Reason</p>
                <p className="text-red-700">{selectedAssignment.cancelReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Request Modal */}
      <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title="Approve Membership Request">
        <form onSubmit={handleApprove} className="space-y-4">
          {selectedRequest && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm">
              <p><span className="font-medium">Member:</span> {selectedRequest.memberId?.name} ({selectedRequest.memberId?.memberId})</p>
              <p><span className="font-medium">Plan:</span> {selectedRequest.membershipId?.planName}</p>
              <p><span className="font-medium">Price:</span> ₹{selectedRequest.membershipId?.price?.toLocaleString('en-IN')}</p>
              <p><span className="font-medium">Preferred Start:</span> {new Date(selectedRequest.preferredStartDate).toLocaleDateString('en-IN')}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount Paid (₹)">
              <Input type="number" value={approveForm.amountPaid} onChange={e => setApproveForm(prev => ({ ...prev, amountPaid: e.target.value }))} min={0} />
            </FormField>
            <FormField label="Payment Status">
              <Select value={approveForm.paymentStatus} onChange={e => setApproveForm(prev => ({ ...prev, paymentStatus: e.target.value }))}>
                <option>Paid</option>
                <option>Pending</option>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Payment Method">
              <Select value={approveForm.paymentMethod} onChange={e => setApproveForm(prev => ({ ...prev, paymentMethod: e.target.value }))}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
                <option>Other</option>
              </Select>
            </FormField>
            <FormField label="Transaction Ref">
              <Input value={approveForm.transactionRef} onChange={e => setApproveForm(prev => ({ ...prev, transactionRef: e.target.value }))} placeholder="Optional" />
            </FormField>
          </div>
          <FormField label="Admin Note (optional)">
            <Input value={approveForm.adminNote} onChange={e => setApproveForm(prev => ({ ...prev, adminNote: e.target.value }))} placeholder="Internal note" />
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setApproveModal(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm disabled:opacity-60">
              {submitting ? 'Approving...' : 'Approve & Activate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Plan Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeletePlan}
        title="Delete Plan"
        message="Delete this membership plan? If active memberships exist, the plan will be deactivated instead to preserve history."
        isLoading={deleting}
      />

      {/* Cancel Membership Confirm */}
      <ConfirmDialog
        isOpen={!!cancelId}
        onClose={() => { setCancelId(null); setCancelReason(''); }}
        onConfirm={handleCancel}
        title="Cancel Membership"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to cancel this membership?</p>
            <input
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
        }
        confirmLabel="Cancel Membership"
        isLoading={deleting}
        isDanger
      />
    </div>
  );
}
