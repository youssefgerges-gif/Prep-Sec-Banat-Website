import React, { useState, useEffect } from 'react';
import { Award, Plus, Minus, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { getScopedStudents, addManualPoints, getStudentBalance, CLASSES, getClassName } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';

export default function ManualPointsTool() {
  const { currentUser } = useAuth();
  const { showToast, triggerRefresh, refreshKey } = usePoints();

  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentBalance, setStudentBalance] = useState(0);

  // 'add' or 'deduct' — an explicit toggle instead of relying on the amount
  // going negative. `amount` itself is always a plain positive magnitude;
  // the sign is applied from `mode` right before it's saved.
  const [mode, setMode] = useState('add');
  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);

  // Quick Preset Amounts
  const PRESET_AMOUNTS = [5, 10, 15, 20, 25];

  useEffect(() => {
    getScopedStudents()
      .then(stuList => {
        setStudents(stuList);
        if (stuList.length > 0 && !selectedStudent) {
          setSelectedStudent(stuList[0]);
        }
      })
      .catch(() => setStudents([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Update selected student balance
  useEffect(() => {
    if (selectedStudent) {
      getStudentBalance(selectedStudent.id).then(pts => setStudentBalance(pts));
    }
  }, [selectedStudent, refreshKey]);

  const filteredStudents = students.filter(s =>
    (classFilter === 'all' || s.class_id === classFilter) &&
    (s.name.includes(searchQuery) || (s.phone && s.phone.includes(searchQuery)) || s.qr_code.includes(searchQuery))
  );

  // طلب Mr. Gerges 2026-09-23: "ممكن تبقى الكوبونات بالسالب لو المخدوم معاه
  // 15 وأنا خصمت 20، بيبقى معاه -5 ودا غلط" — الرصيد أصلاً معروض فوق، فبنمنع
  // إرسال خصم أكبر منه هنا كمان (تجربة استخدام أوضح، بدل ما ننتظر رد
  // السيرفر)، لكن add_manual_points() في قاعدة البيانات هي اللي بترفض
  // العملية فعليًا مهما حصل — مش مجرد تعطيل الزرار هنا.
  const wouldGoNegative = mode === 'deduct' && amount > studentBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!amount || amount <= 0) {
      showToast('خطأ في البيانات', 'يرجى إدخال قيمة نقاط أكبر من صفر', 0, 'error');
      return;
    }
    if (wouldGoNegative) {
      showToast('خطأ في البيانات', `مينفعش تخصم ${amount} نقطة — المخدومة معاها ${studentBalance} نقطة بس، والخصم ده هيخلي رصيدها بالسالب`, 0, 'error');
      return;
    }

    const signedAmount = mode === 'add' ? amount : -amount;
    // The database still keeps a "reason" per entry for the archive/log —
    // that's just no longer something the servant has to type or pick
    // themselves; it's filled in automatically from which button they
    // pressed (إضافة/خصم).
    const autoReason = mode === 'add' ? 'إضافة نقاط يدوية من الخادم' : 'خصم نقاط يدوي من الخادم';

    setLoading(true);
    try {
      await addManualPoints(selectedStudent.id, signedAmount, autoReason, currentUser?.id || 'servant-1');
      triggerRefresh();
      showToast(
        mode === 'add' ? 'تم إضافة النقاط بنجاح! 🌟' : 'تم خصم النقاط بنجاح ⚠️',
        `تم تسجيل ${mode === 'add' ? '+' : '-'}${amount} نقطة لـ ${selectedStudent.name}`,
        mode === 'add' ? amount : 0,
        'success'
      );
    } catch (err) {
      showToast('فشل العملية', err.message || 'حدث خطأ غير متوقع', 0, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 dir-rtl text-right">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-sky-800 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5" /> إضافة وخصم نقاط
          </span>
          <h2 className="text-xl sm:text-2xl font-black">منح النقاط والتشجيع</h2>
          <p className="text-sky-100 text-xs mt-1">
            نقاط تشجيع لإجابة الأسئلة وحفظ الآيات والأجزاء — لأي مخدومة في أي فصل
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner self-start sm:self-auto">
          <Sparkles className="w-8 h-8" />
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
        
        {/* Student Selector */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 mb-2">1. اختيار المخدومة</label>
          
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو رقم التليفون أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50 text-slate-900 transition-all"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
            {[{ id: 'all', name: 'كل الفصول' }, ...CLASSES].map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setClassFilter(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                  classFilter === c.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-200/80 p-2 rounded-2xl bg-slate-50">
            {filteredStudents.length === 0 && (
              <p className="text-center text-slate-400 text-[11px] font-bold py-3">
                {students.length === 0 ? 'لسه مفيش مخدومات متسجلة' : 'مفيش أسماء مطابقة'}
              </p>
            )}
            {filteredStudents.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`w-full p-2.5 rounded-xl text-right flex items-center justify-between text-xs font-bold transition-all ${
                  selectedStudent?.id === s.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{s.name} <span className="opacity-70 font-medium">— {getClassName(s.class_id)}</span></span>
                {selectedStudent?.id === s.id && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Active Selected Student Preview */}
        {selectedStudent && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider block">المخدومة المختارة</span>
              <h4 className="font-extrabold text-slate-900 text-sm">{selectedStudent.name}</h4>
            </div>
            <div className="bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>الرصيد الحالي: {studentBalance} نقطة</span>
            </div>
          </div>
        )}

        {/* Add / Deduct Toggle */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 mb-2">2. نوع العملية</label>
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                mode === 'add' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" /> إضافة نقاط
            </button>
            <button
              type="button"
              onClick={() => setMode('deduct')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                mode === 'deduct' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minus className="w-4 h-4" /> خصم نقاط
            </button>
          </div>
        </div>

        {/* Amount Input & Presets */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 mb-2">3. قيمة النقاط</label>
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setAmount(prev => Math.max(0, prev - 5))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-700 border border-slate-200 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              className="flex-1 text-center font-black text-lg py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setAmount(prev => prev + 5)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-700 border border-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_AMOUNTS.map((pts) => (
              <button
                key={pts}
                type="button"
                onClick={() => setAmount(pts)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  amount === pts
                    ? mode === 'add' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {mode === 'add' ? '+' : '-'}{pts} نقطة
              </button>
            ))}
          </div>

          {wouldGoNegative && (
            <p className="text-[11px] font-bold text-rose-600 mt-2">
              مينفعش تخصم {amount} نقطة — المخدومة معاها {studentBalance} نقطة بس، ورصيدها مينفعش يبقى بالسالب
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedStudent || wouldGoNegative}
          className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
            mode === 'add'
              ? 'bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700'
              : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800'
          }`}
        >
          {loading
            ? 'جاري الحفظ...'
            : mode === 'add'
              ? `تسجيل +${amount} نقطة للمخدومة`
              : `خصم ${amount} نقطة من المخدومة`}
        </button>

      </form>

    </div>
  );
}
