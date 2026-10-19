import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, Shield, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState('admin'); // 'admin' | 'member'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userData = await login(email.trim(), password.trim());
      if (userData.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/member-dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl shadow-indigo-500/20 mb-4 p-2.5">
            <img src="/logo.png" alt="FitPro" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-white">FitPro</h1>
          <p className="text-slate-400 text-sm mt-1">Gym Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-2 bg-white/5 rounded-2xl p-1.5 mb-8">
            <button
              type="button"
              onClick={() => { setTab('admin'); setError(''); setEmail(''); setPassword(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${tab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <Shield size={16} />
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => { setTab('member'); setError(''); setEmail(''); setPassword(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${tab === 'member'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <User size={16} />
              Member Login
            </button>
          </div>

          {/* Tab info banner */}
          {tab === 'admin' ? (
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-3 mb-6 flex items-start gap-3">
              <Shield size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-300">
                Admin access is restricted to authorized staff only. Access the full gym management portal.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-xl p-3 mb-6 flex items-start gap-3">
              <User size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-300">
                Login with your gym registered email. Your default password is your <strong>phone number</strong>.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {tab === 'admin' ? 'Admin Email' : 'Registered Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={tab === 'admin' ? 'admin@gymfit.com' : 'your.email@example.com'}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {tab === 'member' ? 'Password (your phone number)' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={tab === 'member' ? 'Enter your phone number' : 'Enter admin password'}
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  autoComplete="current-password"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all mt-2 flex items-center justify-center gap-2
                ${tab === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 disabled:bg-indigo-800'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 disabled:bg-emerald-800'
                } disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                tab === 'admin' ? 'Sign in as Admin' : 'Sign in as Member'
              )}
            </button>
          </form>

          {/* Sign Up link — only on member tab */}
          {tab === 'member' && (
            <div className="mt-5 pt-5 border-t border-white/10 text-center">
              <p className="text-sm text-slate-400">
                New to FitPro?{' '}
                <Link
                  to="/signup"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Create your account →
                </Link>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          FitPro Gym Management System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
