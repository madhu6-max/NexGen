import React from 'react';

export const StatusBadge = ({ status, size = 'sm' }) => {
  if (!status) return null;

  const s = String(status).toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  // Green: Verified / Completed / Accepted / Consistent / Good
  if (s.includes('verif') || s.includes('complete') || s.includes('accept') || s.includes('consistent') || s.includes('delivered') || s.includes('passed') || s.includes('good') || s.includes('resolved')) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  // Blue: Active / In Transit / In Progress / Open / Matching
  else if (s.includes('transit') || s.includes('active') || s.includes('open') || s.includes('matching') || s.includes('picked') || s.includes('progress') || s.includes('preparing') || s.includes('scheduled')) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  }
  // Yellow/Amber: Pending / Counter Offered / Review
  else if (s.includes('pend') || s.includes('counter') || s.includes('review') || s.includes('investigat') || s.includes('partial')) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  }
  // Red: Issue Reported / Rejected / Return / Damaged / Poor / Cancelled
  else if (s.includes('issue') || s.includes('reject') || s.includes('return') || s.includes('damag') || s.includes('poor') || s.includes('cancel')) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${colorClasses} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
};
