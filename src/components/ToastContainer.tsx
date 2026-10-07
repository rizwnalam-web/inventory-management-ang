import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useSignalValue } from '../core/signals';
import { inventoryStore } from '../services/inventory-store.service';

export default function ToastContainer() {
  const toast = useSignalValue(inventoryStore.toastNotification);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/50 bg-slate-900/95',
    warning: 'border-amber-500/50 bg-slate-900/95',
    error: 'border-rose-500/50 bg-slate-900/95',
    info: 'border-sky-500/50 bg-slate-900/95',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`p-3.5 rounded-xl border shadow-xl flex items-start justify-between gap-3 ${
          borders[toast.type]
        }`}
      >
        <div className="flex items-start gap-2.5">
          {icons[toast.type]}
          <div className="text-xs text-slate-200 leading-snug">{toast.message}</div>
        </div>
        <button
          onClick={() => inventoryStore.toastNotification.set(null)}
          className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
