import React, { useEffect, useState } from 'react';
import { Cake, PartyPopper, X } from 'lucide-react';
import { getBirthdays, getCairoToday, getLastThursday, ARABIC_MONTHS } from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';

// ملخص أعياد ميلاد الشهر الحالي (بتوقيت القاهرة) — بيستخدمه البانر فوق
// وعلامة العدد على تاب "أعياد الميلاد".
export function useBirthdaySummary(enabled) {
  const { refreshKey } = usePoints();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!enabled) { setSummary(null); return; }
    let mounted = true;
    const { year, month, day } = getCairoToday();
    getBirthdays(month, year)
      .then(list => {
        if (!mounted) return;
        const received = list.filter(s => s.received_at).length;
        setSummary({
          year, month, day,
          total: list.length,
          received,
          pending: list.length - received,
          partyDay: getLastThursday(year, month)
        });
      })
      .catch(() => { if (mounted) setSummary(null); });
    return () => { mounted = false; };
  }, [enabled, refreshKey]);

  return summary;
}

const readDismissed = (key) => {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
};
const writeDismissed = (key) => {
  try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
};

// تنبيه جوه الموقع للخدام:
// - طول الشهر (لحد ما الخادم يقفله): عدد أعياد الميلاد وميعاد الحفلة.
// - يوم الحفلة (آخر خميس): تذكير بعدد اللي لسه ما استلموش — بيرجع يظهر
//   يوم الحفلة حتى لو كان اتقفل قبل كده.
export default function BirthdayBanner({ summary, onOpen }) {
  const [, force] = useState(0);
  if (!summary || summary.total === 0) return null;

  const monthName = ARABIC_MONTHS[summary.month - 1];
  const isPartyDay = summary.day === summary.partyDay;
  const key = isPartyDay
    ? `banat_bday_party_${summary.year}_${summary.month}`
    : `banat_bday_month_${summary.year}_${summary.month}`;

  if (readDismissed(key)) return null;
  if (isPartyDay && summary.pending === 0) return null;
  if (!isPartyDay && summary.day > summary.partyDay) return null; // الحفلة خلصت

  const dismiss = (e) => {
    e.stopPropagation();
    writeDismissed(key);
    force(x => x + 1);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-l from-pink-50 to-amber-50 border border-pink-200 cursor-pointer hover:shadow-sm transition-shadow dir-rtl text-right"
    >
      <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0">
        {isPartyDay ? <PartyPopper className="w-5 h-5" /> : <Cake className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        {isPartyDay ? (
          <>
            <p className="text-sm font-black text-slate-900">النهارده حفلة أعياد ميلاد {monthName} 🎉</p>
            <p className="text-xs font-bold text-slate-600">لسه {summary.pending} من {summary.total} ما استلموش هداياهم — دوس هنا وعلّم على كل واحدة وهي بتستلم.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-black text-slate-900">شهر {monthName} فيه {summary.total} {summary.total > 10 || summary.total === 1 ? 'مخدومة' : 'مخدومات'} عيد ميلادهم 🎂</p>
            <p className="text-xs font-bold text-slate-600">جهّزوا {summary.total} {summary.total > 10 || summary.total === 1 ? 'هدية' : 'هدايا'} — الحفلة الخميس {summary.partyDay} {monthName}. دوس هنا للأسماء.</p>
          </>
        )}
      </div>
      <button type="button" onClick={dismiss} className="w-8 h-8 rounded-lg bg-white/80 text-slate-500 flex items-center justify-center shrink-0" aria-label="إخفاء">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
