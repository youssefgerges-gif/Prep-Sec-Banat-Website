import React, { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2, Save, Sparkles, Box } from 'lucide-react';
import { getGifts, saveGift, deleteGift } from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';
import Modal from '../common/Modal';

export default function GiftInventory() {
  const { showToast, triggerRefresh, refreshKey } = usePoints();
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [formData, setFormData] = useState({ name: '', point_cost: 20, stock: 10, icon: '🎁' });

  const EMOJI_OPTIONS = ['📖', '✝️', '🖼️', '📓', '🧩', '✏️', '🏆', '🎁', '🎨', '🧸'];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getGifts().then(data => {
      if (isMounted) {
        setGifts(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [refreshKey]);

  const handleOpenAdd = () => {
    setEditingGift(null);
    setFormData({ name: '', point_cost: 20, stock: 10, icon: '🎁' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (gift) => {
    setEditingGift(gift);
    setFormData({ ...gift });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت تأكد من حذف هذه الهدية من المخزن؟')) {
      try {
        await deleteGift(id);
        triggerRefresh();
        showToast('تم الحذف', 'تم حذف الهدية من المخزن بنجاح', 0, 'success');
      } catch (err) {
        showToast('خطأ', err.message || 'فشل حذف الهدية', 0, 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await saveGift(formData);
      triggerRefresh();
      setIsModalOpen(false);
      showToast(
        editingGift ? 'تم تعديل الهدية! ✏️' : 'تم إضافة هدية جديدة! 🎉',
        `تم حفظ بيانات "${formData.name}" في مخزون الجوائز`,
        0,
        'success'
      );
    } catch (err) {
      showToast('خطأ في الحفظ', err.message || 'تعذر حفظ الهدية', 0, 'error');
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-sky-700 rounded-3xl p-6 text-white shadow-md flex items-center justify-between relative overflow-hidden">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <Box className="w-3.5 h-3.5" /> أمين المخزن والجوائز
          </span>
          <h2 className="text-2xl font-black">إدارة مخزون الهدايا والجوائز</h2>
          <p className="text-emerald-100 text-xs mt-1">إضافة وتعديل أسعار الهدايا بالنقاط وضبط الكميات المتاحة في المخزن</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> إضافة هدية جديدة
        </button>
      </div>

      {/* Gifts Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-sm">جاري تحميل جدول الهدايا... ⏳</div>
        ) : gifts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">لا توجد هدايا بالمخزن حالياً. اضغط "إضافة هدية جديدة".</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gifts.map((gift) => (
              <div key={gift.id} className="p-5 rounded-3xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-4 hover:border-sky-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-4xl p-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    {gift.icon || '🎁'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 text-sm">{gift.name}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="bg-amber-400 text-slate-950 text-xs px-2.5 py-0.5 rounded-lg font-black flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-slate-950" /> {gift.point_cost} نقطة
                      </span>
                      <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-lg font-bold">
                        المخزون: {gift.stock}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => handleOpenEdit(gift)}
                    className="flex-1 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-sky-600" /> تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(gift.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 text-rose-600 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Gift Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGift ? 'تعديل بيانات الهدية' : 'إضافة هدية جديدة للمخزن'}
        icon={Gift}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رمز الهدية التعبيري (Emoji)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border ${
                    formData.icon === emoji ? 'bg-sky-100 border-sky-500 scale-110' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم الهدية</label>
            <input
              type="text"
              required
              placeholder="مثال: كتاب مقدس مصور للأطفال..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التكلفة والنقاط</label>
              <input
                type="number"
                required
                min={1}
                value={formData.point_cost}
                onChange={(e) => setFormData({ ...formData, point_cost: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الكمية في المخزن</label>
              <input
                type="number"
                required
                min={0}
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md mt-2 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> حفظ بيانات الهدية
          </button>
        </form>
      </Modal>

    </div>
  );
}
