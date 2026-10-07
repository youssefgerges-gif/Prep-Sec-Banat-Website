import { createClient } from '@supabase/supabase-js';

// Read Supabase credentials from environment or default to placeholder
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Instantiate Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if real valid Supabase keys are configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return (
    url &&
    key &&
    url !== 'https://placeholder.supabase.co' &&
    !url.includes('your-project-id') &&
    !key.includes('your-anon-key') &&
    key !== 'placeholder-key'
  );
};

// ==========================================
// CLASSES (خدمة إعدادي وثانوي بنات — كنيسة مارمينا والبابا كيرلس)
// ==========================================
// 7 فصول: كل سنة دراسية فصل لوحدها، + فصل الجامعيين والخريجين. مفيش شفيع للفصل ولا أمين فصل —
// كل الخدام صلاحياتهم واحدة وبيشوفوا كل الفصول. الـid هو اللي بيتخزن في
// users.class_id لكل مخدومة، فمتغيّروش بعد ما يبقى فيه داتا حقيقية.
export const CLASSES = [
  { id: 'prep-1', grade: 1, name: 'أولى إعدادي', stage: 'إعدادي', color: 'from-sky-500 to-blue-600' },
  { id: 'prep-2', grade: 2, name: 'تانية إعدادي', stage: 'إعدادي', color: 'from-indigo-500 to-violet-600' },
  { id: 'prep-3', grade: 3, name: 'تالتة إعدادي', stage: 'إعدادي', color: 'from-purple-500 to-fuchsia-600' },
  { id: 'sec-1', grade: 1, name: 'أولى ثانوي', stage: 'ثانوي', color: 'from-emerald-500 to-teal-600' },
  { id: 'sec-2', grade: 2, name: 'تانية ثانوي', stage: 'ثانوي', color: 'from-amber-500 to-orange-600' },
  { id: 'sec-3', grade: 3, name: 'تالتة ثانوي', stage: 'ثانوي', color: 'from-rose-500 to-pink-600' },
  { id: 'univ', grade: 'ج', name: 'جامعيين وخريجين', stage: 'جامعيين', color: 'from-slate-500 to-slate-700' },
];

export const DEFAULT_CLASS_ID = CLASSES[0].id;

export const getClassName = (classId) => CLASSES.find(c => c.id === classId)?.name || '—';

// الأدوار: خادم أو مخدومة بس.
export const ROLE_LABELS = {
  admin: 'أمين الخدمة',
  servant: 'خادم',
  student: 'مخدومة'
};

// أمين الخدمة خادم برضو (نفس الشاشات + إدارة الخدام).
export const isServant = (role) => role === 'servant' || role === 'admin';
export const isAdmin = (role) => role === 'admin';

// ==========================================
// MOCK DATA STORE (LOCAL STORAGE BACKUP)
// ==========================================
// بيستخدم بس لو Supabase مش متظبط (وضع التجربة المحلي). بيبدأ فاضي زي
// قاعدة البيانات الحقيقية، غير خادم واحد بنفس كود أول حساب في schema.sql.
const INITIAL_MOCK_DATA = {
  users: [
    { id: 'adm-01', name: 'أبونا بيشوي حليم', role: 'admin', status: 'active', phone: null, qr_code: 'QR-ADM-01', username: 'ADM01', class_id: null, title: 'أمين الخدمة' },
  ],
  attendance_logs: [],
  points_ledger: [],
  birthday_gifts: []
};

// مفتاح تخزين مختلف عن نسخة الابتدائي، عشان لو الاتنين اتفتحوا على نفس
// المتصفح الداتا بتاعتهم متتخلطش.
const MOCK_STORAGE_KEY = 'banat_sunday_school_db';

const getMockData = () => {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
    return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
  }
  const parsed = JSON.parse(data);
  parsed.users = parsed.users || [];
  parsed.attendance_logs = parsed.attendance_logs || [];
  parsed.points_ledger = parsed.points_ledger || [];
  parsed.birthday_gifts = parsed.birthday_gifts || [];
  return parsed;
};

const saveMockData = (data) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
};

// ==========================================
// MOCK LOGIN (وضع التجربة المحلي بس)
// ==========================================
// من غير Supabase مفيش تسجيل دخول حقيقي، فالنسخة المحلية بتقلّده: كلمة
// السر بتتحفظ في المتصفح ده بس، والجلسة كمان. ده للتجربة على جهازك قبل
// ما تربط Supabase — مش آمن ومش المقصود بيه استخدام حقيقي.
export const isMockMode = () => !isSupabaseConfigured();
const MOCK_SESSION_KEY = 'banat_mock_session';
export const MOCK_AUTH_EVENT = 'banat-mock-auth';

export const getMockSessionUserId = () => localStorage.getItem(MOCK_SESSION_KEY);

const setMockSession = (userId) => {
  if (userId) localStorage.setItem(MOCK_SESSION_KEY, userId);
  else localStorage.removeItem(MOCK_SESSION_KEY);
  window.dispatchEvent(new Event(MOCK_AUTH_EVENT));
};

// ==========================================
// SUPABASE API FUNCTIONS
// ==========================================

// ==========================================
// نقاط الحضور (خدمة إعدادي وثانوي بنات)
// ==========================================
// مدارس الأحد يوم الخميس الساعة 6:00 م. نقاط الحضور الأساسية 2 نقطة،
// والمخدومة اللي تيجي لحد 6:05 م (حتى لو بدري) بتاخد 5 بدل 2 كمكافأة.
// تسجيل الحضور مسموح يوم الخميس بس (ومتفحوص كمان في قاعدة البيانات).
// الوقت واليوم بيتحسبوا بتوقيت القاهرة، أيًا كان توقيت الموبايل اللي بيسجّل.
// زيادة/خصم النقاط يدوي لسه موجود في شاشة "إضافة نقاط".
export const MEETING_TIME_LABEL = 'الخميس 6:00 م';
export const ON_TIME_POINTS = 5;
export const LATE_POINTS = 2;
const ON_TIME_UNTIL_MINUTES = 18 * 60 + 5; // 6:05 م
const MEETING_TIMEZONE = 'Africa/Cairo';
const ON_TIME_REASON = 'حضور + مكافأة الميعاد (لحد 6:05 م)';
const LATE_REASON = 'حضور';
// كل أسباب نقاط الحضور (ومنها أسباب قديمة) عشان التراجع يلاقيها.
const ATTENDANCE_REASONS = [
  ON_TIME_REASON, LATE_REASON,
  'حضور في الميعاد (لحد 6:05 م)', 'حضور متأخر (بعد 6:05 م)', 'حضور اجتماع مدارس الأحد (رمز QR)'
];

// هل النهارده خميس بتوقيت القاهرة؟
export function isMeetingDay(date = new Date()) {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: MEETING_TIMEZONE, weekday: 'short' }).format(date);
  return day === 'Thu';
}
// تحويل وقت محلي بتوقيت القاهرة (تاريخ YYYY-MM-DD + ساعة/دقيقة) لـ Date حقيقي،
// مع مراعاة التوقيت الصيفي/الشتوي في مصر.
export function cairoLocalToDate(dateStr, hour = 0, minute = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const offsetAt = (ms) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: MEETING_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date(ms));
    const g = (t) => Number(parts.find(x => x.type === t)?.value);
    return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute')) - ms;
  };
  let ms = guess - offsetAt(guess);
  ms = guess - offsetAt(ms);
  return new Date(ms);
}

// آخر كام خميس (بتوقيت القاهرة)، الأحدث الأول — النهارده لو هو خميس.
// بيرجع تواريخ بشكل YYYY-MM-DD.
export function getRecentThursdays(count = 8, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: MEETING_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const [y, m, d] = parts.split('-').map(Number);
  const today = new Date(Date.UTC(y, m - 1, d));
  const back = (today.getUTCDay() - 4 + 7) % 7;
  const list = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(today.getTime() - (back + i * 7) * 86400000);
    list.push(t.toISOString().slice(0, 10));
  }
  return list;
}

const NOT_MEETING_DAY_ERROR = 'تسجيل الحضور يوم الخميس بس (ميعاد مدارس الأحد). لو محتاج تدي نقاط النهارده استخدم "إضافة نقاط".';

const cairoMinutesOfDay = (date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MEETING_TIMEZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const h = Number(parts.find(x => x.type === 'hour')?.value || 0);
  const m = Number(parts.find(x => x.type === 'minute')?.value || 0);
  return h * 60 + m;
};

// نقاط الحضور حسب ميعاد الوصول.
export function getAttendancePoints(date = new Date()) {
  const onTime = cairoMinutesOfDay(date) <= ON_TIME_UNTIL_MINUTES;
  return onTime
    ? { amount: ON_TIME_POINTS, reason: ON_TIME_REASON, onTime: true }
    : { amount: LATE_POINTS, reason: LATE_REASON, onTime: false };
}

// تسجيل حضور مخدومة (بالكاميرا أو يدوي أو من كشف الفصل) + نقاط الحضور
// (5 في الميعاد / 2 متأخر — شوف getAttendancePoints فوق).
// customTimestamp (اختياري): لتسجيل حضور خميس فات اتنسي. لازم يكون خميس
// ومش في المستقبل، والنقاط بتتحسب على الوقت ده.
// الحضور للمخدومات بس — كارت خادم بيترفض هنا، وكمان في قاعدة البيانات
// نفسها (سياسة "Staff can record attendance" في schema.sql).
export async function recordAttendance(qrCodeStr, customTimestamp = null) {
  const when = customTimestamp ? new Date(customTimestamp) : new Date();
  if (!isMeetingDay(when)) throw new Error(NOT_MEETING_DAY_ERROR);
  if (when.getTime() > Date.now() + 5 * 60000) throw new Error('مينفعش تسجل حضور لميعاد لسه مجاش');
  if (isSupabaseConfigured()) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('qr_code', qrCodeStr)
      .single();

    // PGRST116 = no rows. Any other error is a connection/permission issue,
    // not "unknown QR code".
    if (userError && userError.code !== 'PGRST116') {
      throw new Error('تعذر الاتصال بقاعدة البيانات، حاول مرة أخرى');
    }
    if (userError || !user) throw new Error('رمز QR غير مسجل في النظام');
    if (user.role !== 'student') {
      throw new Error('ده كارت خادم — تسجيل الحضور للمخدومات بس');
    }

    // Shared timestamp ties the attendance row to its points row, so
    // cancelAttendance() can find and undo both together.
    const timestamp = when.toISOString();
    const award = getAttendancePoints(when);

    const { data: attData, error: attError } = await supabase
      .from('attendance_logs')
      .insert([{ user_id: user.id, timestamp }])
      .select()
      .single();
    if (attError) throw attError;

    let pointsLedgerId = null;
    const { data: ledgerData, error: ledgerError } = await supabase
      .from('points_ledger')
      .insert([{
        student_id: user.id,
        amount: award.amount,
        reason: award.reason,
        servant_id: 'system',
        created_at: timestamp
      }])
      .select()
      .single();
    if (ledgerError) console.error('Failed to add attendance points:', ledgerError);
    else pointsLedgerId = ledgerData?.id ?? null;

    return { success: true, user, pointsAdded: award.amount, onTime: award.onTime, attendanceLogId: attData?.id ?? null, pointsLedgerId, timestamp };
  }

  const db = getMockData();
  const user = db.users.find(u => u.qr_code === qrCodeStr);
  if (!user) throw new Error('رمز QR غير مسجل في النظام');
  if (user.role !== 'student') {
    throw new Error('ده كارت خادم — تسجيل الحضور للمخدومات بس');
  }

  const timestamp = when.toISOString();
  const award = getAttendancePoints(when);
  const attRecord = { id: `att-${Date.now()}`, user_id: user.id, timestamp };
  db.attendance_logs.push(attRecord);

  const pointsLedgerId = `pt-${Date.now()}`;
  db.points_ledger.push({
    id: pointsLedgerId,
    student_id: user.id,
    amount: award.amount,
    reason: award.reason,
    servant_id: 'system',
    created_at: timestamp
  });

  saveMockData(db);
  return { success: true, user, pointsAdded: award.amount, onTime: award.onTime, attendanceLogId: attRecord.id, pointsLedgerId, timestamp };
}

// التراجع عن حضور (من كشف الفصل): بيمسح سجل الحضور ونقاطه. النقاط بتتلاقى
// بمطابقة student_id + نفس الـtimestamp + واحد من أسباب نقاط الحضور.
export async function cancelAttendance({ attendanceLogId, studentId, timestamp } = {}) {
  if (!attendanceLogId) throw new Error('لا يوجد سجل حضور يتم التراجع عنه');

  if (isSupabaseConfigured()) {
    const { error: attError } = await supabase
      .from('attendance_logs')
      .delete()
      .eq('id', attendanceLogId);
    if (attError) throw attError;

    if (studentId && timestamp) {
      const { error: ledgerError } = await supabase
        .from('points_ledger')
        .delete()
        .eq('student_id', studentId)
        .eq('created_at', timestamp)
        .in('reason', ATTENDANCE_REASONS);
      if (ledgerError) console.error('Failed to remove attendance points on undo:', ledgerError);
    }
    return { success: true };
  }

  const db = getMockData();
  db.attendance_logs = db.attendance_logs.filter(l => l.id !== attendanceLogId);
  if (studentId && timestamp) {
    db.points_ledger = db.points_ledger.filter(p => !(
      p.student_id === studentId &&
      p.created_at === timestamp &&
      ATTENDANCE_REASONS.includes(p.reason)
    ));
  }
  saveMockData(db);
  return { success: true };
}

// لوحة الصدارة (نقاط) لفصل معيّن — أي خادم يقدر يختار أي فصل.
export async function getClassLeaderboard(classId = DEFAULT_CLASS_ID) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('get_class_points_leaderboard', { p_class_id: classId });
    if (error) throw new Error(error.message || 'تعذر تحميل لوحة الصدارة');
    return (data || []).map(row => ({ ...row, total_points: Number(row.total_points) || 0 }));
  }

  const db = getMockData();
  return db.users
    .filter(u => u.role === 'student' && u.class_id === classId)
    .map(student => {
      const totalPoints = db.points_ledger
        .filter(entry => entry.student_id === student.id)
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      return { ...student, total_points: totalPoints };
    })
    .sort((a, b) => b.total_points - a.total_points);
}

// لوحة الصدارة (حضور): نسبة حضور كل مخدومة من تاريخ انضمامها.
export async function getClassAttendanceRanking(classId = DEFAULT_CLASS_ID) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('get_class_attendance_ranking', { p_class_id: classId });
    if (error) throw new Error(error.message || 'تعذر تحميل ترتيب الحضور');
    return (data || []).map(row => ({
      ...row,
      elapsed_weeks: Number(row.elapsed_weeks) || 0,
      attended_weeks: Number(row.attended_weeks) || 0,
      attendance_percent: row.attendance_percent === null ? null : Number(row.attendance_percent)
    }));
  }

  const db = getMockData();
  const now = Date.now();
  return db.users
    .filter(u => u.role === 'student' && u.class_id === classId)
    .map(student => {
      const createdAt = student.created_at ? new Date(student.created_at).getTime() : now;
      const elapsedWeeks = Math.max(0, Math.floor((now - createdAt) / 604800000));
      const attendedWeeksSet = new Set(
        db.attendance_logs
          .filter(a => a.user_id === student.id && new Date(a.timestamp).getTime() >= createdAt)
          .map(a => Math.floor((new Date(a.timestamp).getTime() - createdAt) / 604800000))
      );
      return {
        id: student.id,
        name: student.name,
        qr_code: student.qr_code,
        elapsed_weeks: elapsedWeeks,
        attended_weeks: attendedWeeksSet.size,
        attendance_percent: elapsedWeeks > 0 ? Math.round((attendedWeeksSet.size / elapsedWeeks) * 1000) / 10 : null
      };
    })
    .filter(row => row.elapsed_weeks > 0)
    .sort((a, b) => b.attendance_percent - a.attendance_percent);
}

// إضافة/خصم نقاط يدوي. قاعدة البيانات (add_manual_points) بترفض أي خصم
// يخلّي الرصيد بالسالب.
export async function addManualPoints(studentId, amount, reason, servantId) {
  if (!reason || reason.trim() === '') {
    throw new Error('سبب إضافة/خصم النقاط مطلوب للأرشيف');
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('add_manual_points', {
      p_student_id: studentId,
      p_amount: Number(amount),
      p_reason: reason.trim(),
      p_servant_id: servantId || null
    });
    if (error) throw new Error(error.message || 'تعذر تسجيل النقاط');
    return Array.isArray(data) ? data[0] : data;
  }

  const db = getMockData();
  const numericAmount = Number(amount);
  if (numericAmount < 0) {
    const currentBalance = db.points_ledger
      .filter(item => item.student_id === studentId)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    if (currentBalance + numericAmount < 0) {
      throw new Error(`مينفعش تخصم ${Math.abs(numericAmount)} نقطة — المخدومة معاها ${currentBalance} نقطة بس دلوقتي، والخصم ده هيخلي رصيدها بالسالب`);
    }
  }
  const newEntry = {
    id: `pt-${Date.now()}`,
    student_id: studentId,
    amount: numericAmount,
    reason: reason.trim(),
    servant_id: servantId || 'system',
    created_at: new Date().toISOString()
  };
  db.points_ledger.push(newEntry);
  saveMockData(db);
  return newEntry;
}

export async function getStudentBalance(studentId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('points_ledger')
      .select('amount')
      .eq('student_id', studentId);
    if (error) throw error;
    return data.reduce((sum, item) => sum + Number(item.amount), 0);
  }
  const db = getMockData();
  return db.points_ledger
    .filter(item => item.student_id === studentId)
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

// الافتقاد: المخدومات اللي غايبة بقالها min أسابيع أو أكتر، كل الفصول.
// الرقم الراجع هو رقم ولي الأمر (ولو مش موجود، رقم المخدومة).
export async function getAbsenceReport(minWeeksAbsent = 2) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('get_absence_report', { min_weeks: minWeeksAbsent });
    if (error) throw new Error(error.message || 'تعذر تحميل سجل الافتقاد');
    return (data || []).map(row => ({
      ...row,
      last_attended: row.last_attended_at ? new Date(row.last_attended_at).toLocaleDateString('ar-EG') : 'لم تحضر من قبل'
    }));
  }

  const db = getMockData();
  const now = new Date();
  return db.users
    .filter(u => u.role === 'student')
    .map(person => {
      const personLogs = db.attendance_logs
        .filter(l => l.user_id === person.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const lastAttended = personLogs[0] ? new Date(personLogs[0].timestamp) : null;
      const since = lastAttended || (person.created_at ? new Date(person.created_at) : now);
      const weeksAbsent = Math.max(0, Math.floor((now - since) / (1000 * 60 * 60 * 24 * 7)));
      return {
        ...person,
        phone: person.guardian_phone || person.phone,
        last_attended: lastAttended ? lastAttended.toLocaleDateString('ar-EG') : 'لم تحضر من قبل',
        weeks_absent: weeksAbsent
      };
    })
    .filter(s => s.weeks_absent >= minWeeksAbsent)
    .sort((a, b) => b.weeks_absent - a.weeks_absent);
}

// كل المخدومات (لأداة النقاط اليدوية).
export async function getScopedStudents() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('get_scoped_students');
    if (error) throw new Error(error.message || 'تعذر تحميل قائمة المخدومات');
    return data || [];
  }
  const db = getMockData();
  return db.users
    .filter(u => u.role === 'student')
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}

// كل المخدومات (لتسجيل الحضور اليدوي وشاشة أكواد QR).
export async function getManualAttendanceRoster() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('get_manual_attendance_roster');
    if (error) throw new Error(error.message || 'تعذر تحميل قائمة تسجيل الحضور اليدوي');
    return data || [];
  }
  const db = getMockData();
  return db.users
    .filter(u => u.role === 'student')
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}

// إضافة مخدومة جديدة — أي خادم، في أي فصل. الاسم والفصل بس إلزاميين؛
// تاريخ الميلاد والعنوان ورقم ولي الأمر اختياريين ويتكملوا بعدين من شاشة
// "أكواد QR" (وأي مخدومة ناقصها حاجة منهم بيبان عليها "بيانات ناقصة").
export async function addScopedStudent({ name, phone, birthDate, address, guardianPhone, confessionFather, class_id } = {}) {
  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();
  const cleanBirthDate = (birthDate || '').trim();
  const cleanAddress = (address || '').trim();
  const cleanGuardianPhone = (guardianPhone || '').trim();
  const cleanClassId = (class_id || '').trim();
  const cleanFather = (confessionFather || '').trim();

  if (!cleanName) throw new Error('اسم المخدومة مطلوب');
  if (!cleanClassId) throw new Error('يجب اختيار الفصل الدراسي');

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('add_scoped_student', {
      p_name: cleanName,
      p_birth_date: cleanBirthDate || null,
      p_address: cleanAddress || null,
      p_guardian_phone: cleanGuardianPhone || null,
      p_phone: cleanPhone || null,
      p_class_id: cleanClassId,
      p_confession_father: cleanFather || null
    });
    if (error) throw new Error(error.message || 'تعذر إضافة المخدومة');
    return data && data[0];
  }

  const db = getMockData();
  let qrCode;
  do {
    qrCode = `QR-STU-${Math.floor(10000 + Math.random() * 90000)}`;
  } while (db.users.some(u => u.qr_code === qrCode));
  const newStudent = {
    id: `usr-${Date.now()}`,
    name: cleanName,
    role: 'student',
    phone: cleanPhone || null,
    birth_date: cleanBirthDate || null,
    address: cleanAddress || null,
    guardian_phone: cleanGuardianPhone || null,
    confession_father: cleanFather || null,
    class_id: cleanClassId,
    title: 'مخدومة',
    qr_code: qrCode,
    username: qrCode.replace('QR-', '').replace(/-/g, ''),
    created_at: new Date().toISOString()
  };
  db.users.push(newStudent);
  saveMockData(db);
  return newStudent;
}

// مخدومة ناقصها تاريخ ميلاد أو عنوان أو رقم ولي أمر.
export const hasMissingData = (s) => !!s && (s.role === 'student' || !s.role) && (!s.birth_date || !s.address || !s.guardian_phone);

// تكملة/تعديل بيانات مخدومة (تليفون / تاريخ ميلاد / عنوان / رقم ولي أمر).
// undefined/null = "متلمسش"، نص فاضي = "امسحه"، clearBirthDate بيمسح التاريخ.
export async function updateScopedStudent({ studentId, phone, birthDate, clearBirthDate, address, guardianPhone, confessionFather } = {}) {
  if (!studentId) throw new Error('المخدومة غير محددة');

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('update_scoped_student', {
      p_student_id: studentId,
      p_phone: phone ?? null,
      p_birth_date: birthDate || null,
      p_clear_birth_date: !!clearBirthDate,
      p_address: address ?? null,
      p_guardian_phone: guardianPhone ?? null,
      p_confession_father: confessionFather ?? null
    });
    if (error) throw new Error(error.message || 'تعذر حفظ بيانات المخدومة');
    return data;
  }

  const db = getMockData();
  const idx = db.users.findIndex(u => u.id === studentId && u.role === 'student');
  if (idx === -1) throw new Error('المخدومة غير موجودة');
  db.users[idx] = applyContactUpdate(db.users[idx], { phone, birthDate, clearBirthDate, address, guardianPhone, confessionFather });
  saveMockData(db);
  return db.users[idx];
}

const applyContactUpdate = (row, { phone, birthDate, clearBirthDate, address, guardianPhone, confessionFather }) => {
  const updated = { ...row };
  if (phone !== undefined && phone !== null) updated.phone = String(phone).trim() || null;
  if (clearBirthDate) updated.birth_date = null;
  else if (birthDate) updated.birth_date = birthDate;
  if (address !== undefined && address !== null) updated.address = String(address).trim() || null;
  if (guardianPhone !== undefined && guardianPhone !== null) updated.guardian_phone = String(guardianPhone).trim() || null;
  if (confessionFather !== undefined && confessionFather !== null) updated.confession_father = String(confessionFather).trim() || null;
  return updated;
};

// إحصائيات عامة: إجمالي النقاط الموزعة، ونسبة المخدومات اللي حضرت آخر 7 أيام.
export async function getServiceStats() {
  let students, logs, ledger;
  if (isSupabaseConfigured()) {
    const [s, l, p] = await Promise.all([
      supabase.from('users').select('id').eq('role', 'student'),
      supabase.from('attendance_logs').select('user_id, timestamp'),
      supabase.from('points_ledger').select('amount')
    ]);
    students = s.data || []; logs = l.data || []; ledger = p.data || [];
  } else {
    const db = getMockData();
    students = db.users.filter(u => u.role === 'student');
    logs = db.attendance_logs;
    ledger = db.points_ledger;
  }

  const totalPointsDistributed = ledger
    .filter(entry => Number(entry.amount) > 0)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const now = new Date();
  const attendedThisWeek = new Set(
    logs
      .filter(l => (now - new Date(l.timestamp)) / (1000 * 60 * 60 * 24) < 7)
      .map(l => l.user_id)
  );
  const presentCount = students.filter(s => attendedThisWeek.has(s.id)).length;
  const attendanceRate = students.length > 0
    ? `${Math.round((presentCount / students.length) * 100)}%`
    : '0%';

  return { totalPointsDistributed, attendanceRate, presentCount };
}

export async function getUsers() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data || [];
  }
  return getMockData().users;
}

// سجلات الحضور الخام (id + user_id + timestamp) لكشف الفصل والإحصائيات.
export async function getAttendanceLogs() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('attendance_logs').select('id, user_id, timestamp');
    if (error) throw error;
    return data || [];
  }
  return getMockData().attendance_logs;
}

// ==========================================
// أعياد الميلاد وهدايا الحفلة الشهرية
// ==========================================
export const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

// السنة والشهر واليوم النهارده بتوقيت القاهرة.
export function getCairoToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MEETING_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const get = (t) => Number(parts.find(x => x.type === t)?.value);
  const year = get('year'), month = get('month'), day = get('day');
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { year, month, day, iso };
}

// حفلة أعياد الميلاد: آخر خميس في الشهر (month من 1 لـ 12).
export function getLastThursday(year, month) {
  const lastDay = new Date(Date.UTC(year, month, 0)); // آخر يوم في الشهر
  const offset = (lastDay.getUTCDay() - 4 + 7) % 7;   // 4 = الخميس
  return lastDay.getUTCDate() - offset;
}

export async function getBirthdays(month, year) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('get_birthdays', { p_month: month, p_year: year });
    if (error) throw new Error(error.message || 'تعذر تحميل أعياد الميلاد');
    return data || [];
  }

  const db = getMockData();
  const gifts = db.birthday_gifts || [];
  return db.users
    .filter(u => u.role === 'student' && u.birth_date && Number(u.birth_date.slice(5, 7)) === month)
    .map(u => {
      const gift = gifts.find(g => g.student_id === u.id && g.gift_year === year && g.gift_month === month);
      return {
        id: u.id,
        name: u.name,
        class_id: u.class_id,
        phone: u.phone,
        guardian_phone: u.guardian_phone,
        birth_date: u.birth_date,
        birth_day: Number(u.birth_date.slice(8, 10)),
        age_turning: year - Number(u.birth_date.slice(0, 4)),
        received_at: gift?.received_at || null,
        received_by: gift ? (db.users.find(s => s.id === gift.servant_id)?.name || null) : null
      };
    })
    .sort((a, b) => a.birth_day - b.birth_day || a.name.localeCompare(b.name, 'ar'));
}

// تعليم إن المخدومة استلمت هدية عيد ميلادها (شهر/سنة معيّنين).
export async function markGiftReceived(studentId, month, year, servantId) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('birthday_gifts')
      .insert([{ student_id: studentId, gift_month: month, gift_year: year, servant_id: servantId || null }]);
    // 23505 = متسجلة أصلاً (خادم تاني علّم عليها في نفس اللحظة) — مش مشكلة.
    if (error && error.code !== '23505') throw new Error(error.message || 'تعذر تسجيل الاستلام');
    return;
  }
  const db = getMockData();
  db.birthday_gifts = db.birthday_gifts || [];
  if (!db.birthday_gifts.some(g => g.student_id === studentId && g.gift_year === year && g.gift_month === month)) {
    db.birthday_gifts.push({ student_id: studentId, gift_month: month, gift_year: year, servant_id: servantId || null, received_at: new Date().toISOString() });
    saveMockData(db);
  }
}

// إلغاء علامة الاستلام (لو اتعلّمت بالغلط).
export async function unmarkGiftReceived(studentId, month, year) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('birthday_gifts')
      .delete()
      .eq('student_id', studentId)
      .eq('gift_month', month)
      .eq('gift_year', year);
    if (error) throw new Error(error.message || 'تعذر إلغاء الاستلام');
    return;
  }
  const db = getMockData();
  db.birthday_gifts = (db.birthday_gifts || []).filter(g => !(g.student_id === studentId && g.gift_year === year && g.gift_month === month));
  saveMockData(db);
}

// ==========================================
// إشعارات الموبايل (Web Push)
// ==========================================
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export async function savePushSubscription(subscription) {
  const json = subscription.toJSON ? subscription.toJSON() : subscription;
  if (!isSupabaseConfigured()) return; // مفيش سيرفر يبعت إشعارات في وضع التجربة
  const { error } = await supabase.rpc('save_push_subscription', {
    p_endpoint: json.endpoint,
    p_p256dh: json.keys?.p256dh,
    p_auth: json.keys?.auth
  });
  if (error) throw new Error(error.message || 'تعذر حفظ الاشتراك في الإشعارات');
}

export async function removePushSubscription(endpoint) {
  if (!isSupabaseConfigured() || !endpoint) return;
  await supabase.rpc('remove_push_subscription', { p_endpoint: endpoint });
}

// Login username = QR code with "QR-" and dashes stripped (QR-SRV-12345 ->
// SRV12345), so it always matches the code printed on the person's card.
function generateUsername(qrCode) {
  return String(qrCode).toUpperCase().replace(/^QR-/, '').replace(/-/g, '');
}

export async function saveUser(userData) {
  const generatedQrCode = userData.qr_code || `QR-${userData.role === 'student' ? 'STU' : 'SRV'}-${Math.floor(10000 + Math.random() * 90000)}`;

  // New person, no username set yet (editing an existing person keeps
  // their current username untouched — only a brand-new row gets one).
  let generatedUsername = userData.username;
  if (!userData.id && !generatedUsername) {
    generatedUsername = generateUsername(generatedQrCode);
  }

  const payload = {
    ...userData,
    // عمود DATE في قاعدة البيانات مش بيقبل نص فاضي — لازم NULL.
    birth_date: userData.birth_date ? userData.birth_date : null,
    qr_code: generatedQrCode,
    ...(generatedUsername ? { username: generatedUsername } : {})
  };

  if (isSupabaseConfigured()) {
    // Note: previously a Supabase error here was swallowed and the save
    // silently redirected to local mock data — meaning a servant could see
    // "saved" while the real database never received the change. Now the
    // error is thrown so the UI can tell the user the save actually failed.
    if (payload.id) {
      const { data, error } = await supabase.from('users').update(payload).eq('id', payload.id).select();
      if (error) throw error;
      return data[0];
    } else {
      const { data, error } = await supabase.from('users').insert([payload]).select();
      if (error) throw error;
      return data[0];
    }
  }

  const db = getMockData();
  let resultUser = payload;

  if (payload.id) {
    const index = db.users.findIndex(u => u.id === payload.id);
    if (index !== -1) db.users[index] = { ...db.users[index], ...payload };
  } else {
    resultUser = {
      ...payload,
      id: `usr-${Date.now()}`
    };
    db.users.push(resultUser);
  }

  saveMockData(db);
  return resultUser;
}

export async function deleteUser(userId) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
  } else {
    const db = getMockData();
    db.users = db.users.filter(u => u.id !== userId);
    saveMockData(db);
  }
}

export async function getStudentHistory(studentId) {
  if (isSupabaseConfigured()) {
    const { data: ledger, error } = await supabase
      .from('points_ledger')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ledger;
  } else {
    const db = getMockData();
    return db.points_ledger
      .filter(p => p.student_id === studentId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

// ==========================================
// REAL LOGIN (username + self-chosen password)
// ==========================================
// Supabase Auth is built around email/password, so a short username like
// "ADM01" is mapped to a fake internal email behind the scenes — nobody
// ever sees or uses that email, they only ever type their username.
const AUTH_EMAIL_DOMAIN = 'sundayschool.local';
const usernameToEmail = (username) => `${String(username || '').trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;

// Looks up a person by their short login username (e.g. "ADM01", "SRV601").
// Returns null if no such username exists. Used both to show "is this you?"
// before asking for a password, and to tell a first-time login apart from
// a returning one (profile.has_password).
//
// This goes through the find_login_account() database function instead of
// selecting from `users` directly — once RLS is locked down, a logged-out
// visitor has no direct read access to the users table at all (that's the
// point), so the lookup needed for login itself has to go through a
// narrow function that only ever returns the few non-sensitive fields
// needed to show "is this you?" (never phone numbers, never the QR code).
export async function findUserByUsername(username) {
  const clean = String(username || '').trim().toUpperCase();
  if (!clean) return null;

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('find_login_account', { p_username: clean });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row || null;
  }

  const db = getMockData();
  const found = db.users.find(u => (u.username || '').toUpperCase() === clean);
  return found ? { ...found, has_password: !!found.auth_user_id } : null;
}

// First-time login: creates the person's own Supabase Auth account with the
// password THEY choose (never set by an admin), then links it to their
// existing row in `users` via the claim_login_account() database function
// (runs as the now-signed-in person; it's the only way to set auth_user_id
// once direct writes to `users` are locked down to servants only).
export async function claimAccount(username, password) {
  if (!isSupabaseConfigured()) {
    const db = getMockData();
    const clean = String(username || '').trim().toUpperCase();
    const user = db.users.find(u => (u.username || '').toUpperCase() === clean);
    if (!user) throw new Error('الكود غير موجود، تأكد منه أو راجع أي خادم');
    if (user.auth_user_id) throw new Error('تم إنشاء كلمة سر لهذا الكود من قبل — سجّل الدخول بدل إنشاء حساب جديد');
    user.auth_user_id = `mock-${user.id}`;
    user.mock_password = password;
    saveMockData(db);
    setMockSession(user.id);
    return user;
  }

  const profile = await findUserByUsername(username);
  if (!profile) throw new Error('الكود غير موجود، تأكد منه أو راجع أي خادم');
  if (profile.has_password) {
    throw new Error('تم إنشاء كلمة سر لهذا الكود من قبل — سجّل الدخول بدل إنشاء حساب جديد');
  }

  let { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password
  });

  if (error) {
    // A previous "claim account" attempt for this exact username can have
    // already created the Auth account successfully and then failed on the
    // next step (linking it to the users row — e.g. the claim_login_account
    // ambiguous-column bug fixed today), leaving an orphaned Auth account
    // with no linked profile. Retrying signUp() then correctly reports
    // "already registered" even though the person never finished setting
    // up their account. Recover automatically by signing straight in with
    // the password they just typed — this succeeds if it matches whatever
    // they typed on that earlier, interrupted attempt.
    const alreadyRegistered = /already registered|already exists/i.test(error.message || '');
    if (!alreadyRegistered) {
      throw new Error(error.message || 'تعذر إنشاء الحساب');
    }

    const signInResult = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password
    });
    if (signInResult.error) {
      throw new Error('فيه محاولة سابقة لإنشاء حساب بالكود ده بكلمة سر مختلفة عن اللي كتبتها دلوقتي. جرب كلمة السر اللي استخدمتها في المحاولة الأولى، أو كلم الخادم المسؤول عن Supabase عشان يمسح الحساب القديم من Supabase (Authentication > Users) وتبدأ من جديد');
    }
    data = signInResult.data;
  }

  if (!data.user) throw new Error('تعذر إنشاء الحساب، حاول مرة أخرى');

  // If the Supabase project still requires email confirmation, signUp()
  // won't return an active session yet. Try signing straight in — this
  // only succeeds once "Confirm email" has been turned off for this
  // project (see the setup note in the audit doc).
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password
    });
    if (signInError) {
      throw new Error('تم إنشاء الحساب، لكن لازم تلغي تفعيل "Confirm email" من إعدادات Supabase Auth الأول عشان تقدر تدخل');
    }
  }

  const { data: claimed, error: claimError } = await supabase.rpc('claim_login_account', { p_username: username });
  if (claimError) throw new Error(claimError.message || 'تعذر ربط الحساب بالكود');

  return Array.isArray(claimed) ? claimed[0] : claimed;
}

// Returning login with an already-claimed username + password.
export async function loginWithUsername(username, password) {
  if (!isSupabaseConfigured()) {
    const clean = String(username || '').trim().toUpperCase();
    const user = getMockData().users.find(u => (u.username || '').toUpperCase() === clean);
    if (!user || user.mock_password !== password) throw new Error('كلمة السر غير صحيحة');
    setMockSession(user.id);
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password
  });
  if (error) throw new Error('كلمة السر غير صحيحة');
}

// طلب Mr. Gerges 2026-09-23: "لو حد نسي الباسورد بتاعه يبقي فيه طريقة
// للـRecovery أو التغيير". مفيش إيميلات حقيقية مسجلة (usernameToEmail() فوق
// بيولّد إيميل وهمي لكل حد فقط عشان Supabase Auth محتاج شكل إيميل)، فرابط
// "استرجاع كلمة السر" الجاهز من Supabase (اللي بيبعت إيميل حقيقي) مش وارد
// يشتغل هنا. بدل كده، أي خادم يقدر يمسح حساب الدخول بتاع
// أي حد — يرجع لحالة "مفيهوش باسورد" تاني، وصاحبه يعمل "أول
// مرة تدخل" من جديد بكلمة سر جديدة يختارها بنفسه. الصلاحية نفسها متأكد
// منها سيرفر سايد جوه reset_login_password() في schema.sql (مش مجرد إخفاء
// زرار) — أي خادم يقدر يعمل كده لأي حد.
export async function resetLoginPassword(username) {
  const clean = String(username || '').trim().toUpperCase();
  if (!clean) {
    throw new Error('كود الدخول مطلوب');
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('reset_login_password', { p_username: clean });
    if (error) throw new Error(error.message || 'تعذر إعادة تعيين كلمة السر');
    return !!data;
  }

  const db = getMockData();
  const idx = db.users.findIndex(u => (u.username || '').toUpperCase() === clean);
  if (idx === -1) throw new Error('الكود غير موجود');
  const hadPassword = !!db.users[idx].auth_user_id;
  db.users[idx] = { ...db.users[idx], auth_user_id: null, mock_password: undefined };
  saveMockData(db);
  return hadPassword;
}

export async function logoutUser() {
  if (!isSupabaseConfigured()) {
    setMockSession(null);
    return;
  }
  {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}

// The `users` row for the currently signed-in Supabase Auth account.
export async function getMyProfile(authUserId) {
  if (!authUserId) return null;
  if (!isSupabaseConfigured()) {
    return getMockData().users.find(u => u.id === authUserId) || null;
  }
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ==========================================
// بياناتي (تعديل ذاتي) + حساب التدريب
// ==========================================
export async function updateOwnProfile({ userId, name, phone, address, guardianPhone, confessionFather, birthDate, clearBirthDate } = {}) {
  if (name !== undefined && name !== null && !String(name).trim()) throw new Error('الاسم مطلوب');
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('update_own_profile', {
      p_phone: phone ?? null,
      p_address: address ?? null,
      p_guardian_phone: guardianPhone ?? null,
      p_birth_date: birthDate || null,
      p_clear_birth_date: !!clearBirthDate,
      p_name: name ?? null,
      p_confession_father: confessionFather ?? null
    });
    if (error) throw new Error(error.message || 'تعذر حفظ البيانات');
    return data;
  }
  const db = getMockData();
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('الحساب غير موجود');
  db.users[idx] = applyContactUpdate(db.users[idx], { phone, birthDate, clearBirthDate, address, guardianPhone, confessionFather });
  if (name) db.users[idx].name = String(name).trim();
  saveMockData(db);
  return db.users[idx];
}

// ==========================================
// تسجيل خادم جديد + إدارة الخدام (أمين الخدمة)
// ==========================================
// الخادم الجديد بيعمل حسابه بنفسه: كود الدخول = رقم تليفونه. الحساب بيفضل
// "مستني موافقة" لحد ما أمين الخدمة يوافق عليه.
export const normalizePhone = (p) => String(p || '').replace(/\D/g, '');

export async function registerServant({ name, phone, birthDate, confessionFather, address, password } = {}) {
  const cleanName = String(name || '').trim();
  const cleanPhone = normalizePhone(phone);
  if (!cleanName) throw new Error('الاسم مطلوب');
  if (!/^01\d{9}$/.test(cleanPhone)) throw new Error('رقم التليفون لازم يكون 11 رقم ويبدأ بـ 01');
  if (!password || password.length < 6) throw new Error('كلمة السر لازم تكون 6 حروف/أرقام على الأقل');

  const existing = await findUserByUsername(cleanPhone);
  if (existing) throw new Error('رقم التليفون ده متسجل قبل كده — ادخل بيه من "تسجيل الدخول"');

  if (!isSupabaseConfigured()) {
    const db = getMockData();
    const user = {
      id: `usr-${Date.now()}`, name: cleanName, role: 'servant', status: 'pending', title: 'خادم',
      phone: cleanPhone, username: cleanPhone, qr_code: `QR-SRV-${Math.floor(10000 + Math.random() * 90000)}`,
      birth_date: birthDate || null, confession_father: (confessionFather || '').trim() || null,
      address: (address || '').trim() || null, class_id: null,
      auth_user_id: `mock-${Date.now()}`, mock_password: password, created_at: new Date().toISOString()
    };
    db.users.push(user);
    saveMockData(db);
    setMockSession(user.id);
    return user;
  }

  const email = usernameToEmail(cleanPhone);
  let { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    // محاولة سابقة عملت حساب الدخول ومكملتش — نجرب ندخل بنفس كلمة السر.
    if (!/already registered|already exists/i.test(error.message || '')) throw new Error(error.message || 'تعذر إنشاء الحساب');
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) throw new Error('فيه حساب قديم بالرقم ده بكلمة سر تانية — كلّم أمين الخدمة');
    data = res.data;
  }
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error('تم إنشاء الحساب، لكن لازم يتقفل "Confirm email" في إعدادات Supabase الأول');
  }

  const { data: row, error: regError } = await supabase.rpc('register_servant', {
    p_name: cleanName,
    p_phone: cleanPhone,
    p_birth_date: birthDate || null,
    p_confession_father: (confessionFather || '').trim() || null,
    p_address: (address || '').trim() || null
  });
  if (regError) throw new Error(regError.message || 'تعذر تسجيل الحساب');
  // نحدّث الشاشة عشان تعرض "مستني الموافقة".
  await supabase.auth.refreshSession();
  return row;
}

export async function adminSetServantStatus(userId, status) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('admin_set_servant_status', { p_user_id: userId, p_status: status });
    if (error) throw new Error(error.message || 'تعذر تغيير حالة الخادم');
    return data;
  }
  const db = getMockData();
  const u = db.users.find(x => x.id === userId && x.role === 'servant');
  if (!u) throw new Error('الخادم غير موجود');
  u.status = status;
  saveMockData(db);
  return u;
}

export async function adminDeleteServant(userId) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.rpc('admin_delete_servant', { p_user_id: userId });
    if (error) throw new Error(error.message || 'تعذر مسح الخادم');
    return true;
  }
  const db = getMockData();
  db.users = db.users.filter(x => !(x.id === userId && x.role === 'servant'));
  saveMockData(db);
  return true;
}

// حساب التدريب بس (is_training_account) يقدر يبدّل دوره: خادم أو مخدومة.
export async function switchTrainingRole({ userId, role, classId } = {}) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('switch_training_role', {
      p_role: role,
      p_class_id: role === 'student' ? classId : null
    });
    if (error) throw new Error(error.message || 'تعذر تبديل الدور');
    return data;
  }
  const db = getMockData();
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('الحساب غير موجود');
  if (!db.users[idx].is_training_account) throw new Error('الحساب ده مش حساب تدريب — مينفعش تغيّر دورك');
  db.users[idx] = { ...db.users[idx], role, class_id: role === 'student' ? classId : null };
  saveMockData(db);
  return db.users[idx];
}

