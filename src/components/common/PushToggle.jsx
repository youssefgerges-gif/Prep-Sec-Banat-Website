import React, { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Loader2, Share } from 'lucide-react';
import { getPushSupport, getCurrentSubscription, enablePush, disablePush } from '../../services/push';
import { usePoints } from '../../context/PointsContext';

// كارت تفعيل/إلغاء إشعارات الموبايل للخادم على الجهاز ده.
export default function PushToggle() {
  const { showToast } = usePoints();
  const support = getPushSupport();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!support.supported) return;
    getCurrentSubscription().then(sub => setEnabled(!!sub && Notification.permission === 'granted')).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // الإشعارات لسه مش متظبطة على السيرفر، أو وضع التجربة المحلي — منعرضش حاجة.
  if (support.reason === 'mock' || support.reason === 'not-configured') return null;

  if (support.reason === 'ios-home-screen') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900">
        <Share className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-xs font-bold leading-relaxed">
          عشان توصلك إشعارات أعياد الميلاد على الآيفون: من Safari دوس زرار المشاركة ثم "Add to Home Screen"،
          وافتح الموقع من الأيقونة الجديدة وفعّل الإشعارات من هنا.
        </p>
      </div>
    );
  }

  if (!support.supported) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600">
        <BellOff className="w-5 h-5 shrink-0" />
        <p className="text-xs font-bold">المتصفح ده مش بيدعم إشعارات الموبايل. جرّب Chrome.</p>
      </div>
    );
  }

  const toggle = async () => {
    setBusy(true);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
        showToast('اتقفلت الإشعارات', 'مش هيوصلك إشعارات على الجهاز ده', 0, 'success');
      } else {
        await enablePush();
        setEnabled(true);
        showToast('اتفعّلت الإشعارات 🔔', 'هيوصلك إشعار أول كل شهر بعدد أعياد الميلاد', 0, 'success');
      }
    } catch (err) {
      showToast('تعذر تغيير الإشعارات', err.message || 'حاول تاني', 0, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${enabled ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
      {enabled ? <BellRing className="w-5 h-5 text-emerald-700 shrink-0" /> : <Bell className="w-5 h-5 text-amber-700 shrink-0" />}
      <p className={`text-xs font-bold flex-1 ${enabled ? 'text-emerald-900' : 'text-amber-900'}`}>
        {enabled
          ? 'الإشعارات شغالة على الجهاز ده — هيوصلك إشعار أول كل شهر بعدد أعياد الميلاد.'
          : 'فعّل الإشعارات عشان يوصلك أول كل شهر عدد أعياد الميلاد، حتى لو الموقع مقفول.'}
      </p>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`shrink-0 px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 ${
          enabled ? 'bg-white text-slate-700 border border-slate-200' : 'bg-amber-500 text-white'
        }`}
      >
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {enabled ? 'إيقاف' : 'تفعيل'}
      </button>
    </div>
  );
}
