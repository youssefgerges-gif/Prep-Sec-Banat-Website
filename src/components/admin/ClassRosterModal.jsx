import React, { useMemo, useState } from 'react';
import { UserX, Undo2, Users, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import { recordAttendance, cancelAttendance } from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';

// "حاضر" here means: attended within the last 7 days (same rolling window
// getServiceStats() in supabase.js already uses for its own weekly
// attendance-rate calculation) — matches a weekly Sunday-meeting rhythm
// without needing a separate "which week is this" concept.
const PRESENT_WINDOW_DAYS = 7;

export default function ClassRosterModal({ isOpen, onClose, classInfo, users, attendanceLogs }) {
  const { showToast, triggerRefresh } = usePoints();
  // تسجيل حضور بلمسة على اسم أي مخدومة غايبة (ولمسة تانية تلغيه).
  const [markingId, setMarkingId] = useState(null);

  // آخر سجل حضور لكل مخدومة (من قاعدة البيانات)، عشان التراجع يشتغل في أي
  // وقت مش بس في نفس الجلسة. "حاضرة" = حضرت خلال آخر 7 أيام، فمستحيل تلغي
  // بالغلط حضور أقدم من أسبوع.
  const lastAttendedMap = useMemo(() => {
    const map = new Map();
    (attendanceLogs || []).forEach(log => {
      const t = new Date(log.timestamp);
      const prev = map.get(log.user_id);
      if (!prev || t > prev.date) {
        map.set(log.user_id, { id: log.id, timestamp: log.timestamp, date: t });
      }
    });
    return map;
  }, [attendanceLogs]);

  const isPresent = (userId) => {
    const last = lastAttendedMap.get(userId);
    if (!last) return false;
    const days = (new Date() - last.date) / (1000 * 60 * 60 * 24);
    return days < PRESENT_WINDOW_DAYS;
  };

  // نص بسيط زي "النهاردة"/"إمبارح"/"من 3 أيام" تحت أي حد "حاضر" — عشان لما
  // تلغي حضور حد مسجل من كام يوم (مش دلوقتي)، تبقى فاهم إنت بتلغي إيه بالظبط.
  const formatRelativeDays = (date) => {
    const days = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'اليوم';
    if (days === 1) return 'إمبارح';
    return `من ${days} أيام`;
  };

  const handleMarkPresent = async (person, present) => {
    if (markingId) return;

    setMarkingId(person.id);
    try {
      if (present) {
        const last = lastAttendedMap.get(person.id);
        if (!last) return; // لن يحدث عمليًا — present مبني على نفس الـmap
        await cancelAttendance({
          attendanceLogId: last.id,
          studentId: person.id,
          timestamp: last.timestamp
        });
        triggerRefresh();
        showToast('تم إلغاء الحضور ⏪', `اتلغى حضور ${person.name}`, 0, 'success');
      } else {
        const res = await recordAttendance(person.qr_code);
        triggerRefresh();
        showToast(
          'تم تسجيل الحضور ✅',
          `${person.name}: ${res.onTime ? 'في الميعاد' : 'متأخر'} +${res.pointsAdded} ${res.pointsAdded > 2 ? 'نقاط' : 'نقطة'}`,
          0,
          'success'
        );
      }
    } catch (err) {
      showToast('تعذر تنفيذ العملية', err.message || 'حدث خطأ، حاول مرة أخرى', 0, 'error');
    } finally {
      setMarkingId(null);
    }
  };

  if (!classInfo) return null;

  const students = (users || [])
    .filter(u => u.role === 'student' && u.class_id === classInfo.id)
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const studentsPresent = students.filter(u => isPresent(u.id)).length;

  const renderRow = (person) => {
    const present = isPresent(person.id);
    const marking = markingId === person.id;
    const last = present ? lastAttendedMap.get(person.id) : null;

    return (
      <button
        key={person.id}
        type="button"
        onClick={() => handleMarkPresent(person, present)}
        disabled={marking}
        title={!present ? 'اضغط لتسجيل حضورها الآن' : 'اضغط لإلغاء حضورها'}
        className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all text-right ${
          !present
            ? 'bg-slate-50 border-slate-200/70 hover:border-sky-400 hover:bg-sky-50/60 active:scale-[0.99] cursor-pointer'
            : 'bg-emerald-50/60 border-emerald-200 hover:border-amber-400 hover:bg-amber-50/60 active:scale-[0.99] cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0">
            {person.name?.[0]}
          </div>
          <span className="block text-xs font-bold text-slate-900 truncate min-w-0">{person.name}</span>
        </div>
        <span className="shrink-0 flex flex-col items-end gap-0.5">
          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${
              present
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-rose-100 text-rose-800 border-rose-200'
            }`}
          >
            {marking ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : present ? (
              <Undo2 className="w-3 h-3" />
            ) : (
              <UserX className="w-3 h-3" />
            )}
            {marking ? (present ? 'جاري الإلغاء...' : 'جاري التسجيل...') : present ? 'حاضرة' : 'غايبة'}
          </span>
          {present && last && !marking && (
            <span className="text-[9px] text-slate-400 font-bold pl-1">{formatRelativeDays(last.date)}</span>
          )}
        </span>
      </button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`فصل ${classInfo.name}`} icon={Users}>
      <div className="space-y-5 text-right dir-rtl">

        <p className="text-[11px] text-slate-400 font-bold">
          اضغط على أي اسم عشان تغيّر حالته فورًا — "غايبة" تبقى "حاضرة" (يوم الخميس بس: 5 نقاط لحد 6:05 م، و2 بعدها)، و"حاضرة" تبقى "غايبة" 👇
        </p>

        {/* المخدومات في الفصل */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" /> المخدومات ({students.length})
            </h4>
            {students.length > 0 && (
              <span className="text-[10px] font-bold text-slate-500">
                {studentsPresent} حاضرة / {students.length - studentsPresent} غايبة
              </span>
            )}
          </div>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {students.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-3">لسه مفيش مخدومات متسجلة في الفصل ده</p>
            ) : (
              students.map(renderRow)
            )}
          </div>
        </div>

      </div>
    </Modal>
  );
}
