import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Sparkles, TrendingUp, TrendingDown, CalendarCheck } from 'lucide-react';
import { getClassLeaderboard, getClassAttendanceRanking, CLASSES, DEFAULT_CLASS_ID } from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';

export default function ClassLeaderboard() {
  const { refreshKey } = usePoints();
  // أي خادم يقدر يختار أي فصل من الـ 6.
  const [selectedClass, setSelectedClass] = useState(DEFAULT_CLASS_ID);

  const currentClassInfo = CLASSES.find(c => c.id === selectedClass) || CLASSES[0];

  // طلب 2026-09-20: تابين بدل شاشة واحدة — "النقاط" (زي ما كانت، كانت
  // بتتسمى "الكوبونات" أيام خاصية الهدايا اللي اتشالت خالص) و"الحضور"
  // (جديد)، واللي بداخله بردو تاب فرعي "الأكثر حضورًا"/"الأقل حضورًا" عشان
  // نعرف نفتقد مين.
  const [activeTab, setActiveTab] = useState('points'); // 'points' | 'attendance'
  const [attendanceView, setAttendanceView] = useState('most'); // 'most' | 'least'

  const [leaderboard, setLeaderboard] = useState([]);
  const [attendanceRanking, setAttendanceRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const request = activeTab === 'points'
      ? getClassLeaderboard(selectedClass).then(data => { if (isMounted) setLeaderboard(data); })
      : getClassAttendanceRanking(selectedClass).then(data => { if (isMounted) setAttendanceRanking(data); });

    request
      .catch(() => { if (isMounted) { setLeaderboard([]); setAttendanceRanking([]); } })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, refreshKey, activeTab]);

  // "الأكثر حضورًا" بيستخدم نفس القايمة اللي راجعة من الخادم (مرتبة تنازليًا
  // أصلاً)، و"الأقل حضورًا" بتاخد نفس القايمة مقلوبة — عشان ده اللي هيفيد في
  // معرفة مين يحتاج متابعة/افتقاد.
  const rankedAttendance = attendanceView === 'most'
    ? attendanceRanking
    : [...attendanceRanking].reverse();

  return (
    <div className="space-y-6 dir-rtl text-right">

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">

        {/* Header + class picker */}
        <div className="space-y-3 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-base">لوحة الصدارة — {currentClassInfo.name}</h3>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CLASSES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClass(c.id)}
                className={`shrink-0 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                  selectedClass === c.id ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main tabs: النقاط / الحضور */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('points')}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'points' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" /> النقاط
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'attendance' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarCheck className="w-4 h-4" /> الحضور
          </button>
        </div>

        {/* Attendance sub-tabs: الأكثر / الأقل حضورًا */}
        {activeTab === 'attendance' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAttendanceView('most')}
              className={`flex-1 py-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border transition-all ${
                attendanceView === 'most'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> الأكثر حضورًا
            </button>
            <button
              onClick={() => setAttendanceView('least')}
              className={`flex-1 py-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border transition-all ${
                attendanceView === 'least'
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> الأقل حضورًا (للمتابعة)
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm">
            جاري التحميل... ⏳
          </div>
        ) : activeTab === 'points' ? (
          leaderboard.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-sm">
              لسه مفيش مخدومات متسجلة في الفصل ده.
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((student, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;

                return (
                  <div
                    key={student.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 card-hover ${
                      isFirst
                        ? 'bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-amber-300 shadow-sm'
                        : isSecond
                        ? 'bg-slate-100/60 border-slate-200'
                        : isThird
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 flex items-center justify-center">
                        {isFirst ? (
                          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-sm border border-amber-300">
                            <Crown className="w-6 h-6 fill-amber-900 text-amber-900" />
                          </div>
                        ) : isSecond ? (
                          <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-800 flex items-center justify-center font-black shadow-sm border border-slate-300">
                            <Medal className="w-6 h-6 text-slate-700" />
                          </div>
                        ) : isThird ? (
                          <div className="w-10 h-10 rounded-2xl bg-amber-700/80 text-white flex items-center justify-center font-black shadow-sm">
                            <Medal className="w-6 h-6 text-amber-200" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                            #{index + 1}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          {student.name}
                          {isFirst && (
                            <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-black">
                              المركز الأول 🥇
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">كود: {student.qr_code}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-sm border border-amber-400 shrink-0">
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span className="text-base">{student.total_points || 0}</span>
                      <span className="text-xs font-normal">نقطة</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : rankedAttendance.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-sm">
            لسه مفيش مخدومات عدّى عليهم أسبوع كامل من انضمامهم في الفصل ده.
          </div>
        ) : (
          <div className="space-y-3">
            {rankedAttendance.map((student, index) => {
              const percent = student.attendance_percent ?? 0;
              const isGood = percent >= 70;
              const isLow = percent < 40;

              return (
                <div
                  key={student.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 card-hover ${
                    isLow
                      ? 'bg-rose-50/60 border-rose-200'
                      : isGood
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50/60 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{student.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        حضر {student.attended_weeks} من {student.elapsed_weeks} أسبوع منذ انضمامه
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 font-black px-4 py-2 rounded-2xl shadow-sm border shrink-0 ${
                      isLow
                        ? 'bg-rose-500 text-white border-rose-400'
                        : isGood
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-slate-400 text-white border-slate-300'
                    }`}
                  >
                    <span className="text-base">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
