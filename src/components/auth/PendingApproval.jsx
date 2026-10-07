import React, { useState } from 'react';
import { Clock, Ban, LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/eparchy-logo.png';

// بتظهر لخادم عمل حسابه ولسه مستني موافقة أمين الخدمة، أو لحساب موقوف.
export default function PendingApproval() {
  const { currentUser, logout, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const suspended = currentUser?.status === 'suspended';

  const check = async () => {
    setChecking(true);
    try { await refreshProfile(); } finally { setChecking(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 dir-rtl">
      <div className="w-full max-w-sm text-center space-y-5">
        <img src={logo} alt="شعار الكنيسة" className="w-20 h-20 rounded-full shadow-lg object-cover mx-auto" />
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
          <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${suspended ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
            {suspended ? <Ban className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg">أهلاً {currentUser?.name} 👋</h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {suspended
                ? 'حسابك موقوف حاليًا. لو ده غلط، كلّم أبونا (أمين الخدمة).'
                : 'حسابك اتعمل وهو دلوقتي مستني موافقة أبونا (أمين الخدمة). أول ما يوافق هتقدر تدخل على طول.'}
            </p>
            {!suspended && currentUser?.username && (
              <p className="text-xs text-slate-500 mt-3">
                كود الدخول بتاعك: <span className="font-mono font-black text-sky-700">{currentUser.username}</span>
              </p>
            )}
          </div>
          {!suspended && (
            <button
              type="button"
              onClick={check}
              disabled={checking}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              اتوافق عليا؟ جرّب تاني
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
