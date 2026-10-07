import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, Award, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';
import { getStudentHistory } from '../../services/supabase';

export default function HistoryTimeline() {
  const { currentUser, allUsers } = useAuth();
  const { refreshKey } = usePoints();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentUsers = allUsers.filter(u => u.role === 'student');
  const currentStudent = currentUser?.role === 'student' ? currentUser : studentUsers[0];

  useEffect(() => {
    if (currentStudent) {
      setLoading(true);
      getStudentHistory(currentStudent.id).then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [currentStudent, refreshKey]);

  if (!currentStudent) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6 dir-rtl text-right">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-purple-700 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <Clock className="w-3.5 h-3.5" /> سجل المعاملات والنواط
          </span>
          <h2 className="text-2xl font-black">حركات النقاط والحضور</h2>
          <p className="text-sky-100 text-xs mt-1">سجل زمني مفصل لعمليات الحضور والنقاط لـ {currentStudent.name}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
          <Calendar className="w-8 h-8" />
        </div>
      </div>

      {/* Timeline Container */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 space-y-4 transition-colors duration-300">
        <h3 className="font-extrabold text-slate-800 text-base mb-2">التسلسل الزمني للخدمة</h3>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm">جاري تحميل السجل... ⏳</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">لسه مفيش نقاط أو حضور متسجل.</div>
        ) : (
          <div className="relative border-r-2 border-slate-100 pr-6 space-y-6 mr-2">
            {history.map((item) => {
              const isPositive = Number(item.amount) > 0;
              const dateStr = new Date(item.created_at).toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}></div>

                  {/* Transaction Box */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl text-white font-bold shrink-0 ${
                        isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">{item.reason}</h4>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{dateStr}</span>
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 ${
                      isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isPositive ? `+${item.amount}` : item.amount} نقطة
                    </div>
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
