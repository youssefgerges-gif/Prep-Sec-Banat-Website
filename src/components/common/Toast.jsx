import React, { useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { usePoints } from '../../context/PointsContext';

export default function Toast() {
  const { toast, hideToast } = usePoints();

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast.show, hideToast]);

  if (!toast.show) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-bounce-short">
      <div
        className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 text-right backdrop-blur-md ${
          toast.type === 'success'
            ? 'bg-emerald-900/90 text-white border-emerald-500/50 shadow-emerald-900/30'
            : 'bg-rose-900/90 text-white border-rose-500/50 shadow-rose-900/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {toast.type === 'success' ? (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-300" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-base leading-tight">{toast.title}</h4>
              {toast.points > 0 && (
                <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full text-xs font-black flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-amber-900" />+{toast.points} نقطة
                </span>
              )}
            </div>
            {toast.message && (
              <p className="text-xs opacity-90 mt-0.5 font-medium">{toast.message}</p>
            )}
          </div>
        </div>

        <button
          onClick={hideToast}
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
