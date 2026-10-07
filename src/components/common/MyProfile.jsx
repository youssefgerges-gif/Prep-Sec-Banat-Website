import React, { useState } from 'react';
import { UserCircle2, Phone, MapPin, Users2, Save, Loader2, ShieldCheck, RefreshCcw, Cake, Church, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';
import { updateOwnProfile, switchTrainingRole, CLASSES, DEFAULT_CLASS_ID, getClassName, ROLE_LABELS } from '../../services/supabase';

// "بياناتي" — لأي حساب (أمين الخدمة / خادم / مخدومة): يعدّل اسمه وتليفونه
// وتاريخ ميلاده وعنوانه وأب اعترافه (ورقم ولي الأمر للمخدومة). الدور والفصل
// والكود مش بيتغيروا من هنا. الحفظ والصلاحيات في update_own_profile().
// ولو الحساب "حساب تدريب"، بيظهر كمان تبديل الدور (خادم / مخدومة).
export default function MyProfile() {
  const { currentUser, refreshProfile } = useAuth();
  const { showToast } = usePoints();

  const isStudent = currentUser?.role === 'student';
  const isTrainingAccount = !!currentUser?.is_training_account;

  const [name, setName] = useState(currentUser?.name || '');
  const [confessionFather, setConfessionFather] = useState(currentUser?.confession_father || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [guardianPhone, setGuardianPhone] = useState(currentUser?.guardian_phone || '');
  const [birthDate, setBirthDate] = useState(currentUser?.birth_date || '');
  const [saving, setSaving] = useState(false);

  const [trainingRole, setTrainingRole] = useState(currentUser?.role || 'servant');
  const [trainingClass, setTrainingClass] = useState(currentUser?.class_id || DEFAULT_CLASS_ID);
  const [switching, setSwitching] = useState(false);

  if (!currentUser) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOwnProfile({
        userId: currentUser.id,
        name: name.trim(),
        phone,
        address,
        confessionFather,
        guardianPhone: isStudent ? guardianPhone : null,
        birthDate: birthDate || null,
        clearBirthDate: !birthDate
      });
      await refreshProfile();
      showToast('تم الحفظ ✏️', 'بياناتك اتحدثت', 0, 'success');
    } catch (err) {
      showToast('خطأ', err.message || 'تعذر حفظ البيانات', 0, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchRole = async () => {
    setSwitching(true);
    try {
      await switchTrainingRole({ userId: currentUser.id, role: trainingRole, classId: trainingClass });
      await refreshProfile();
      showToast('تم التبديل 🔄', `دلوقتي إنت داخل كـ ${ROLE_LABELS[trainingRole]}`, 0, 'success');
    } catch (err) {
      showToast('خطأ', err.message || 'تعذر تبديل الدور', 0, 'error');
    } finally {
      setSwitching(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-bold text-sm transition-all';

  return (
    <div className="space-y-6 dir-rtl text-right max-w-2xl mx-auto">

      <div className="rounded-3xl bg-gradient-to-l from-sky-600 to-indigo-700 p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
            <UserCircle2 className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">بياناتي</h2>
            <p className="text-sky-100 text-xs mt-1">تقدر تعدّل بياناتك من هنا بنفسك في أي وقت</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <Row label="الصفة" value={ROLE_LABELS[currentUser.role] || currentUser.role} />
        {isStudent && <Row label="الفصل" value={getClassName(currentUser.class_id)} />}
        {currentUser.username && <Row label="كود الدخول" value={currentUser.username} mono last />}
        {currentUser.username && <p className="text-[10px] text-slate-400 font-bold">كود الدخول ثابت حتى لو غيّرت رقم تليفونك.</p>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-sky-600" /> بياناتي الشخصية
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">الاسم بالكامل</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> رقم التليفون</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Cake className="w-3.5 h-3.5" /> تاريخ الميلاد
          </label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Church className="w-3.5 h-3.5" /> أب الاعتراف
          </label>
          <input type="text" value={confessionFather} onChange={(e) => setConfessionFather(e.target.value)} placeholder="مثلاً: أبونا ..." className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> العنوان
          </label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
        </div>

        {isStudent && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5" /> رقم ولي الأمر
              </label>
              <input type="tel" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="01xxxxxxxxx" className={inputClass} />
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl transition-all shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ التعديلات
        </button>
      </div>

      {isTrainingAccount && (
        <div className="bg-amber-50 rounded-2xl border-2 border-dashed border-amber-300 p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> وضع التدريب — تبديل الدور
          </h3>
          <p className="text-xs text-amber-800 font-medium -mt-2">
            ده حساب تدريب — اختار تدخل كخادم أو كمخدومة عشان توري الخدام الموقع من الناحيتين.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-amber-700 mb-1.5">الدور</label>
              <select value={trainingRole} onChange={(e) => setTrainingRole(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white font-bold text-sm">
                <option value="servant">✝️ خادم</option>
                <option value="student">🌸 مخدومة</option>
              </select>
            </div>
            {trainingRole === 'student' && (
              <div>
                <label className="block text-xs font-bold text-amber-700 mb-1.5">الفصل</label>
                <select value={trainingClass} onChange={(e) => setTrainingClass(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white font-bold text-sm">
                  {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleSwitchRole}
            disabled={switching}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl transition-all shadow-sm"
          >
            {switching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            بدّل الدور دلوقتي
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong, mono, last }) {
  return (
    <div className={`flex items-center justify-between ${last ? '' : 'border-b border-slate-100 pb-3'}`}>
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className={`${strong ? 'font-extrabold text-slate-900' : 'font-bold text-sm text-slate-700'} ${mono ? 'font-mono text-sky-700' : ''}`}>{value}</span>
    </div>
  );
}
