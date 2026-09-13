import React from 'react';
import { Bell, Truck, PackageCheck, Handshake, AlertTriangle, CheckCircle, X, ExternalLink } from 'lucide-react';

export const NotificationToast = ({ toasts = [], onDismiss, onNavigate }) => {
  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'delivery':
        return <Truck className="w-5 h-5 text-sky-600" />;
      case 'order':
        return <PackageCheck className="w-5 h-5 text-emerald-600" />;
      case 'negotiation':
      case 'request':
        return <Handshake className="w-5 h-5 text-indigo-600" />;
      case 'dispute':
      case 'return':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'delivery':
        return 'border-l-sky-500';
      case 'order':
        return 'border-l-emerald-500';
      case 'negotiation':
      case 'request':
        return 'border-l-indigo-500';
      case 'dispute':
      case 'return':
        return 'border-l-amber-500';
      default:
        return 'border-l-emerald-500';
    }
  };

  const getBgGlow = (type) => {
    switch (type) {
      case 'delivery':
        return 'bg-sky-50 text-sky-700';
      case 'order':
        return 'bg-emerald-50 text-emerald-700';
      case 'negotiation':
      case 'request':
        return 'bg-indigo-50 text-indigo-700';
      case 'dispute':
      case 'return':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-emerald-50 text-emerald-700';
    }
  };

  return (
    <aside aria-label="Real-time notifications" className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 border-l-4 ${getBorderColor(t.type)} p-4 transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-top-4 fade-in`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl flex-shrink-0 ${getBgGlow(t.type)}`}>
              {getIcon(t.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="font-bold text-xs text-slate-900 truncate">{t.title}</h4>
                <span className="text-[10px] text-slate-400 flex-shrink-0">Just now</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                {t.message}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                {t.link && onNavigate && (
                  <button
                    onClick={() => {
                      const pageKey = t.link.replace(/^\//, '').replace('/', '-');
                      onNavigate(pageKey);
                      onDismiss && onDismiss(t.id);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => onDismiss && onDismiss(t.id)}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <button
              onClick={() => onDismiss && onDismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition flex-shrink-0"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
};
