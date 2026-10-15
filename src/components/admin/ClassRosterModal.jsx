import React, { useMemo, useState } from 'react';
import { UserX, Undo2, Users, Loader2, BookOpen, Check } from 'lucide-react';
import Modal from '../common/Modal';
import {
  recordAttendance, cancelAttendance, recordVerseRecitation, cancelVerseRecitation,
  getAttendancePoints, VERSE_POINTS
} from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';

// "حاضر" here means: attended within the last 7 days (same rolling window
// getServiceStats() in supabase.js already uses for its own weekly
// attendance-rate calculation) — matches a weekly meeting rhythm
// without needing a separate "which week is this" concept.
const PRESENT_WINDOW_DAYS = 7;

const pointsWord = (n) => (n > 2 && n < 11 ? 'نقاط' : 'نقطة');

export default function ClassRosterModal({ isOpen, onClose, classInfo, users, attendanceLogs, verseRecitations }) {
  const { showToast, triggerRefresh } = usePoints();
  // العملية الجارية: { id, kind: 'attend' | 'verse' } — عشان نمنع دوستين ورا بعض.
  const [busy, setBusy] = useState(null);

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

  // التسميع بيتسجل بنفس وقت سجل الحضور — فبنربطه بيه بالوقت.
  const verseByKey = useMemo(() => {
    const map = new Map();
    (verseRecitations || []).forEach(v => {
      map.set(`${v.student_id}|${new Date(v.created_at).getTime()}`, v);
    });
    return map;
  }, [verseRecitations]);

  const isPresent = (userId) => {
    const last = lastAttendedMap.get(userId);
    if (!last) return false;
    const days = (new Date() - last.date) / (1000 * 60 * 60 * 24);
    return days < PRESENT_WINDOW_DAYS;
  };

  const getVerse = (userId) => {
    const last = lastAttendedMap.get(userId);
    if (!last) return null;
    return verseByKey.get(`${userId}|${last.date.getTime()}`) || null;
  };

  // نص بسيط زي "النهاردة"/"إمبارح"/"من 3 أيام" تحت أي حد "حاضر" — عشان لما
  // تلغي حضور حد مسجل من كام يوم (مش دلوقتي)، تبقى فاهم إنت بتلغي إيه بالظبط.
  const formatRelativeDays = (date) => {
    const days = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'اليوم';
    if (days === 1) return 'إمبارح';
    return `من ${days} أيام`;
  };

  const run = async (person, kind, fn) => {
    if (busy) return;
    setBusy({ id: person.id, kind });
    try {
      await fn();
      triggerRefresh();
    } catch (err) {
      showToast('تعذر تنفيذ العملية', err.message || 'حدث خطأ، حاول مرة أخرى', 0, 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleToggleAttendance = (person, present) => run(person, 'attend', async () => {
    if (present) {
      const last = lastAttendedMap.get(person.id);
      if (!last) return;
      const hadVerse = !!getVerse(person.id);
      // إلغاء الحضور بيلغي معاه نقاط التسميع لنفس الحضور.
      await cancelAttendance({ attendanceLogId: last.id, studentId: person.id, timestamp: last.timestamp });
      showToast('تم إلغاء الحضور ⏪', `اتلغى حضور ${person.name}${hadVerse ? ' والتسميع' : ''}`, 0, 'success');
    } else {
      const res = await recordAttendance(person.qr_code);
      showToast(
        'تم تسجيل الحضور ✅',
        `${person.name}: ${res.onTime ? 'في الميعاد' : 'متأخرة'} +${res.pointsAdded} ${pointsWord(res.pointsAdded)}`,
        0,
        'success'
      );
    }
  });

  const handleToggleVerse = (person) => run(person, 'verse', async () => {
    const verse = getVerse(person.id);
    if (verse) {
      await cancelVerseRecitation(verse.id);
      showToast('تم إلغاء التسميع ⏪', `اتشالت ${VERSE_POINTS} نقاط التسميع من ${person.name}`, 0, 'success');
    } else {
      const last = lastAttendedMap.get(person.id);
      await recordVerseRecitation({ studentId: person.id, attendanceTimestamp: last?.timestamp });
      const base = last ? getAttendancePoints(last.date).amount : 0;
      showToast('سمّعت الآية 📖', `${person.name}: +${VERSE_POINTS} نقاط — مجموعها النهارده ${base + VERSE_POINTS} ${pointsWord(base + VERSE_POINTS)}`, 0, 'success');
    }
  });

  if (!classInfo) return null;

  const students = (users || [])
    .filter(u => u.role === 'student' && u.class_id === classInfo.id)
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const studentsPresent = students.filter(u => isPresent(u.id)).length;
  const studentsRecited = students.filter(u => isPresent(u.id) && getVerse(u.id)).length;

  const renderRow = (person) => {
    const present = isPresent(person.id);
    const last = present ? lastAttendedMap.get(person.id) : null;
    const verse = present ? getVerse(person.id) : null;
    const attendBusy = busy?.id === person.id && busy.kind === 'attend';
    const verseBusy = busy?.id === person.id && busy.kind === 'verse';
    const base = last ? getAttendancePoints(last.date).amount : 0;
    const total = base + (verse ? VERSE_POINTS : 0);

    return (
      <div
        key={person.id}
        className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
          !present ? 'bg-slate-50 border-slate-200/70' : 'bg-emerald-50/60 border-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0">
            {person.name?.[0]}
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-slate-900 truncate">{person.name}</span>
            {present && last && (
              <span className="block text-[9px] text-slate-400 font-bold">
                {formatRelativeDays(last.date)} · {verse ? `${base} حضور + ${VERSE_POINTS} تسميع = ${total}` : `${base}`} {pointsWord(total)}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          {present && (
            <button
              type="button"
              onClick={() => handleToggleVerse(person)}
              disabled={!!busy}
              title={verse ? 'اضغط لإلغاء التسميع' : `اضغط لو سمّعت الآية (+${VERSE_POINTS} نقاط)`}
              className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all active:scale-95 disabled:opacity-60 ${
                verse
                  ? 'bg-violet-600 text-white border-violet-600 hover:bg-violet-700'
                  : 'bg-white text-violet-700 border-violet-300 hover:bg-violet-50'
              }`}
            >
              {verseBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : verse ? <Check className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
              {verse ? `سمّعت +${VERSE_POINTS}` : 'تسميع'}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleToggleAttendance(person, present)}
            disabled={!!busy}
            title={!present ? 'اضغط لتسجيل حضورها الآن' : 'اضغط لإلغاء حضورها'}
            className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all active:scale-95 disabled:opacity-60 ${
              present
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300'
                : 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-sky-100 hover:text-sky-800 hover:border-sky-300'
            }`}
          >
            {attendBusy ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : present ? (
              <Undo2 className="w-3 h-3" />
            ) : (
              <UserX className="w-3 h-3" />
            )}
            {attendBusy ? (present ? 'جاري الإلغاء...' : 'جاري التسجيل...') : present ? 'حاضرة' : 'غايبة'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`فصل ${classInfo.name}`} icon={Users}>
      <div className="space-y-5 text-right dir-rtl">

        <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
          دوس "غايبة" تبقى "حاضرة" (يوم الخميس بس: 5 نقاط لحد 6:05 م، و2 بعدها). وبعد ما تبقى حاضرة يظهر زرار "تسميع" — لو سمّعت الآية دوس عليه تاخد {VERSE_POINTS} نقاط زيادة. أي زرار تدوسه تاني بيلغيه 👇
        </p>

        {/* المخدومات في الفصل */}
        <div>
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" /> المخدومات ({students.length})
            </h4>
            {students.length > 0 && (
              <span className="text-[10px] font-bold text-slate-500">
                {studentsPresent} حاضرة / {students.length - studentsPresent} غايبة · {studentsRecited} سمّعت
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
