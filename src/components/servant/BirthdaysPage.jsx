import React, { useState, useEffect, useMemo } from 'react';
import { Cake, ChevronRight, ChevronLeft } from 'lucide-react';
import { getManualAttendanceRoster, CLASSES } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';
import { parseBirth, MONTH_NAMES } from './StudentBirthdays';

// طلب Mr. Gerges 2026-10-23: شاشة منفصلة "أعياد الميلاد" فيها اختيار الشهر
// (عشان يقدر يشوف الشهور اللي عدّت والجاية، مش بس الشهر الحالي زي الكارت
// اللي فوق شاشة الحضور). نفس مصدر البيانات: get_manual_attendance_roster()
// (مفيش تعديل في قاعدة البيانات) — الخادم / أمين الفصل / المساعد بيشوفوا
// مخدومين فصلهم بس (السيرفر هو اللي بيقفل النطاق)، وأمين الخدمة بيشوف كل
// الفصول وكمان تبويب "الخدام" (القايمة بترجعله الخدام برضو).
export default function BirthdaysPage() {
  const { currentUser } = useAuth();
  const { refreshKey } = usePoints();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [group, setGroup] = useState('student'); // 'student' | 'servant' (أمين الخدمة بس)
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    setLoading(true);
    getManualAttendanceRoster({ role: currentUser.role, class_id: currentUser.class_id })
      .then(rows => { if (isMounted) setRoster(rows || []); })
      .catch(() => { if (isMounted) setRoster([]); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [currentUser?.role, currentUser?.class_id, refreshKey]);

  const people = useMemo(() => (
    (roster || [])
      .filter(u => (group === 'student' ? u.role === 'student' : u.role !== 'student'))
      .map(u => ({ ...u, _b: parseBirth(u.birth_date) }))
  ), [roster, group]);

  const withDate = people.filter(u => u._b);
  const missingCount = people.length - withDate.length;
  const monthList = withDate
    .filter(u => u._b.month === month)
    .sort((a, b) => a._b.day - b._b.day || a.name.localeCompare(b.name, 'ar'));

  const isCurrentMonth = month === now.getMonth() + 1;
  const today = now.getDate();
  const thisYear = now.getFullYear();

  const shiftMonth = (delta) => setMonth(m => ((m - 1 + delta + 12) % 12) + 1);

  return (
    <div className="space-y-5 dir-rtl text-right max-w-2xl mx-auto">
      {/* Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-l from-amber-500 to-rose-500 p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
            <Cake className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">أعياد الميلاد</h2>
            <p className="text-amber-50 text-xs mt-1">
              {isSuperAdmin ? 'كل الفصول' : 'مخدومين فصلك'} — اختار أي شهر تشوف أعياد ميلاده
            </p>
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
          {[['student', 'المخدومين'], ['servant', 'الخدام']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setGroup(key)}
              className={`py-2 rounded-lg text-xs font-extrabold transition-all ${
                group === key ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Month picker */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
          title="الشهر اللي قبله"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-extrabold text-sm text-center"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>{name}{i + 1 === now.getMonth() + 1 ? ' (الشهر ده)' : ''}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
          title="الشهر اللي بعده"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-400 font-bold text-sm">جاري التحميل... ⏳</div>
      ) : monthList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 font-medium text-sm">
          مفيش أعياد ميلاد مسجلة في شهر {MONTH_NAMES[month - 1]}
        </div>
      ) : (
        <div className="bg-gradient-to-l from-amber-50 to-rose-50 rounded-3xl p-5 border-2 border-dashed border-amber-300 shadow-sm space-y-3">
          <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
            <Cake className="w-5 h-5 text-amber-600" />
            شهر {MONTH_NAMES[month - 1]} ({monthList.length})
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {monthList.map(u => {
              const isToday = isCurrentMonth && u._b.day === today;
              const isPast = isCurrentMonth && u._b.day < today;
              const className = isSuperAdmin ? CLASSES.find(c => c.id === u.class_id)?.name : null;
              const age = thisYear - u._b.year;
              return (
                <div
                  key={u.id}
                  className={`flex items-center justify-between gap-2.5 rounded-2xl p-3 border ${
                    isToday ? 'bg-amber-100 border-amber-400 shadow-sm'
                      : isPast ? 'bg-white/50 border-amber-200/50 opacity-70'
                      : 'bg-white/80 border-amber-200/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {u.name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-900 truncate">{u.name}</span>
                      <span className="block text-[10px] text-amber-700 font-bold">
                        {u._b.day} {MONTH_NAMES[month - 1]}
                        {age > 0 && age < 40 ? ` · ${isCurrentMonth && !isPast && !isToday ? 'هيكمل' : 'كمّل'} ${age} سنة` : ''}
                        {className ? ` · ${className}` : ''}
                      </span>
                    </div>
                  </div>
                  {isToday && (
                    <span className="shrink-0 text-[11px] font-black text-amber-900 bg-amber-300 px-2.5 py-1 rounded-full">
                      🎉 النهاردة
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && missingCount > 0 && (
        <p className="text-[11px] text-slate-400 font-medium text-center">
          {missingCount} {group === 'student' ? 'مخدوم' : 'خادم'} من غير تاريخ ميلاد مسجل، فمش بيظهروا هنا.
        </p>
      )}
    </div>
  );
}
