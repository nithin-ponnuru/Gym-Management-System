import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, User, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

function InputField({ label, type = 'text', value, onChange, placeholder, required, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'Male',
    address: '',
  });
  const [showSuccess, setShowSuccess] = useState(null); // success message from server
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPhone, setShowPhone] = useState(false);

  const set = (field) => (value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Full name, email and phone number are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', form);
      const { token, user } = res.data.data;

      // Show success banner with member ID
      setShowSuccess(res.data.message);

      // Set auth header directly (no dynamic import needed)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('gym_token', token);
      localStorage.setItem('gym_user', JSON.stringify(user));

      // Redirect to member dashboard after 2.5s
      setTimeout(() => navigate('/member-dashboard', { replace: true }), 2500);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-3xl shadow-xl shadow-emerald-500/20 mb-3 p-2">
            <img src="/logo.png" alt="FitPro" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white">FitPro</h1>
          <p className="text-slate-400 text-sm mt-1">Create your Member Account</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          {/* Back to Login */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-5"
          >
            <ArrowLeft size={15} />
            Back to Login
          </Link>

          <h2 className="text-xl font-bold text-white mb-1">Join FitPro</h2>
          <p className="text-sm text-slate-400 mb-5">
            Fill in your details below. Your <span className="text-emerald-400 font-medium">phone number</span> will be your password.
          </p>

          {/* Success banner */}
          {showSuccess && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 mb-5 flex items-start gap-3">
              <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Account Created Successfully!</p>
                <p className="text-xs text-emerald-400 mt-0.5">{showSuccess}</p>
                <p className="text-xs text-slate-400 mt-1">Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Row 1: Full Name */}
            <InputField
              label="Full Name"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Ponnuru Nithin"
              required
            />

            {/* Row 2: Age + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={e => set('age')(e.target.value)}
                  placeholder="e.g. 25"
                  min="5"
                  max="120"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Gender</label>
                <select
                  value={form.gender}
                  onChange={e => set('gender')(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  {GENDER_OPTIONS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPhone ? 'text' : 'password'}
                  value={form.phone}
                  onChange={e => set('phone')(e.target.value)}
                  placeholder="This will be your login password"
                  className="w-full px-4 py-2.5 pr-11 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPhone(!showPhone)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPhone ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-emerald-400/70 mt-1 flex items-center gap-1">
                <span>🔑</span> Remember this — you'll use it to login
              </p>
            </div>

            {/* Email */}
            <InputField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="your.email@example.com"
              required
            />

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Address</label>
              <textarea
                value={form.address}
                onChange={e => set('address')(e.target.value)}
                placeholder="Your home address (optional)"
                rows={2}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!showSuccess}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 disabled:bg-emerald-800 disabled:cursor-not-allowed transition-all mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </>
              ) : showSuccess ? (
                <><CheckCircle size={16} /> Account Created!</>
              ) : (
                <><User size={16} /> Create My Account</>
              )}
            </button>

            <p className="text-center text-xs text-slate-500 pt-1">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5">
          FitPro Gym Management System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
