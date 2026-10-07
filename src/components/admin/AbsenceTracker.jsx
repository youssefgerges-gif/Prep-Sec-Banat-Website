import React, { useState, useEffect } from 'react';
import { CalendarX, Phone, Clock, AlertTriangle, Send, Search } from 'lucide-react';
import { getAbsenceReport, CLASSES, getClassName } from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';
import WhatsAppModal from '../common/WhatsAppModal';
import goodShepherdImg from '../../assets/good-shepherd.jpg';

export default function AbsenceTracker() {
  const { refreshKey } = usePoints();
  const [absentStudents, setAbsentStudents] = useState([]);
  const [minWeeks, setMinWeeks] = useState(2);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [whatsappRecipient, setWhatsappRecipient] = useState(null);
  const [classFilter, setClassFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // بنجيب كل المخدومات (min_weeks = 0)، و`minWeeks` بيستخدم هنا بس كحد
  // لـ"منتظمة / غير منتظمة" — مش بيشيل حد من القايمة.
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError('');
    getAbsenceReport(0)
      .then(data => { if (isMounted) setAbsentStudents(data); })
      .catch(err => { if (isMounted) setLoadError(err.message || 'تعذر تحميل سجل الافتقاد'); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [refreshKey]);

  const baseList = absentStudents.filter(s => classFilter === 'all' || s.class_id === classFilter);
  const trimmedQuery = searchQuery.trim();
  const visibleList = trimmedQuery
    ? baseList.filter(s => s.name.includes(trimmedQuery))
    : baseList;
  const irregularCount = baseList.filter(s => s.weeks_absent >= minWeeks).length;
  const countFor = (classId) => absentStudents.filter(s => classId === 'all' || s.class_id === classId).length;

  const classBadge = (classId) => (
    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] border inline-flex items-center gap-1 bg-sky-50 text-sky-800 border-sky-200">
      {getClassName(classId)}
    </span>
  );

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* Banner — the Good Shepherd image is now the full banner background
          itself (not a small icon box), with a dark rose overlay on top so
          the white text stays readable. */}
      <div className="relative rounded-3xl text-white shadow-md overflow-hidden">
        <img
          src={goodShepherdImg}
          alt="الراعي الصالح"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 35%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-rose-900/55"></div>
        <div className="relative p-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <CalendarX className="w-3.5 h-3.5" /> متابعة افتقاد الغائبات
          </span>
          <h2 className="text-xl sm:text-2xl font-black">سجل الافتقاد</h2>
          <p className="text-rose-100 text-xs mt-1 max-w-xl">
            المخدومات المنقطعات أو الغائبات في كل الفصول، مع رسائل افتقاد جاهزة على واتساب لولي الأمر
          </p>
        </div>
      </div>

      {/* Controls & Table Container */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">

        {/* Class filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[{ id: 'all', name: 'كل الفصول' }, ...CLASSES].map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setClassFilter(c.id)}
              className={`shrink-0 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                classFilter === c.id ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {c.name} ({countFor(c.id)})
            </button>
          ))}
        </div>

        {loadError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">{loadError}</div>
        )}

        {/* Search by name */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم..."
            className="w-full bg-slate-50 text-slate-900 font-semibold text-xs py-2.5 pr-10 pl-3 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {classFilter === 'all' ? 'كل الفصول' : getClassName(classFilter)} — {irregularCount} غير منتظمة
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">"غير منتظمة" لو غابت:</span>
            <select
              value={minWeeks}
              onChange={(e) => setMinWeeks(Number(e.target.value))}
              className="bg-slate-50 text-slate-900 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 cursor-pointer transition-all"
            >
              <option value={1}>أسبوع فأكثر</option>
              <option value={2}>أسبوعين فأكثر (الافتراضي)</option>
              <option value={3}>3 أسابيع فأكثر</option>
              <option value={4}>4 أسابيع فأكثر (انقطاع تام)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm">جاري حصر كشوفات الغياب... ⏳</div>
        ) : visibleList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm bg-slate-50 border border-slate-100 rounded-2xl p-4">
            {baseList.length === 0
              ? 'لسه مفيش مخدومات متسجلة هنا.'
              : `مفيش أسماء مطابقة لبحثك "${trimmedQuery}".`}
          </div>
        ) : (
          <>
            {/* Table — md screens and up */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200/80">
                    <th className="p-3.5">الاسم</th>
                    <th className="p-3.5">الفصل</th>
                    <th className="p-3.5">رقم ولي الأمر</th>
                    <th className="p-3.5">آخر حضور</th>
                    <th className="p-3.5">مدة الانقطاع</th>
                    <th className="p-3.5 text-center">إجراء الافتقاد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {visibleList.map((s) => (
                    <tr key={s.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black shrink-0 border border-rose-200/60">
                          {s.name[0]}
                        </div>
                        <div>
                          <div className="text-slate-900 font-bold flex items-center gap-1.5">
                            <span>{s.name}</span>
                            {s.weeks_absent < minWeeks ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[9px] inline-flex items-center gap-0.5 shrink-0">✅ منتظمة</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[9px] inline-flex items-center gap-0.5 shrink-0">⚠️ غير منتظمة</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">كود: {s.qr_code}</span>
                        </div>
                      </td>
                      <td className="p-3.5">{classBadge(s.class_id)}</td>
                      <td className="p-3.5 font-semibold text-slate-600">
                        <span className="flex items-center gap-1 dir-ltr justify-end">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone || 'غير مسجل'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{s.last_attended}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[11px] inline-flex items-center gap-1 border ${
                          s.weeks_absent >= 3 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          <Clock className="w-3 h-3" /> {s.weeks_absent} أسابيع غياب
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setWhatsappRecipient(s)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm inline-flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" /> اختيار نموذج واتساب
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card list — phones only, below md */}
            <div className="md:hidden space-y-3">
              {visibleList.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black shrink-0 border border-rose-200/60">
                      {s.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                        <span className="truncate">{s.name}</span>
                        {s.weeks_absent < minWeeks ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[9px] shrink-0">✅ منتظمة</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[9px] shrink-0">⚠️ غير منتظمة</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">كود: {s.qr_code}</p>
                    </div>
                    <div className="shrink-0">{classBadge(s.class_id)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-3 text-[11px]">
                    <div className="text-slate-500 truncate flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {s.phone || 'غير مسجل'}
                    </div>
                    <div className="text-slate-500 truncate">آخر حضور: <span className="font-bold text-slate-700">{s.last_attended}</span></div>
                    <div className="col-span-2">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[11px] inline-flex items-center gap-1 border ${
                        s.weeks_absent >= 3 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        <Clock className="w-3 h-3" /> {s.weeks_absent} أسابيع غياب
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setWhatsappRecipient(s)}
                    className="w-full mt-3 pt-3 border-t border-slate-200 py-2 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-xs shadow-sm inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> اختيار نموذج واتساب
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* WhatsApp Messaging Modal */}
      <WhatsAppModal
        isOpen={!!whatsappRecipient}
        onClose={() => setWhatsappRecipient(null)}
        recipient={whatsappRecipient}
      />

    </div>
  );
}
