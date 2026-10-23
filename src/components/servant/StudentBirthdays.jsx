import React, { useState, useEffect, useMemo } from 'react';
import { Cake, ChevronDown, ChevronUp } from 'lucide-react';
import { getManualAttendanceRoster, CLASSES } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';

// طلب Mr. Gerges 2026-10-23: أعياد ميلاد المخدومين تظهر لكل الخدام.
// بتقرأ من نفس get_manual_attendance_roster() اللي شاشة الحضور اليدوي
// بتستخدمها (بترجع birth_date أصلاً من 2026-09-27)، فمفيش أي تعديل في قاعدة
// البيانات: الخادم / أمين الفصل / المساعد بيشوفوا مخدومين فصلهم هم بس
// (السيرفر هو اللي بيقفل النطاق ده)، وأمين الخدمة بيشوف كل الفصول.
// تاريخ الميلاد بيتقرا كنص YYYY-MM-DD مباشرة (من غير new Date) عشان فرق
// التوقيت ميزحزحش اليوم. الكارت ما بيظهرش خالص لو مفيش ولا عيد ميلاد
// الشهر ده، عشان الشاشة ما تتزنقش بكارت فاضي.
const COLLAPSED_COUNT = 4;

export function parseBirth(str) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(str));
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function StudentBirthdays() {
  const { currentUser } = useAuth();
  const { refreshKey } = usePoints();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [roster, setRoster] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    getManualAttendanceRoster({ role: currentUser.role, class_id: currentUser.class_id })
      .then(rows => { if (isMounted) setRoster(rows || []); })
      .catch(() => { if (isMounted) setRoster([]); });
    return () => { isMounted = false; };
  }, [currentUser?.role, currentUser?.class_id, refreshKey]);

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const today = now.getDate();
  const thisYear = now.getFullYear();

  const birthdays = useMemo(() => (
    (roster || [])
      .filter(u => u.role === 'student')
      .map(u => ({ ...u, _b: parseBirth(u.birth_date) }))
      .filter(u => u._b && u._b.month === thisMonth)
      .sort((a, b) => a._b.day - b._b.day || a.name.localeCompare(b.name, 'ar'))
  ), [roster, thisMonth]);

  if (birthdays.length === 0) return null;

  const visible = expanded ? birthdays : birthdays.slice(0, COLLAPSED_COUNT);

  return (
    <div className="max-w-xl mx-auto mb-6 bg-gradient-to-l from-amber-50 to-rose-50 rounded-3xl p-5 border-2 border-dashed border-amber-300 shadow-sm space-y-3 dir-rtl text-right">
      <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
        <Cake className="w-5 h-5 text-amber-600" />
        أعياد ميلاد المخدومين شهر {MONTH_NAMES[thisMonth - 1]} ({birthdays.length})
      </h3>

      <div className="grid grid-cols-1 gap-2">
        {visible.map(u => {
          const isToday = u._b.day === today;
          const isPast = u._b.day < today;
          const className = isSuperAdmin ? CLASSES.find(c => c.id === u.class_id)?.name : null;
          const turning = thisYear - u._b.year;
          return (
            <div
              key={u.id}
              className={`flex items-center justify-between gap-2.5 rounded-2xl p-3 border ${
                isToday
                  ? 'bg-amber-100 border-amber-400 shadow-sm'
                  : isPast
                    ? 'bg-white/50 border-amber-200/50 opacity-70'
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
                    {u._b.day} {MONTH_NAMES[thisMonth - 1]}
                    {turning > 0 && turning < 40 ? ` · هيكمل ${turning} سنة` : ''}
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

      {birthdays.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-extrabold text-amber-800 hover:text-amber-900 py-1.5 transition-colors"
        >
          {expanded ? (<><ChevronUp className="w-4 h-4" /> عرض أقل</>) : (<><ChevronDown className="w-4 h-4" /> عرض الكل ({birthdays.length})</>)}
        </button>
      )}
    </div>
  );
}
