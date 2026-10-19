import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, color = 'indigo', trend, trendLabel, prefix = '', suffix = '' }) {
  const colorClasses = {
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-600', text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', text: 'text-emerald-600' },
    violet: { bg: 'bg-violet-50', icon: 'bg-violet-600', text: 'text-violet-600' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-600', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', icon: 'bg-rose-600', text: 'text-rose-600' },
    sky: { bg: 'bg-sky-50', icon: 'bg-sky-600', text: 'text-sky-600' },
  };
  const c = colorClasses[color] || colorClasses.indigo;

  const formatValue = (v) => {
    if (typeof v === 'number' && v >= 1000) return v.toLocaleString('en-IN');
    return v;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {prefix}{formatValue(value)}{suffix}
          </p>
          {(trend !== undefined || trendLabel) && (
            <div className="flex items-center gap-1 mt-2">
              {trend !== undefined && (
                trend >= 0
                  ? <TrendingUp size={14} className="text-emerald-500" />
                  : <TrendingDown size={14} className="text-red-500" />
              )}
              <p className="text-xs text-slate-500">{trendLabel}</p>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon size={24} className={c.text} />
        </div>
      </div>
    </div>
  );
}
