import React, { useState, useMemo, useEffect } from 'react';
import { Send, MessageCircle, Sparkles, CheckCircle2, User, Phone, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { usePoints } from '../../context/PointsContext';
import { getClassName } from '../../services/supabase';

export default function WhatsAppModal({ isOpen, onClose, recipient }) {
  const { showToast } = usePoints();
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [messageText, setMessageText] = useState('');

  const TEMPLATES = useMemo(() => {
    if (!recipient) return [];
    const isStudent = recipient.role === 'student';
    const className = getClassName(recipient.class_id);
    const weeksAbsent = recipient.weeks_absent || 2;
    // المخدومات بنات، فالرسايل ليهم بصيغة المؤنث.
    const you = isStudent ? 'عليكي' : 'عليك';
    const missed = isStudent ? 'افتقدناكي' : 'افتقدناك';
    const templates = [
      {
        id: 'efteqad',
        title: '🌹 افتقاد واطمئنان',
        text: `سلام ونعمة يا ${recipient.name} 🌹\nبنطمن ${you} من خدمة مدارس الأحد، ${missed} في الاجتماع.\nمستنيينك الأسبوع ده بكل فرح! ⛪️✨`
      },
      {
        id: 'absence_alert',
        title: '⚠️ غياب متكرر',
        text: `سلام ونعمة يا ${recipient.name} ⚠️\nلاحظنا إن الغياب زاد الفترة اللي فاتت (${weeksAbsent} أسابيع).\nبنتمنى ${isStudent ? 'تكوني' : 'تكون'} بكل خير، ومحتاجين نطمن ${you} 🌹✨`
      },
      {
        id: 'meeting_reminder',
        title: '⛪️ تذكير بميعاد الاجتماع',
        text: `سلام ونعمة يا ${recipient.name} ⛪️✨\nبنفكّرك بميعاد اجتماع مدارس الأحد الجاي${isStudent ? ` (${className})` : ''} بكنيسة مارمينا والبابا كيرلس.\nحضورك بيفرّحنا! 🌟`
      },
      {
        id: 'birthday',
        title: '🎉 عيد ميلاد / مناسبة',
        text: `كل سنة ${isStudent ? 'وانتي طيبة' : 'وانت طيب'} يا ${recipient.name} 🎉🎂\nخدمة مدارس الأحد بتتمنالك سنة جديدة مباركة مليانة فرح وبركة مع المسيح 🎈✨`
      },
      {
        id: 'custom',
        title: '✏️ رسالة يدوية',
        text: `سلام ونعمة يا ${recipient.name} 🌹\n`
      }
    ];
    return templates;
  }, [recipient]);

  useEffect(() => {
    if (isOpen && TEMPLATES.length > 0) {
      setSelectedTemplateIndex(0);
      setMessageText(TEMPLATES[0].text);
    }
  }, [isOpen, recipient?.id]);

  if (!recipient) return null;

  const className = getClassName(recipient.class_id);

  const handleSend = () => {
    if (!messageText.trim()) {
      showToast('الرسالة فارغة', 'يرجى اختيار اسطمبة أو كتابة نص الرسالة', 0, 'error');
      return;
    }

    // للمخدومة: رقمها لو موجود، وإلا رقم ولي الأمر.
    let phone = recipient.phone || recipient.guardian_phone || '';
    phone = phone.replace(/\D/g, '');

    if (!phone) {
      showToast('رقم غير مسجل', 'رقم الهاتف غير مسجل لهذا الشخص', 0, 'error');
      return;
    }

    if (phone.startsWith('0')) {
      phone = '2' + phone;
    }

    const cleanedText = messageText
      .replace(/[\uFE00-\uFE0F]/g, '')
      .normalize('NFC');

    const encodedMessage = encodeURIComponent(cleanedText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    showToast(
      'تم فتح تطبيق الواتساب 📲',
      `جاري إرسال الرسالة إلى ${recipient.name} (${phone})`,
      0,
      'success'
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`إرسال رسالة واتساب: ${recipient.name}`}
      icon={MessageCircle}
    >
      <div className="space-y-4 text-right dir-rtl">
        
        {/* Recipient Info Card */}
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-black flex items-center justify-center shrink-0 shadow-sm">
              {recipient.name[0]}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">{recipient.name}</h4>
              <span className="text-[10px] text-sky-700 font-bold block">
                {recipient.role === 'student' ? `مخدومة — ${className}` : 'خادم'}
              </span>
            </div>
          </div>
          <div className="text-left">
            <span className="text-[11px] font-mono font-bold text-slate-700 block dir-ltr">
              {recipient.phone || recipient.guardian_phone || 'بدون رقم'}
            </span>
            {recipient.weeks_absent > 0 && (
              <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-rose-200/60">
                غياب {recipient.weeks_absent} أسابيع
              </span>
            )}
          </div>
        </div>

        {/* Template Selector Options */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر نموذج الرسالة (الاسطمبة):</label>
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  setSelectedTemplateIndex(idx);
                  setMessageText(tmpl.text);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center justify-between ${
                  selectedTemplateIndex === idx
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{tmpl.title}</span>
                {selectedTemplateIndex === idx && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Editable Text Area Preview */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {selectedTemplateIndex === TEMPLATES.length - 1 ? 'نص الرسالة اليدوية:' : 'معاينة وتعديل نص الرسالة:'}
          </label>
          <textarea
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 leading-relaxed transition-all"
            placeholder="اكتب نص الرسالة هنا..."
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" /> فتح وإرسال عبر الواتساب (WhatsApp)
        </button>

      </div>
    </Modal>
  );
}
