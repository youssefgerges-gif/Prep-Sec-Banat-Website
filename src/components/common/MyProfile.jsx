import React, { useState } from 'react';
import { UserCircle2, Phone, MapPin, Users2, Save, Loader2, ShieldCheck, RefreshCcw, Cake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';
import { updateOwnProfile, switchTrainingRole, CLASSES } from '../../services/supabase';

const ROLE_LABELS = {
  super_admin: '👑 أمين خدمة عامة',
  class_admin: '⛪️ أمين فصل',
  assistant_admin: '🤝 أمين فصل مساعد',
  servant: '✝️ خادم',
  student: '🧒 مخدوم'
};

// طلب Mr. Gerges 2026-09-25: شاشة "بياناتي" — متاحة لأي حساب (أي دور)، بتوري
// بياناته الأساسية وتسيبه يعدّل رقم تليفونه (وعنوانه ورقم ولي أمره لو
// مخدوم) بنفسه. الاسم/الدور/الفصل/كود الدخول لسه للعرض بس هنا — تغييرهم
// لسه حصري لأمين الخدمة من شاشة "الخدام والمخدومين"، والحفظ الفعلي والتحقق
// من الصلاحية بيتم كله سيرفر سايد جوه update_own_profile() في schema.sql.
export default function MyProfile() {
  const { currentUser, refreshProfile } = useAuth();
  const { showToast } = usePoints();

  const isStudent = currentUser?.role === 'student';
  const isTrainingAccount = !!currentUser?.is_training_account;
  const className = currentUser?.class_id && currentUser.class_id !== 'all'
    ? CLASSES.find(c => c.id === currentUser.class_id)?.name
    : null;

  // طلب Mr. Gerges 2026-10-14: الخدام (أي دور غير المخدوم) يعدّلوا اسمهم بنفسهم.
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [guardianPhone, setGuardianPhone] = useState(currentUser?.guardian_phone || '');
  // طلب Mr. Gerges 2026-09-27: تاريخ الميلاد بقى قابل للتعديل الذاتي لأي
  // دور (مش بس المخدوم) — عشان أمين الخدمة يقدر يشوف "أعياد ميلاد الشهر
  // ده" لكل الخدام في الإحصائيات العامة.
  const [birthDate, setBirthDate] = useState(currentUser?.birth_date || '');
  const [saving, setSaving] = useState(false);

  // حساب التدريب بس — تبديل الدور، شوف switch_training_role() في schema.sql
  const [trainingRole, setTrainingRole] = useState(currentUser?.role || 'servant');
  const [trainingClass, setTrainingClass] = useState(
    currentUser?.class_id && currentUser.class_id !== 'all' ? currentUser.class_id : CLASSES[0]?.id
  );
  const [switching, setSwitching] = useState(false);

  if (!currentUser) return null;

  const handleSave = async () => {
    if (!isStudent && !name.trim()) {
      showToast('خطأ', 'الاسم مطلوب ولا يمكن تركه فاضي', 0, 'error');
      return;
    }
    setSaving(true);
    try {
      await updateOwnProfile({
        userId: currentUser.id,
        name: isStudent ? null : name.trim(),
        phone,
        address: isStudent ? address : null,
        guardianPhone: isStudent ? guardianPhone : null,
        birthDate: birthDate || null,
        clearBirthDate: !birthDate
      });
      await refreshProfile();
      showToast('تم الحفظ ✏️', 'بياناتك اتحدثت بنجاح', 0, 'success');
    } catch (err) {
      showToast('خطأ', err.message || 'تعذر حفظ البيانات', 0, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchRole = async () => {
    setSwitching(true);
    try {
      await switchTrainingRole({
        userId: currentUser.id,
        role: trainingRole,
        classId: trainingRole === 'super_admin' ? 'all' : trainingClass
      });
      await refreshProfile();
      showToast('تم التبديل 🔄', `دلوقتي إنت داخل بدور: ${ROLE_LABELS[trainingRole]}`, 0, 'success');
    } catch (err) {
      showToast('خطأ', err.message || 'تعذر تبديل الدور', 0, 'error');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right max-w-2xl mx-auto">

      {/* Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-l from-sky-600 to-indigo-700 p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
            <UserCircle2 className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">بياناتي</h2>
            <p className="text-sky-100 text-xs mt-1">بياناتك الأساسية — تقدر تعدّل {isStudent ? 'رقم تليفونك' : 'اسمك ورقم تليفونك'} من هنا بنفسك</p>
          </div>
        </div>
      </div>

      {/* Read-only summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-500">الاسم</span>
          <span className="font-extrabold text-slate-900">{currentUser.name}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-500">الصفة</span>
          <span className="font-bold text-sm">{ROLE_LABELS[currentUser.role] || currentUser.role}</span>
        </div>
        {className && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500">الفصل</span>
            <span className="font-bold text-sm text-slate-700">{className}</span>
          </div>
        )}
        {currentUser.username && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">كود الدخول</span>
            <span className="font-mono font-extrabold text-sm text-sky-700">{currentUser.username}</span>
          </div>
        )}
      </div>

      {/* Editable fields */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
          <Phone className="w-4 h-4 text-sky-600" /> بيانات التواصل
        </h3>

        {!isStudent && (
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
              <UserCircle2 className="w-3.5 h-3.5" /> الاسم
            </label>
            <input
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-bold text-sm transition-all"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">رقم التليفون</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-bold text-sm transition-all"
          />
        </div>

        {/* طلب Mr. Gerges 2026-09-27: عيد الميلاد — متاح لكل الأدوار (مش
            بس المخدوم)، عشان أمين الخدمة يشوف أعياد ميلاد الخدام شهريًا. */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Cake className="w-3.5 h-3.5" /> تاريخ الميلاد
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-bold text-sm transition-all"
          />
        </div>

        {isStudent && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> العنوان
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-bold text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5" /> رقم ولي الأمر
              </label>
              <input
                type="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-bold text-sm transition-all"
              />
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

      {/* طلب Mr. Gerges 2026-09-25: تبديل الدور — ظاهر بس لو is_training_account
          = true على صف الحساب ده (مش أي حساب تاني، حتى أمين الخدمة الحقيقي).
          الصلاحية الحقيقية متأكد منها سيرفر سايد جوه switch_training_role() —
          الإخفاء هنا مجرد واجهة، مش الحماية. */}
      {isTrainingAccount && (
        <div className="bg-amber-50 rounded-2xl border-2 border-dashed border-amber-300 p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> وضع التدريب — تبديل الدور
          </h3>
          <p className="text-xs text-amber-800 font-medium -mt-2">
            ده حساب تدريب مخصوص — اختار الدور اللي عايز توريه للخدام وأنت بتشرحلهم، والموقع كله هيتصرف بنفس صلاحيات الدور ده فورًا.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-amber-700 mb-1.5">الدور</label>
              <select
                value={trainingRole}
                onChange={(e) => setTrainingRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold text-sm"
              >
                <option value="super_admin">👑 أمين خدمة عامة</option>
                <option value="class_admin">⛪️ أمين فصل</option>
                <option value="assistant_admin">🤝 أمين فصل مساعد</option>
                <option value="servant">✝️ خادم</option>
                <option value="student">🧒 مخدوم</option>
              </select>
            </div>

            {trainingRole !== 'super_admin' && (
              <div>
                <label className="block text-xs font-bold text-amber-700 mb-1.5">الفصل</label>
                <select
                  value={trainingClass}
                  onChange={(e) => setTrainingClass(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold text-sm"
                >
                  {CLASSES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
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
