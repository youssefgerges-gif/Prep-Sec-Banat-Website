import React, { useEffect, useState } from 'react';
import { CalendarCheck, Search, TrendingUp, Users } from 'lucide-react';
import { getServantAttendanceLog, getServantMeetingAttendanceLog, CLASSES } from '../../services/supabase';

const ROLE_LABELS = {
  class_admin: 'أمين فصل',
  assistant_admin: 'أمين فصل مساعد',
  servant: 'خادم'
};

// موسم متابعة غياب/حضور الخدام: مدارس الأحد بتقابل يوم الجمعة الساعة 5:30
// عصرًا (رغم الاسم)، وموسم المتابعة ده بيبدأ من جمعة 25 سبتمبر 2026 لغاية
// جمعة 18 سبتمبر 2027 — نفس التواريخ بالظبط المحسوبة سيرفر سايد جوه
// get_servant_attendance_log() في schema.sql.
const SEASON_START_LABEL = '25 سبتمبر 2026';
const SEASON_END_LABEL = '18 سبتمبر 2027';

function attendanceBarColor(percent) {
  if (percent >= 75) return 'bg-emerald-500';
  if (percent >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

// طلب 2026-09-23: "عايز غياب الاجتماع دا يبقي منفصل عن غياب مدارس الاحد
// للخدام دا ليه نسبة و دا ليه نسبة" — نفس الشاشة، تبويبين منفصلين تمامًا:
// حضور مدارس الأحد (زي ما كان) وحضور اجتماع الخدام (جديد، بيانات وحساب نسبة
// مختلفين تمامًا — انظر get_servant_meeting_attendance_log() في schema.sql).
// بنوحّد شكل الصفوف هنا (attended/total) عشان الجدول تحت يتعامل مع
// المصدرين بنفس الكود، من غير ما يهتم بأسماء الأعمدة المختلفة اللي راجعة
// من كل دالة (total_fridays/attended_fridays مقابل total_meetings/attended_meetings).
const TABS = [
  { key: 'sunday_school', label: 'حضور مدارس الأحد', icon: CalendarCheck },
  { key: 'servants_meeting', label: 'حضور اجتماع الخدام', icon: Users }
];

export default function ServantAttendanceLog() {
  const [activeTab, setActiveTab] = useState('sunday_school');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const fetcher = activeTab === 'servants_meeting' ? getServantMeetingAttendanceLog : getServantAttendanceLog;
    fetcher()
      .then(data => {
        if (isMounted) {
          const normalized = (data || []).map(r => ({
            ...r,
            attended: activeTab === 'servants_meeting' ? r.attended_meetings : r.attended_fridays,
            total: activeTab === 'servants_meeting' ? r.total_meetings : r.total_fridays
          }));
          setRows(normalized);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) setError(err.message || (activeTab === 'servants_meeting' ? 'تعذر تحميل سجل حضور اجتماع الخدام' : 'تعذر تحميل سجل حضور الخدام'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [activeTab]);

  const totalSoFar = rows[0]?.total ?? 0;
  const trimmedQuery = searchQuery.trim();

  const visibleRows = rows
    .filter(r => classFilter === 'all' || r.class_id === classFilter)
    .filter(r => !trimmedQuery || r.name.includes(trimmedQuery));

  const className = (classId) => CLASSES.find(c => c.id === classId)?.name || '—';
  const countColumnLabel = activeTab === 'servants_meeting' ? 'عدد الاجتماعات الحاضرة' : 'عدد الجُمع الحاضرة';

  return (
    <div className="space-y-6 dir-rtl text-right">

      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-sky-700 to-indigo-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between relative">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
              <CalendarCheck className="w-3.5 h-3.5" /> سجل غياب وحضور الخدام
            </span>
            {activeTab === 'servants_meeting' ? (
              <h2 className="text-xl sm:text-2xl font-black">حضور اجتماع الخدام (اجتماع أبونا بالخدام)</h2>
            ) : (
              <h2 className="text-xl sm:text-2xl font-black">موسم متابعة الحضور {SEASON_START_LABEL} — {SEASON_END_LABEL}</h2>
            )}
            <p className="text-sky-100 text-xs mt-1">
              {activeTab === 'servants_meeting'
                ? 'النسبة محسوبة على عدد الاجتماعات اللي فعلاً اتسجل فيها حضور — مش تاريخ موسم ثابت، لأن معاد الاجتماع تقريبي (كل أسبوعين)'
                : 'النسبة محسوبة على جُمع موسم مدارس الأحد الثابت (الجمعة 5:30 عصرًا)'}
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sky-200 shrink-0 shadow-inner">
            <TrendingUp className="w-10 h-10" />
          </div>
        </div>

        {/* Tab switcher — طلب 2026-09-23: نسبتين منفصلتين تمامًا */}
        <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl backdrop-blur-md">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setSearchQuery(''); setClassFilter('all'); }}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === t.key ? 'bg-white text-indigo-800 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls & Table Container */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search by name */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الخادم..."
              className="w-full bg-slate-50 text-slate-900 font-semibold text-xs py-2.5 pr-10 pl-3 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 text-slate-900 font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer transition-all"
          >
            <option value="all">كل الفصول</option>
            {CLASSES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm">جاري تحميل سجل الحضور... ⏳</div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 font-bold text-sm bg-rose-50 border border-rose-100 rounded-2xl p-4">{error}</div>
        ) : totalSoFar === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm bg-slate-50 border border-slate-100 rounded-2xl p-4">
            {activeTab === 'servants_meeting'
              ? 'لسه مفيش أي اجتماع خدام اتسجل له حضور — سجّل حضور أول اجتماع من شاشة "تسجيل حضور" 📋'
              : `موسم متابعة حضور الخدام لسه ما بدأش — هيبدأ من أول جمعة ${SEASON_START_LABEL} 📅`}
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm bg-slate-50 border border-slate-100 rounded-2xl p-4">
            لا يوجد خدام مطابقين لبحثك.
          </div>
        ) : (
          <>
            {/* Table — md screens and up */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200/80">
                    <th className="p-3.5">الاسم</th>
                    <th className="p-3.5">الصفة</th>
                    <th className="p-3.5">الفصل</th>
                    <th className="p-3.5">{countColumnLabel}</th>
                    <th className="p-3.5">نسبة الحضور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {visibleRows.map((r) => (
                    <tr key={r.id} className="hover:bg-sky-50/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-black shrink-0 border border-sky-200/60">
                          {r.name[0]}
                        </div>
                        <span>{r.name}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] border bg-indigo-50 text-indigo-800 border-indigo-100 inline-flex items-center gap-1">
                          {ROLE_LABELS[r.role] || r.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-semibold">{className(r.class_id)}</td>
                      <td className="p-3.5 font-bold text-slate-700">{r.attended} / {r.total}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
                            <div
                              className={`h-full rounded-full ${attendanceBarColor(r.attendance_percent)}`}
                              style={{ width: `${Math.min(100, r.attendance_percent)}%` }}
                            />
                          </div>
                          <span className="font-black text-[11px] text-slate-700 w-10 shrink-0">{r.attendance_percent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card list — phones only, below md */}
            <div className="md:hidden space-y-3">
              {visibleRows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-black shrink-0 border border-sky-200/60">
                      {r.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-sm truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{ROLE_LABELS[r.role] || r.role} — {className(r.class_id)}</p>
                    </div>
                    <span className="shrink-0 font-black text-xs text-slate-700">{r.attended}/{r.total}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${attendanceBarColor(r.attendance_percent)}`}
                        style={{ width: `${Math.min(100, r.attendance_percent)}%` }}
                      />
                    </div>
                    <span className="font-black text-[11px] text-slate-700">{r.attendance_percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
