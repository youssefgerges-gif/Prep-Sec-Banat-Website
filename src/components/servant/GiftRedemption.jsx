import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, ShoppingBag, QrCode, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getGifts, getScopedStudents, getStudentBalance, redeemGift, CLASSES } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';
import Modal from '../common/Modal';

export default function GiftRedemption() {
  const { currentUser } = useAuth();
  const { showToast, triggerRefresh, refreshKey } = usePoints();

  // Class admins / assistant admins / servants only ever get back students
  // from THEIR OWN class (see getScopedStudents + get_scoped_students() in
  // schema.sql for where that's actually enforced) — super_admin sees
  // everyone. currentUser.role/class_id is passed only as a fallback for
  // local/mock mode; against a real Supabase project the server checks who
  // is actually logged in itself, so this can't be spoofed from the app.
  const isScoped = currentUser && currentUser.role !== 'super_admin';
  const scopedClassName = isScoped ? CLASSES.find(c => c.id === currentUser.class_id)?.name : null;

  const [gifts, setGifts] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentBalance, setStudentBalance] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const viewer = currentUser ? { role: currentUser.role, class_id: currentUser.class_id } : null;
    Promise.all([getGifts(), getScopedStudents(viewer)]).then(([giftList, stuList]) => {
      if (isMounted) {
        setGifts(giftList);
        setStudents(stuList);
        if (stuList.length > 0 && !selectedStudent) {
          setSelectedStudent(stuList[0]);
        }
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [refreshKey, currentUser?.role, currentUser?.class_id]);

  // Update selected student balance
  useEffect(() => {
    if (selectedStudent) {
      getStudentBalance(selectedStudent.id).then(pts => setStudentBalance(pts));
    }
  }, [selectedStudent, refreshKey]);

  const handleRedeemClick = (gift) => {
    if (!selectedStudent) {
      showToast('يرجى اختيار المخدوم', 'قم باختيار المخدوم أولاً للتحقق من رصيد النقاط', 0, 'error');
      return;
    }
    if (gift.stock <= 0) {
      showToast('الهدية نفذت', 'عذراً هذه الهدية غير متوفرة بالمخزون حالياً', 0, 'error');
      return;
    }
    if (studentBalance < gift.point_cost) {
      showToast(
        'رصيد غير كافٍ',
        `رصيد ${selectedStudent.name} (${studentBalance} نقطة) لا يكفي لاستبدال ${gift.name} (${gift.point_cost} نقطة)`,
        0,
        'error'
      );
      return;
    }

    setSelectedGift(gift);
    setConfirmModalOpen(true);
  };

  const executeRedemption = async () => {
    if (!selectedGift || !selectedStudent) return;
    setProcessing(true);

    try {
      const res = await redeemGift(selectedStudent.id, selectedGift.id, currentUser?.id || 'servant-1');
      triggerRefresh();
      setConfirmModalOpen(false);
      showToast(
        'تم استبدال الهدية بنجاح! 🎁',
        `تم تسليم "${res.giftName}" لـ ${selectedStudent.name}. الرصيد المتبقي: ${res.newBalance} نقطة`,
        0,
        'success'
      );
    } catch (err) {
      showToast('فشل الاستبدال', err.message || 'حدث خطأ أثناء عملية المقايضة', 0, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <ShoppingBag className="w-3.5 h-3.5" /> متجر المكافآت{scopedClassName ? ` — ${scopedClassName} فقط` : ''}
          </span>
          <h2 className="text-xl sm:text-2xl font-black">استبدال الهدايا للمخدومين</h2>
          <p className="text-emerald-100 text-xs mt-1">
            {isScoped
              ? `مقايضة نقاط مخدومي فصل "${scopedClassName || ''}" فقط بالهدايا والمكافآت المتوفرة بالمخزون`
              : 'مقايضة نقاط المخدومين بالهدايا والمكافآت المتوفرة بالمخزون'}
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner self-start sm:self-auto">
          <Gift className="w-10 h-10" />
        </div>
      </div>

      {/* Student Selector Toolbar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0 border border-sky-200/60">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="w-full md:w-64">
            <label className="text-[10px] font-extrabold text-slate-500 block">اختر المخدوم</label>
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => {
                const stu = students.find(s => s.id === e.target.value);
                if (stu) setSelectedStudent(stu);
              }}
              className="w-full bg-slate-50 text-slate-900 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            >
              {students.length === 0 && (
                <option value="">{isScoped ? `لا يوجد مخدومين في فصل "${scopedClassName || ''}"` : 'لا يوجد مخدومين'}</option>
              )}
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.qr_code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Balance Card */}
        {selectedStudent && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm w-full md:w-auto justify-center">
            <Sparkles className="w-5 h-5 fill-slate-950" />
            <span>رصيد {selectedStudent.name}: {studentBalance} نقطة</span>
          </div>
        )}

      </div>

      {/* Gifts Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
        <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-emerald-600" /> الهدايا المتاحة في المخزن
        </h3>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm">جاري تحميل الهدايا... ⏳</div>
        ) : gifts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">لا توجد هدايا مسجلة في المتجر.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gifts.map((gift) => {
              const canAfford = studentBalance >= gift.point_cost && gift.stock > 0;

              return (
                <div
                  key={gift.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 card-hover ${
                    gift.stock <= 0
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : canAfford
                      ? 'bg-white border-emerald-300 shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-4xl p-3 bg-slate-100 rounded-2xl shrink-0 border border-slate-200/60">
                      {gift.icon || '🎁'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-sm">{gift.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-md font-bold border border-amber-200/60">
                          {gift.point_cost} نقطة
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          gift.stock > 5 ? 'bg-slate-100 text-slate-700 border-slate-200' : gift.stock > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                        }`}>
                          المتبقي: {gift.stock}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeemClick(gift)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                      gift.stock <= 0
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    {gift.stock <= 0 ? (
                      'نفذت الكمية ❌'
                    ) : studentBalance < gift.point_cost ? (
                      `يحتاج ${gift.point_cost - studentBalance} نقطة إضافية`
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> استبدال الهدية للمخدوم
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="تأكيد استبدال الهدية"
        icon={Gift}
      >
        {selectedGift && selectedStudent && (
          <div className="space-y-4 text-slate-700">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <div className="text-5xl">{selectedGift.icon || '🎁'}</div>
              <h4 className="font-extrabold text-slate-900 text-base">{selectedGift.name}</h4>
              <p className="text-xs text-emerald-800 font-bold">
                سيتم خصم {selectedGift.point_cost} نقطة من رصيد {selectedStudent.name}
              </p>
            </div>

            <div className="text-xs space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span>الرصيد الحالي للمخدوم:</span>
                <span className="font-bold text-slate-900">{studentBalance} نقطة</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>تكلفة الهدية:</span>
                <span>-{selectedGift.point_cost} نقطة</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-slate-900">
                <span>الرصيد المتبقي بعد الاستبدال:</span>
                <span className="text-emerald-700">{studentBalance - selectedGift.point_cost} نقطة</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={executeRedemption}
                disabled={processing}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {processing ? 'جاري الاستبدال...' : 'تأكيد التسليم والمقايضة ✅'}
              </button>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs border border-slate-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
