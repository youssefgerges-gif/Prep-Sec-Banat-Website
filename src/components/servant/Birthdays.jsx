import React, { useEffect, useState } from 'react';
import { Cake, Gift, ChevronRight, ChevronLeft, CheckCircle2, Undo2, Loader2, PartyPopper, MessageCircle, Search } from 'lucide-react';
import {
  getBirthdays, markGiftReceived, unmarkGiftReceived, getCairoToday, getLastThursday,
  ARABIC_MONTHS, CLASSES, getClassName
} from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';
import WhatsAppModal from '../common/WhatsAppModal';
import PushToggle from '../common/PushToggle';

// أعياد ميلاد المخدومات لكل شهر + تعليم مين استلمت هديتها في الحفلة
// (آخر خميس في الشهر).
export default function Birthdays() {
  const { currentUser } = useAuth();
  const { showToast, triggerRefresh, refreshKey } = usePoints();
  const today = getCairoToday();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | received
  const [classFilter, setClassFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [whatsappRecipient, setWhatsappRecipient] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError('');
    getBirthdays(month, year)
      .then(data => { if (mounted) setList(data); })
      .catch(err => { if (mounted) setLoadError(err.message || 'تعذر تحميل أعياد الميلاد'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [month, year, refreshKey]);

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const partyDay = getLastThursday(year, month);
  const isCurrentMonth = year === today.year && month === today.month;
  const isPartyToday = isCurrentMonth && today.day === partyDay;
  const partyPassed = isCurrentMonth && today.day > partyDay;

  const receivedCount = list.filter(s => s.received_at).length;
  const pendingCount = list.length - receivedCount;

  const q = searchQuery.trim();
  const visible = list.filter(s =>
    (statusFilter === 'all' || (statusFilter === 'received' ? !!s.received_at : !s.received_at)) &&
    (classFilter === 'all' || s.class_id === classFilter) &&
    (!q || s.name.includes(q))
  );

  const toggleReceived = async (student) => {
    if (busyId) return;
    if (student.received_at && !window.confirm(`إلغاء علامة الاستلام لـ "${student.name}"؟`)) return;
    setBusyId(student.id);
    try {
      if (student.received_at) {
        await unmarkGiftReceived(student.id, month, year);
        showToast('اتلغت علامة الاستلام', student.name, 0, 'success');
      } else {
        await markGiftReceived(student.id, month, year, currentUser?.id);
        showToast('تم الاستلام 🎁', `${student.name} استلمت هديتها`, 0, 'success');
      }
      triggerRefresh();
    } catch (err) {
      showToast('خطأ', err.message || 'حدث خطأ، حاول تاني', 0, 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 dir-rtl text-right">

      {/* Banner + month switcher */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-700 rounded-3xl p-6 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
              <Cake className="w-3.5 h-3.5" /> أعياد الميلاد
            </span>
            <h2 className="text-2xl font-black">حفلة أعياد ميلاد {ARABIC_MONTHS[month - 1]}</h2>
            <p className="text-pink-100 text-xs mt-1">
              الحفلة آخر خميس في الشهر: <span className="font-black text-white">الخميس {partyDay} {ARABIC_MONTHS[month - 1]} {year}</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <Gift className="w-8 h-8 text-amber-200" />
          </div>
        </div>

        <div className="flex items-center justify-between bg-black/15 rounded-2xl p-1.5">
          <button type="button" onClick={() => shiftMonth(-1)} className="w-10 h-10 rounded-xl hover:bg-white/15 flex items-center justify-center" aria-label="الشهر اللي فات">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="text-center">
            <span className="block font-black text-lg">{ARABIC_MONTHS[month - 1]} {year}</span>
            {!isCurrentMonth && (
              <button type="button" onClick={() => { setMonth(today.month); setYear(today.year); }} className="text-[11px] font-bold text-pink-100 underline">
                ارجع للشهر الحالي
              </button>
            )}
          </div>
          <button type="button" onClick={() => shiftMonth(1)} className="w-10 h-10 rounded-xl hover:bg-white/15 flex items-center justify-center" aria-label="الشهر الجاي">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isPartyToday && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          <PartyPopper className="w-6 h-6 shrink-0" />
          <p className="text-sm font-black">النهارده الحفلة! دوس "تم الاستلام" قدام كل مخدومة وهي بتاخد هديتها.</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryTile label="عيد ميلادهم الشهر ده" value={loading ? '…' : list.length} tone="pink" />
        <SummaryTile label="استلمت الهدية" value={loading ? '…' : receivedCount} tone="emerald" />
        <SummaryTile label="لسه" value={loading ? '…' : pendingCount} tone={partyPassed && pendingCount > 0 ? 'rose' : 'slate'} />
      </div>

      <PushToggle />

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">

        {/* Filters */}
        <div className="flex gap-1.5">
          {[
            { id: 'all', label: `الكل (${list.length})` },
            { id: 'pending', label: `لسه ما استلمتش (${pendingCount})` },
            { id: 'received', label: `استلمت (${receivedCount})` },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`flex-1 px-2 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all ${
                statusFilter === f.id ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم..."
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
            aria-label="فلترة بالفصل"
          >
            <option value="all">كل الفصول</option>
            {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {loadError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">{loadError}</div>
        )}

        {/* List */}
        {loading ? (
          <p className="text-center text-slate-400 text-xs py-10">جاري التحميل...</p>
        ) : list.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-10">
            مفيش مخدومات عيد ميلادها في {ARABIC_MONTHS[month - 1]}.
            <span className="block mt-1">(لازم يكون تاريخ الميلاد متسجل في بيانات المخدومة)</span>
          </p>
        ) : visible.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-10">مفيش أسماء مطابقة.</p>
        ) : (
          <div className="space-y-2">
            {visible.map(s => {
              const received = !!s.received_at;
              const busy = busyId === s.id;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                    received ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-pink-200 text-pink-700 flex flex-col items-center justify-center shrink-0 leading-none">
                    <span className="text-base font-black">{s.birth_day}</span>
                    <span className="text-[9px] font-bold mt-0.5">{ARABIC_MONTHS[month - 1]}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 text-sm truncate">{s.name}</p>
                    <p className="text-[11px] text-slate-500 font-bold truncate">
                      {getClassName(s.class_id)} · {s.age_turning} سنة
                    </p>
                    {received && (
                      <p className="text-[10px] text-emerald-700 font-bold truncate">
                        استلمت {new Date(s.received_at).toLocaleDateString('ar-EG')}{s.received_by ? ` — ${s.received_by}` : ''}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setWhatsappRecipient({ ...s, role: 'student' })}
                    className="w-9 h-9 rounded-xl bg-white border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0"
                    title="تهنئة على واتساب"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleReceived(s)}
                    disabled={busy}
                    className={`shrink-0 px-3 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                      received
                        ? 'bg-white text-emerald-700 border border-emerald-300'
                        : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                    }`}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : received ? <Undo2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {received ? 'استلمت ✅' : 'تم الاستلام'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WhatsAppModal
        isOpen={!!whatsappRecipient}
        onClose={() => setWhatsappRecipient(null)}
        recipient={whatsappRecipient}
      />
    </div>
  );
}

const TONES = {
  pink: 'bg-pink-50 border-pink-100 text-pink-700',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  rose: 'bg-rose-100 border-rose-200 text-rose-700',
  slate: 'bg-slate-50 border-slate-200 text-slate-700',
};

function SummaryTile({ label, value, tone }) {
  return (
    <div className={`rounded-2xl border p-3 text-center ${TONES[tone]}`}>
      <span className="block text-2xl font-black">{value}</span>
      <span className="block text-[10px] sm:text-[11px] font-bold mt-0.5">{label}</span>
    </div>
  );
}
