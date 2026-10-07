import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, CheckCircle, Sparkles, RefreshCw, Smartphone, AlertTriangle, Search, Undo2, Loader2, CalendarDays } from 'lucide-react';
import {
  recordAttendance, cancelAttendance, getManualAttendanceRoster, getAttendanceLogs, CLASSES,
  getRecentThursdays, cairoLocalToDate, getCairoToday, ARABIC_MONTHS, hasMissingData
} from '../../services/supabase';
import { usePoints } from '../../context/PointsContext';

// تسجيل حضور المخدومات: بالكاميرا (كارت QR) أو يدوي من القايمة.
// الحضور للمخدومات بس — كارت خادم بيترفض.
export default function QRScanner({ onScanSuccess }) {
  const { showToast, triggerRefresh, refreshKey } = usePoints();
  const [lastScannedUser, setLastScannedUser] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanMethod, setScanMethod] = useState('camera'); // 'camera' or 'picker'
  const [cameraError, setCameraError] = useState(null);
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
  const scannerRef = useRef(null);

  // قايمة كل المخدومات للتسجيل اليدوي، مع بحث بالاسم وفلتر بالفصل.
  const [rosterUsers, setRosterUsers] = useState([]);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualClassFilter, setManualClassFilter] = useState('all');

  // التسجيل اليدوي: اختيار الخميس (النهارده لو خميس، أو خميس فات لو حد
  // اتنسي). لخميس فات بنختار هل جت في الميعاد (5 نقاط) ولا بعد 6:05 (2).
  const thursdays = getRecentThursdays(8);
  const todayIso = getCairoToday().iso;
  const [selectedThursday, setSelectedThursday] = useState(thursdays[0]);
  const [pastArrival, setPastArrival] = useState('on-time'); // 'on-time' | 'late'
  const isPastThursday = selectedThursday !== todayIso;
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    getManualAttendanceRoster()
      .then(setRosterUsers)
      .catch(() => setRosterUsers([]));
    getAttendanceLogs()
      .then(setAttendanceLogs)
      .catch(() => setAttendanceLogs([]));
  }, [refreshKey]);

  // سجل حضور كل مخدومة في الخميس المختار (بتوقيت القاهرة).
  const cairoDateOf = (ts) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date(ts));
  const logsOnSelectedDay = new Map();
  attendanceLogs.forEach(l => {
    if (cairoDateOf(l.timestamp) === selectedThursday && !logsOnSelectedDay.has(l.user_id)) {
      logsOnSelectedDay.set(l.user_id, l);
    }
  });

  const formatThursday = (iso) => {
    const [, m, d] = iso.split('-').map(Number);
    return `${iso === todayIso ? 'النهارده — ' : ''}الخميس ${d} ${ARABIC_MONTHS[m - 1]}`;
  };

  // لمسة على اسم غايبة = تسجيل حضور، ولمسة على اسم حاضرة = إلغاء الحضور ونقاطه.
  const handleManualToggle = async (user) => {
    if (busyId) return;
    const existing = logsOnSelectedDay.get(user.id);
    if (existing) {
      setBusyId(user.id);
      try {
        await cancelAttendance({ attendanceLogId: existing.id, studentId: user.id, timestamp: existing.timestamp });
        triggerRefresh();
        showToast('اتلغى الحضور ⏪', `${user.name} — واتشالت نقاط الحضور`, 0, 'success');
      } catch (err) {
        showToast('تعذر الإلغاء', err.message || 'حاول تاني', 0, 'error');
      } finally {
        setBusyId(null);
      }
      return;
    }
    const customTimestamp = isPastThursday
      ? cairoLocalToDate(selectedThursday, 18, pastArrival === 'on-time' ? 0 : 30).toISOString()
      : null;
    setBusyId(user.id);
    await handleQRProcess(user.qr_code, customTimestamp);
    setBusyId(null);
  };

  const handleQRProcess = async (qrString, customTimestamp = null) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await recordAttendance(qrString, customTimestamp);
      setLastScannedUser(result.user);
      setLastResult(result);
      triggerRefresh();
      showToast(
        result.onTime ? 'حضور في الميعاد! 🎉' : 'تم تسجيل الحضور (متأخر) ⏰',
        `أهلاً يا ${result.user.name}. اتسجل حضورك واتضافلك +${result.pointsAdded} ${result.pointsAdded > 2 ? 'نقاط' : 'نقطة'}`,
        result.pointsAdded,
        'success'
      );
      if (onScanSuccess) onScanSuccess(result);
    } catch (err) {
      showToast('خطأ في مسح QR', err.message || 'رمز QR غير معروف أو حدث خطأ أثناء التسجيل', 0, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Initialize the camera when camera mode is active — using the lower-level
  // Html5Qrcode API (Html5Qrcode.getCameras() + .start(cameraId, ...))
  // instead of the higher-level Html5QrcodeScanner widget we used before.
  //
  // Why: the widget picks a camera via a "facingMode" hint, and on some
  // Android camera stacks that hint gets silently accepted (the permission
  // prompt shows and is granted normally) but the resulting video stream
  // never actually renders — an empty/black box with no error anywhere.
  // Explicitly listing the real camera devices and starting a specific one
  // by its device ID (the officially recommended pattern for this exact
  // failure mode) sidesteps that facingMode negotiation entirely. We also
  // now show any startup error directly on screen (see cameraError below)
  // instead of only logging it to the console, so this can be diagnosed
  // without needing to plug the phone into a computer.
  useEffect(() => {
    if (scanMethod !== 'camera') return;
    let cancelled = false;
    let html5QrCode = null;
    setCameraError(null);

    const timer = setTimeout(async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const devices = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (!devices || devices.length === 0) {
          setCameraError('لم يتم العثور على أي كاميرا على هذا الجهاز.');
          return;
        }

        // Prefer a camera whose label mentions "back"/"rear" — most phones
        // report this once permission is granted. Otherwise, with more than
        // one camera the last one in the list is usually the main rear
        // camera on Android; with only one camera (most laptops), just use
        // it, front-facing or not.
        const backCamera =
          devices.find((d) => /back|rear|environment/i.test(d.label || '')) ||
          (devices.length > 1 ? devices[devices.length - 1] : devices[0]);

        await html5QrCode.start(
          backCamera.id,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            handleQRProcess(decodedText);
          },
          () => {
            // Ignore standard per-frame "no QR in this frame" scan errors
          }
        );
      } catch (e) {
        if (cancelled) return;
        console.warn("Camera QR Scanner initialization:", e);
        setCameraError(
          (e && (e.message || String(e))) ||
            'تعذر تشغيل الكاميرا. تأكد من السماح بإذن الكاميرا لهذا الموقع من إعدادات المتصفح، ثم أعد المحاولة.'
        );
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      const s = scannerRef.current;
      if (s) {
        if (s.isScanning) {
          s.stop().then(() => s.clear()).catch(() => {});
        } else {
          try { s.clear(); } catch (e) {}
        }
      }
    };
  }, [scanMethod, cameraRetryKey]);

  const trimmedManualQuery = manualSearchQuery.trim();
  const filteredRosterUsers = rosterUsers.filter(u =>
    (manualClassFilter === 'all' || u.class_id === manualClassFilter) &&
    (!trimmedManualQuery || u.name.includes(trimmedManualQuery))
  );

  // تقسيم القايمة على الفصول، ومن غير عناوين فاضية بعد البحث.
  const groupedByClass = CLASSES
    .map(c => ({ classInfo: c, people: filteredRosterUsers.filter(u => u.class_id === c.id) }))
    .filter(g => g.people.length > 0);

  const renderPersonCard = (user) => {
    const present = logsOnSelectedDay.has(user.id);
    const busy = busyId === user.id;
    return (
      <button
        key={user.id}
        onClick={() => handleManualToggle(user)}
        disabled={!!busyId}
        title={present ? 'اضغط لإلغاء حضورها' : 'اضغط لتسجيل حضورها'}
        className={`p-3.5 rounded-2xl border flex items-center justify-between text-right transition-all group ${
          present
            ? 'border-emerald-300 bg-emerald-50 hover:border-amber-400'
            : 'border-slate-200 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/50'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors shrink-0 ${
            present ? 'bg-emerald-500 text-white' : 'bg-sky-100 group-hover:bg-sky-600 text-sky-700 group-hover:text-white'
          }`}>
            {user.name[0]}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-xs truncate">{user.name}</h4>
            <span className="text-[10px] text-slate-500 block">
              {user.qr_code}
              {hasMissingData(user) && <span className="text-amber-600 font-bold"> · بيانات ناقصة</span>}
            </span>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 shrink-0 ${
          present ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white group-hover:scale-105 transition-transform'
        }`}>
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : present ? <Undo2 className="w-3 h-3" /> : null}
          {present ? 'حاضرة ✓' : 'تسجيل ⚡️'}
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 dir-rtl text-right">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 -translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
              <Camera className="w-3.5 h-3.5" /> ماسح كارت الخدمة
            </span>
            <h2 className="text-2xl font-black">تسجيل حضور المخدومات</h2>
            <p className="text-sky-100 text-xs mt-1">
              وجّه كاميرا الموبايل على كارت الـQR بتاع المخدومة، أو اختارها من القايمة.
              الخميس بس — لحد 6:05 م = 5 نقاط، بعد كده = 2 نقطة
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
            <QrCode className="w-8 h-8" />
          </div>
        </div>

        {/* Mode Switcher Tabs (Camera vs Quick Picker for Desktop Testing) */}
        <div className="flex items-center gap-2 mt-5 bg-black/20 p-1.5 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setScanMethod('camera')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              scanMethod === 'camera' ? 'bg-white text-sky-800 shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" /> الكاميرا الحية
          </button>
          <button
            onClick={() => setScanMethod('picker')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              scanMethod === 'picker' ? 'bg-white text-sky-800 shadow-md' : 'text-white/80 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" /> تسجيل الحضور يدويًا
          </button>
        </div>
      </div>

      {/* Main Scanner Container */}
      {scanMethod === 'camera' ? (
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 text-center space-y-4 transition-colors duration-300">
          <p className="text-slate-600 font-semibold text-sm">قم بتوجيه الكاميرا إلى رمز QR تسجيل الحضور</p>

          <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-sky-300 bg-slate-50 min-h-[300px] flex items-center justify-center">
            <div id="reader" className="w-full"></div>
            {cameraError && (
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <p className="text-slate-700 text-xs font-semibold leading-relaxed">{cameraError}</p>
                <button
                  onClick={() => setCameraRetryKey((k) => k + 1)}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-2">
                <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
                <span className="font-bold text-sky-800 text-sm">جاري تسجيل الحضور وإضافة النقاط...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MANUAL (NO-CAMERA) ATTENDANCE PICKER */
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-600" />
              اختار المخدومة لتسجيل حضورها
            </h3>
            <span className="text-xs text-slate-500 font-medium">لمسة تسجل، ولمسة تانية تلغي</span>
          </div>

          {/* اختيار الخميس — النهارده أو خميس فات */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-2">
            <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-600">
              <CalendarDays className="w-3.5 h-3.5" /> يوم اللقاء
            </label>
            <select
              value={selectedThursday}
              onChange={(e) => setSelectedThursday(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 font-bold text-xs py-2 px-3 rounded-xl"
            >
              {thursdays.map(t => <option key={t} value={t}>{formatThursday(t)}</option>)}
            </select>
            {isPastThursday && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-amber-700">ده خميس فات — المخدومة جت إمتى؟</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPastArrival('on-time')}
                    className={`py-2 rounded-xl text-[11px] font-black ${pastArrival === 'on-time' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                  >
                    لحد 6:05 (5 نقاط)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPastArrival('late')}
                    className={`py-2 rounded-xl text-[11px] font-black ${pastArrival === 'late' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                  >
                    بعد 6:05 (2 نقطة)
                  </button>
                </div>
              </div>
            )}
          </div>

          {rosterUsers.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-8">
              لسه مفيش مخدومات متسجلة. ضيفهم من شاشة "إضافة مخدومة".
            </p>
          ) : (
            <>
              {/* Search by name */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم..."
                  className="w-full bg-slate-50 text-slate-900 font-semibold text-xs py-2.5 pr-10 pl-3 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[{ id: 'all', name: 'كل الفصول' }, ...CLASSES].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setManualClassFilter(c.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                      manualClassFilter === c.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {filteredRosterUsers.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-8">مفيش نتائج مطابقة.</p>
              ) : (
                <div className="space-y-5">
                  {groupedByClass.map((g) => (
                    <div key={g.classInfo.id}>
                      <h4 className="text-xs font-black text-slate-700 mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                        {g.classInfo.name} ({g.people.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {g.people.map(renderPersonCard)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Success Popup Card overlay */}
      {lastScannedUser && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 shadow-lg flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-base">{lastScannedUser.name}</h4>
                <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  تم الحضور ✅
                </span>
              </div>
              <p className="text-emerald-800 text-xs mt-0.5 font-medium">
                {lastResult?.onTime ? 'في الميعاد (مكافأة)' : 'بعد 6:05 م'} — اتضافت {lastResult?.pointsAdded} لرصيدها
              </p>
            </div>
          </div>

          <div className="bg-amber-400 text-slate-900 px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1 shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 fill-amber-900" /> +{lastResult?.pointsAdded} {lastResult?.pointsAdded > 2 ? 'نقاط' : 'نقطة'}
          </div>
        </div>
      )}

    </div>
  );
}
