import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Search, Printer, Users, KeyRound, AlertTriangle, Save, Loader2, PenLine } from 'lucide-react';
import { getManualAttendanceRoster, resetLoginPassword, updateScopedStudent, hasMissingData, CLASSES, getClassName } from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';
import Modal from '../common/Modal';
import eparchyLogo from '../../assets/eparchy-logo.png';

// أكواد QR وكود الدخول لكل المخدومات (عرض + طباعة كارت + إعادة تعيين
// كلمة السر). مفيش تعديل ولا حذف هنا — ده في "الخدام والمخدومات".
export default function StudentQRDirectory() {
  const { showToast, refreshKey } = usePoints();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedQRUser, setSelectedQRUser] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(false);

  // تكملة/تعديل بيانات المخدومة من نفس الكارت.
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  useEffect(() => {
    setEditForm(selectedQRUser ? {
      phone: selectedQRUser.phone || '',
      birthDate: selectedQRUser.birth_date || '',
      address: selectedQRUser.address || '',
      guardianPhone: selectedQRUser.guardian_phone || '',
      confessionFather: selectedQRUser.confession_father || ''
    } : null);
  }, [selectedQRUser?.id]);

  const handleSaveEdit = async () => {
    if (!selectedQRUser || !editForm || savingEdit) return;
    setSavingEdit(true);
    try {
      const updated = await updateScopedStudent({
        studentId: selectedQRUser.id,
        phone: editForm.phone,
        birthDate: editForm.birthDate || null,
        clearBirthDate: !editForm.birthDate,
        address: editForm.address,
        guardianPhone: editForm.guardianPhone,
        confessionFather: editForm.confessionFather
      });
      const merged = { ...selectedQRUser, ...updated };
      setStudents(prev => prev.map(st => (st.id === merged.id ? { ...st, ...merged } : st)));
      setSelectedQRUser(merged);
      showToast('تم الحفظ ✏️', `اتحدثت بيانات "${merged.name}"`, 0, 'success');
    } catch (err) {
      showToast('تعذر الحفظ', err.message || 'حدث خطأ، حاول تاني', 0, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const roster = await getManualAttendanceRoster();
        if (!cancelled) {
          setStudents((roster || []).filter(u => u.role === 'student'));
        }
      } catch (err) {
        if (!cancelled) {
          showToast('تعذر تحميل الكشوفات', err.message || 'حدث خطأ، حاول تاني', 0, 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // نسيان كلمة السر: بيمسح حساب الدخول، وصاحبته تعمل "أول مرة تدخل" تاني
  // بكلمة سر جديدة بنفس الكود.
  const handleResetPassword = async (student) => {
    if (!student?.username || resetting) return;
    if (!window.confirm(`هل أنت متأكد من إعادة تعيين كلمة سر "${student.name}"؟ هتحتاج تعمل "أول مرة تدخل" تاني بكلمة سر جديدة، بنفس كود الدخول (${student.username}).`)) {
      return;
    }
    setResetting(true);
    try {
      const hadPassword = await resetLoginPassword(student.username);
      showToast(
        hadPassword ? 'تمت إعادة التعيين ✅' : 'مفيش تغيير',
        hadPassword
          ? `تم مسح كلمة سر "${student.name}" — تقدر تعمل "أول مرة تدخل" بكلمة سر جديدة بنفس الكود (${student.username})`
          : `"${student.name}" أصلاً من غير كلمة سر — تقدر تعمل "أول مرة تدخل" على طول`,
        0,
        'success'
      );
    } catch (err) {
      showToast('خطأ', err.message || 'تعذر إعادة تعيين كلمة السر', 0, 'error');
    } finally {
      setResetting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (classFilter !== 'all' && s.class_id !== classFilter) return false;
    if (onlyMissing && !hasMissingData(s)) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.qr_code?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q)
    );
  }).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  return (
    <div className="max-w-3xl mx-auto space-y-6 dir-rtl text-right">

      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-sky-700 to-indigo-800 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <QrCode className="w-3.5 h-3.5" /> أكواد QR المخدومات
          </span>
          <h2 className="text-xl sm:text-2xl font-black">أكواد QR وكروت الدخول</h2>
          <p className="text-sky-100 text-xs mt-1">
            اعرض كود QR أو كود الدخول لأي مخدومة، اطبع كارتها، أو كمّل بياناتها الناقصة
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner self-start sm:self-auto">
          <Users className="w-8 h-8" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="دور بالاسم أو كود الدخول..."
          className="w-full py-3 pr-10 pl-3 rounded-2xl border border-slate-200 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[{ id: 'all', name: 'كل الفصول' }, ...CLASSES].map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setClassFilter(c.id)}
            className={`shrink-0 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
              classFilter === c.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {students.some(hasMissingData) && (
        <button
          type="button"
          onClick={() => setOnlyMissing(v => !v)}
          className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border ${
            onlyMissing ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {onlyMissing ? 'عرض الكل' : `اللي بياناتهم ناقصة بس (${students.filter(hasMissingData).length})`}
        </button>
      )}

      {/* List */}
      {loading ? (
        <p className="text-center text-slate-400 text-xs py-10">جاري التحميل...</p>
      ) : filteredStudents.length === 0 ? (
        <p className="text-center text-slate-400 text-xs py-10">
          {students.length === 0 ? 'لسه مفيش مخدومات متسجلة' : 'مفيش نتايج تطابق البحث'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredStudents.map(student => (
            <button
              key={student.id}
              type="button"
              onClick={() => setSelectedQRUser(student)}
              className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50/60 active:scale-[0.99] transition-all text-right"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  {student.name?.[0]}
                </div>
                <div className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                    <span className="truncate">{student.name}</span>
                    {hasMissingData(student) && (
                      <span title="بيانات ناقصة — دوس للتكملة" className="shrink-0 inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-2.5 h-2.5" /> بيانات ناقصة
                      </span>
                    )}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-bold">
                    {getClassName(student.class_id)}
                    {student.username && <span className="text-sky-700 font-mono"> · {student.username}</span>}
                  </span>
                </div>
              </div>
              <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* QR Code Printable Card Modal — نفس نمط UserManagement.jsx بالظبط */}
      <Modal
        isOpen={!!selectedQRUser}
        onClose={() => setSelectedQRUser(null)}
        title="كارت الحضور الرقمي"
        icon={QrCode}
      >
        {selectedQRUser && (
          <div className="text-center space-y-4">
            <div className="relative p-6 rounded-3xl text-white shadow-xl space-y-4 border border-white/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-700 flex items-center justify-center">
                <img src={eparchyLogo} alt="" className="w-36 h-36 rounded-full object-cover shadow-xl border-2 border-white/50 opacity-25" />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <h4 className="font-extrabold text-sm">مدارس الأحد — إعدادي وثانوي بنات</h4>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">{getClassName(selectedQRUser.class_id)}</span>
                </div>

                <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
                  <QRCodeSVG value={selectedQRUser.qr_code} size={160} />
                </div>

                <div>
                  <h3 className="text-lg font-black">{selectedQRUser.name}</h3>
                  <p className="text-xs text-sky-100 font-mono mt-0.5">{selectedQRUser.qr_code}</p>
                </div>

                {selectedQRUser.username && (
                  <div className="bg-white/15 rounded-2xl p-3 border border-white/20">
                    <p className="text-[10px] text-sky-100 font-bold mb-0.5">كود تسجيل الدخول على الموقع</p>
                    <p className="text-xl font-black tracking-wider font-mono">{selectedQRUser.username}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> طباعة الكارت 🖨️
              </button>
              {selectedQRUser.username && (
                <button
                  onClick={() => handleResetPassword(selectedQRUser)}
                  disabled={resetting}
                  className="flex-1 py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 disabled:opacity-60 text-amber-700 dark:text-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-800"
                >
                  <KeyRound className="w-4 h-4" /> نسي الباسورد؟
                </button>
              )}
            </div>

            {editForm && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-right">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5 text-sky-600" /> بيانات المخدومة
                  {hasMissingData(selectedQRUser) && (
                    <span className="text-[9px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full">بيانات ناقصة</span>
                  )}
                </h4>
                {[
                  { key: 'birthDate', label: 'تاريخ الميلاد', type: 'date' },
                  { key: 'guardianPhone', label: 'رقم ولي الأمر', type: 'tel', placeholder: '01xxxxxxxxx' },
                  { key: 'address', label: 'العنوان', type: 'text', placeholder: 'مثال: شارع الجمهورية' },
                  { key: 'phone', label: 'رقم موبايل المخدومة', type: 'tel', placeholder: '01xxxxxxxxx' },
                  { key: 'confessionFather', label: 'أب الاعتراف', type: 'text', placeholder: 'مثال: أ/ تادرس' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={editForm[f.key]}
                      placeholder={f.placeholder}
                      onChange={(e) => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                ))}
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ البيانات
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
