import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Award, TrendingUp, ChevronLeft, CalendarCheck, GraduationCap, Cake } from 'lucide-react';
import { getUsers, getAttendanceLogs, getServiceStats, CLASSES, getCairoToday, ARABIC_MONTHS } from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';
import ClassRosterModal from './ClassRosterModal';

// "حاضرة هذا الأسبوع" = حضرت خلال آخر 7 أيام (نفس تعريف كشف الفصل).
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function Analytics() {
  const { refreshKey } = usePoints();
  const [allUsers, setAllUsers] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [serviceStats, setServiceStats] = useState({ totalPointsDistributed: 0, attendanceRate: '0%', presentCount: 0 });
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setLoadError('');
    Promise.all([getUsers(), getAttendanceLogs(), getServiceStats()])
      .then(([users, logs, stats]) => {
        setAllUsers(users);
        setAttendanceLogs(logs);
        setServiceStats(stats);
      })
      .catch(err => setLoadError(err.message || 'تعذر تحميل الإحصائيات'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const students = allUsers.filter(u => u.role === 'student');
  const servantsCount = allUsers.filter(u => (u.role === 'servant' || u.role === 'admin') && (u.status || 'active') === 'active').length;

  const now = Date.now();
  const presentThisWeek = new Set(
    attendanceLogs
      .filter(l => now - new Date(l.timestamp).getTime() < WEEK_MS)
      .map(l => l.user_id)
  );

  const classCards = CLASSES.map(c => {
    const classStudents = students.filter(s => s.class_id === c.id);
    const present = classStudents.filter(s => presentThisWeek.has(s.id)).length;
    return { ...c, studentCount: classStudents.length, presentCount: present };
  });

  const stages = ['إعدادي', 'ثانوي', 'جامعيين'];

  // أعياد ميلاد الخدام في الشهر الحالي (كل خادم بيدخل تاريخ ميلاده من "بياناتي").
  const today = getCairoToday();
  const servantBirthdays = allUsers
    .filter(u => (u.role === 'servant' || u.role === 'admin') && (u.status || 'active') === 'active' && u.birth_date && Number(u.birth_date.slice(5, 7)) === today.month)
    .map(u => ({ ...u, day: Number(u.birth_date.slice(8, 10)) }))
    .sort((a, b) => a.day - b.day);

  return (
    <div className="space-y-6 dir-rtl text-right">

      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-purple-700 rounded-3xl p-6 text-white shadow-md flex items-center justify-between relative overflow-hidden">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> الإحصائيات العامة
          </span>
          <h2 className="text-2xl font-black">خدمة إعدادي وثانوي بنات</h2>
          <p className="text-sky-100 text-xs mt-1">عدد المخدومات وحضور الأسبوع ده في كل فصل</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sky-200 shrink-0 shadow-inner">
          <Award className="w-10 h-10" />
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">{loadError}</div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} tone="sky" label="المخدومات" value={loading ? '…' : students.length} />
        <StatCard icon={CalendarCheck} tone="emerald" label="حضرت الأسبوع ده" value={loading ? '…' : `${serviceStats.presentCount} (${serviceStats.attendanceRate})`} />
        <StatCard icon={Award} tone="amber" label="نقاط اتوزعت" value={loading ? '…' : serviceStats.totalPointsDistributed} />
        <StatCard icon={UserCheck} tone="indigo" label="الخدام" value={loading ? '…' : servantsCount} />
      </div>

      {servantBirthdays.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-200 space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-600" /> أعياد ميلاد الخدام في {ARABIC_MONTHS[today.month - 1]}
          </h3>
          <div className="flex flex-wrap gap-2">
            {servantBirthdays.map(s => (
              <span
                key={s.id}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  s.day === today.day ? 'bg-pink-600 text-white border-pink-600' : 'bg-pink-50 text-pink-800 border-pink-200'
                }`}
              >
                {s.name} — {s.day} {ARABIC_MONTHS[today.month - 1]}{s.day === today.day ? ' 🎉 النهارده' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Classes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-sky-600" /> الفصول
          </h3>
          <p className="text-[11px] text-slate-400 font-bold mt-1">اضغط على أي فصل عشان تشوف المخدومات فيه، ومين حاضرة ومين غايبة، وتسجّل حضور بلمسة 👇</p>
        </div>

        {stages.map(stage => (
          <div key={stage} className="space-y-2">
            <h4 className="text-xs font-black text-slate-500">{stage}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {classCards.filter(c => c.stage === stage).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClass(c)}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/50 hover:shadow-md transition-all text-right active:scale-[0.98] space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm`}>
                      {c.grade}
                    </div>
                    <span className="font-black text-slate-900 text-sm flex-1">{c.name}</span>
                    <ChevronLeft className="w-4 h-4 text-sky-400 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] font-bold">
                    <span className="text-slate-600">{c.studentCount} مخدومة</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                      حضرت الأسبوع ده: {c.presentCount}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ClassRosterModal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        classInfo={selectedClass}
        users={allUsers}
        attendanceLogs={attendanceLogs}
      />

    </div>
  );
}

const TONES = {
  sky: 'bg-sky-50 border-sky-100 text-sky-600',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  amber: 'bg-amber-50 border-amber-100 text-amber-600',
  indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
};

function StatCard({ icon: Icon, tone, label, value }) {
  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-2">
      <div className="min-w-0">
        <span className="text-[11px] font-bold text-slate-500 block">{label}</span>
        <span className="text-xl font-black text-slate-900 mt-1 block truncate">{value}</span>
      </div>
      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${TONES[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
