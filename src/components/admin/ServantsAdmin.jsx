import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, X, Ban, RotateCcw, Trash2, KeyRound, Loader2, Phone, Cake, MapPin, Church, Clock } from 'lucide-react';
import { getUsers, adminSetServantStatus, adminDeleteServant, resetLoginPassword } from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';
import { useAuth } from '../../context/AuthContext';

// إدارة الخدام — لأمين الخدمة بس: الموافقة على الخدام الجداد، إيقاف أو
// إرجاع حساب، مسح حساب، وإعادة تعيين كلمة سر خادم.
export default function ServantsAdmin() {
  const { showToast, triggerRefresh, refreshKey } = usePoints();
  const { refreshUsers } = useAuth();
  const [servants, setServants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getUsers()
      .then(users => { if (mounted) setServants(users.filter(u => u.role === 'servant')); })
      .catch(err => showToast('تعذر التحميل', err.message, 0, 'error'))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const act = async (user, fn, okTitle, okMsg) => {
    setBusyId(user.id);
    try {
      await fn();
      triggerRefresh();
      if (refreshUsers) refreshUsers();
      showToast(okTitle, okMsg, 0, 'success');
    } catch (err) {
      showToast('خطأ', err.message || 'حدث خطأ', 0, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const approve = (u) => act(u, () => adminSetServantStatus(u.id, 'active'), 'تمت الموافقة ✅', `${u.name} يقدر يدخل دلوقتي`);
  const suspend = (u) => window.confirm(`إيقاف حساب "${u.name}"؟ مش هيقدر يدخل لحد ما ترجّعه.`) &&
    act(u, () => adminSetServantStatus(u.id, 'suspended'), 'اتوقف الحساب', u.name);
  const reactivate = (u) => act(u, () => adminSetServantStatus(u.id, 'active'), 'رجع الحساب ✅', u.name);
  const remove = (u, isReject) => window.confirm(isReject ? `رفض طلب "${u.name}" ومسحه؟` : `مسح حساب "${u.name}" نهائيًا؟`) &&
    act(u, () => adminDeleteServant(u.id), isReject ? 'اترفض الطلب' : 'اتمسح الحساب', u.name);
  const resetPw = (u) => u.username && window.confirm(`إعادة تعيين كلمة سر "${u.name}"؟ هيدخل بنفس الكود (${u.username}) ويختار كلمة سر جديدة.`) &&
    act(u, () => resetLoginPassword(u.username), 'تمت إعادة التعيين', `${u.name} يقدر يعمل "أول مرة تدخل" تاني`);

  const pending = servants.filter(s => s.status === 'pending');
  const active = servants.filter(s => (s.status || 'active') === 'active');
  const suspended = servants.filter(s => s.status === 'suspended');

  const Details = ({ s }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2">
      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {s.phone || '—'}</span>
      <span className="flex items-center gap-1"><Cake className="w-3 h-3 text-slate-400" /> {s.birth_date || '—'}</span>
      <span className="flex items-center gap-1"><Church className="w-3 h-3 text-slate-400" /> {s.confession_father || '—'}</span>
      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {s.address || '—'}</span>
    </div>
  );

  const Btn = ({ onClick, className, children, title }) => (
    <button type="button" onClick={onClick} title={title} disabled={!!busyId}
      className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 disabled:opacity-50 ${className}`}>
      {children}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5 dir-rtl text-right">
      <div className="rounded-3xl bg-gradient-to-l from-violet-700 to-indigo-700 p-6 text-white shadow-md">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> لأمين الخدمة بس
        </span>
        <h2 className="text-2xl font-black">إدارة الخدام</h2>
        <p className="text-indigo-100 text-xs mt-1">الخدام الجداد بيعملوا حساباتهم بنفسهم من صفحة الدخول، ومحدش فيهم بيشوف أي بيانات قبل موافقتك.</p>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 text-xs py-10">جاري التحميل...</p>
      ) : (
        <>
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-amber-200 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> مستنيين موافقتك ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">مفيش طلبات جديدة.</p>
            ) : pending.map(s => (
              <div key={s.id} className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-black text-slate-900 text-sm">{s.name}</span>
                  <div className="flex gap-1.5">
                    <Btn onClick={() => approve(s)} className="bg-emerald-600 text-white">
                      {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} موافقة
                    </Btn>
                    <Btn onClick={() => remove(s, true)} className="bg-white text-rose-600 border border-rose-200">
                      <X className="w-3.5 h-3.5" /> رفض
                    </Btn>
                  </div>
                </div>
                <Details s={s} />
              </div>
            ))}
          </section>

          <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">الخدام ({active.length})</h3>
            {active.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">لسه مفيش خدام.</p>
            ) : active.map(s => (
              <div key={s.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-black text-slate-900 text-sm">{s.name}</span>
                    <span className="text-[10px] font-mono text-sky-700 mr-2">{s.username}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Btn onClick={() => resetPw(s)} title="إعادة تعيين كلمة السر" className="bg-amber-50 text-amber-700 border border-amber-200"><KeyRound className="w-3.5 h-3.5" /></Btn>
                    <Btn onClick={() => suspend(s)} title="إيقاف" className="bg-white text-slate-700 border border-slate-200"><Ban className="w-3.5 h-3.5" /> إيقاف</Btn>
                    <Btn onClick={() => remove(s, false)} title="مسح" className="bg-rose-50 text-rose-600 border border-rose-200"><Trash2 className="w-3.5 h-3.5" /></Btn>
                  </div>
                </div>
                <Details s={s} />
              </div>
            ))}
          </section>

          {suspended.length > 0 && (
            <section className="bg-white rounded-3xl p-5 shadow-sm border border-rose-200 space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">حسابات موقوفة ({suspended.length})</h3>
              {suspended.map(s => (
                <div key={s.id} className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200 flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-black text-slate-700 text-sm">{s.name}</span>
                  <div className="flex gap-1.5">
                    <Btn onClick={() => reactivate(s)} className="bg-emerald-600 text-white"><RotateCcw className="w-3.5 h-3.5" /> رجّعه</Btn>
                    <Btn onClick={() => remove(s, false)} className="bg-white text-rose-600 border border-rose-200"><Trash2 className="w-3.5 h-3.5" /></Btn>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
