export default function FormField({ label, error, children, required }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Input({ className = '', error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        placeholder:text-slate-400 transition-all
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}
        ${className}`}
    />
  );
}

export function Select({ className = '', error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        transition-all appearance-none
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}
        ${className}`}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', error, ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white resize-none
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        placeholder:text-slate-400 transition-all
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}
        ${className}`}
    />
  );
}
