import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PointsProvider } from './context/PointsContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import BottomNav from './components/common/BottomNav';
import Toast from './components/common/Toast';
import Login from './components/auth/Login';
import MyProfile from './components/common/MyProfile';

// Scanner Component
import QRScanner from './components/scanner/QRScanner';

// Servant Components
import ClassLeaderboard from './components/servant/ClassLeaderboard';
import ManualPointsTool from './components/servant/ManualPointsTool';
import AddStudentTool from './components/servant/AddStudentTool';
import StudentQRDirectory from './components/servant/StudentQRDirectory';
import OpeningSegmentScores from './components/servant/OpeningSegmentScores';
import StudentBirthdays from './components/servant/StudentBirthdays';
import BirthdaysPage from './components/servant/BirthdaysPage';

// Admin Components
import Analytics from './components/admin/Analytics';
import AbsenceTracker from './components/admin/AbsenceTracker';
import UserManagement from './components/admin/UserManagement';
import ServantAttendanceLog from './components/admin/ServantAttendanceLog';

// Student Components
import StudentCard from './components/student/StudentCard';
import HistoryTimeline from './components/student/HistoryTimeline';

// طلب 2026-09-19: كل تاب متاح لكل دور — بتُستخدم في حاجتين: (أ) للتحقق إن
// التاب اللي جاي من رابط الصفحة (؟tab=...) صالح فعلاً لدور المستخدم قبل ما
// نوقف عليه، و(ب) كتفصيل يوضّح إيه اللي المفروض يبقى متاح لكل دور.
// طلب 2026-09-20: "الخدام" التلاتة (أمين فصل / أمين فصل مساعد / خادم عادي)
// بقى عندهم نفس التابات بالظبط — إضافة مخدوم اتضافت للخادم العادي، وافتقاد
// الفصل اتشالت من الكل خالص وبقت حصرية لأمين الخدمة العامة بس (super_admin).
// طلب 2026-09-20 (نسخة تالتة، نفس اليوم): "أكواد QR المخدومين" اتفتحت لكل
// الخدام التلاتة برضو — شاشة جديدة، عرض بس، مقفولة على فصل كل واحد فيهم
// (StudentQRDirectory.jsx). super_admin مش محتاجها هنا لأن عنده أصلاً شاشة
// "الخدام والمخدومين" (UserManagement) اللي بتغطي ده وأكتر.
// طلب Mr. Gerges 2026-09-25: "بياناتي" (MyProfile) متاحة لكل الأدوار من
// غير استثناء — شاشة عرض/تعديل ذاتي للبيانات الأساسية، فاتضافت آخر كل
// array تحت.
const TABS_BY_ROLE = {
  super_admin: ['admin-analytics', 'admin-efteqad', 'admin-users', 'servant-leaderboard', 'servant-manual-points', 'servant-add-student', 'servant-attendance-log', 'servant-opening-segment', 'servant-birthdays', 'scanner', 'my-profile'],
  class_admin: ['scanner', 'servant-leaderboard', 'servant-manual-points', 'servant-add-student', 'servant-qr-directory', 'servant-opening-segment', 'servant-birthdays', 'my-profile'],
  assistant_admin: ['scanner', 'servant-leaderboard', 'servant-manual-points', 'servant-add-student', 'servant-qr-directory', 'servant-opening-segment', 'servant-birthdays', 'my-profile'],
  servant: ['scanner', 'servant-leaderboard', 'servant-manual-points', 'servant-add-student', 'servant-qr-directory', 'servant-opening-segment', 'servant-birthdays', 'my-profile'],
  student: ['student-card', 'student-history', 'my-profile']
};
const DEFAULT_TAB_BY_ROLE = {
  super_admin: 'admin-analytics',
  student: 'student-card'
};

// قراءة اسم التاب الحالي من رابط الصفحة (؟tab=...) لو موجود.
function getTabFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get('tab');
  } catch {
    return null;
  }
}

function MainContent() {
  const { role, currentUser, loading } = useAuth();
  // طلب 2026-09-19: الريفريش كان بيرجّع المستخدم دايمًا لتاب افتراضي (مش
  // اللي كان واقف فيه) لأن activeTab كانت مجرد useState عادي من غير أي ربط
  // بالرابط. دلوقتي بنقرا التاب من رابط الصفحة أول ما الصفحة تفتح (أو
  // 'scanner' لو مفيش حاجة فيه لسه)، وده بيتصحح فورًا تحت لما الدور يتعرف.
  const [activeTab, setActiveTab] = useState(() => getTabFromUrl() || 'scanner');

  // Land on the right tab once we know who's actually logged in (role is
  // unknown until the session/profile finishes loading): استخدم التاب اللي
  // في رابط الصفحة لو صالح لدور المستخدم ده، وإلا ارجع للتاب الافتراضي بتاعه.
  useEffect(() => {
    if (role) {
      const validTabs = TABS_BY_ROLE[role] || [];
      const urlTab = getTabFromUrl();
      const fallback = DEFAULT_TAB_BY_ROLE[role] || 'scanner';
      setActiveTab(urlTab && validTabs.includes(urlTab) ? urlTab : fallback);
    }
  }, [role]);

  // حدّث رابط الصفحة (؟tab=...) كل ما التاب يتغيّر، عشان الريفريش (أو حفظ
  // الرابط/مشاركته) يرجّع نفس الشاشة بالظبط بدل ما يوقف على شاشة تانية.
  // طلب 2026-09-19 (تصحيح — كان بيخلي كل الحسابات توقف على "تسجيل الحضور"
  // بدل الصفحة الرئيسية بتاعتها): الإيفكت ده كان بيكتب القيمة المبدئية
  // المؤقتة لـ activeTab ('scanner') في رابط الصفحة فورًا من أول تحميل،
  // قبل ما دور المستخدم (role) يتعرف أصلاً — فلما الإيفكت اللي فوق بيحاول
  // يحدد التاب الصحيح لكل دور، كان بيلاقي "scanner" مكتوبة في الرابط ويفتكرها
  // تاب اختاره المستخدم فعلاً (بما إن "scanner" أصلاً تاب صالح لكل الأدوار
  // ما عدا المخدوم)، فمكانش بيرجّعه أبدًا للتاب الافتراضي بتاع دوره (زي
  // "admin-analytics" لأمين الخدمة). الحل: منكتبش حاجة في الرابط لحد ما
  // الدور يتعرف فعلاً، عشان الإيفكت التاني يقرا رابط نضيف ويقرر صح.
  useEffect(() => {
    if (!activeTab || !role) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') !== activeTab) {
        params.set('tab', activeTab);
        window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
      }
    } catch {
      // مجرد تحسين — مش المفروض يوقف أي تنقل لو فشل لأي سبب
    }
  }, [activeTab, role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 transition-colors duration-300">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-slate-50 text-slate-800 transition-colors duration-300 dir-rtl">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Gamified Toast Popup */}
      <Toast />

      {/* View Router Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* GENERAL SERVICE ADMIN (أمناء الخدمة العامة: أبونا بيشوي / يوسف جرجس) */}
        {role === 'super_admin' && (
          <>
            {activeTab === 'admin-analytics' && <Analytics />}
            {activeTab === 'admin-efteqad' && <AbsenceTracker />}
            {activeTab === 'admin-users' && <UserManagement />}
            {/* أمين الخدمة العامة كمان لازم يقدر يشوف رصيد نقاط/كوبونات أي
                مخدوم — نفس شاشة لوحة الصدارة اللي أمناء الفصول والخدام
                شايفينها، بس هنا بتغطي كل الفصول (نفس الاختيار المتاح أصلاً
                من قايمة الفصول جوه الشاشة نفسها). */}
            {activeTab === 'servant-leaderboard' && <ClassLeaderboard />}
            {/* طلب 2026-09-18: أمين الخدمة العامة عايز يقدر يزود/يخصم نقاط
                بنفسه برضو، مش بس يشوفها. نفس أداة "إضافة نقاط يدوي" اللي
                أمناء الفصول/المساعدين/الخدام بيستخدموها — الأداة دي أصلاً
                مكتوبة بشكل عام: get_scoped_students() في قاعدة البيانات
                بترجع كل المخدومين (كل الفصول) لـ super_admin تلقائيًا، وسياسة
                "Staff can add points" في schema.sql بتسمح لأي دور غير
                "مخدوم" (يعني super_admin كمان) إنه يضيف صف جديد في
                points_ledger — فمفيش أي تعديل مطلوب في قاعدة البيانات أو في
                الأداة نفسها، مجرد إتاحة الشاشة لـ super_admin هنا كمان. */}
            {activeTab === 'servant-manual-points' && <ManualPointsTool />}
            {/* أمين الخدمة العامة أصلاً عنده صلاحية إضافة أي شخص من شاشة
                "الخدام والمخدومين" (UserManagement) — الشاشة دي هنا مجرد
                طريقة أسرع لإضافة مخدوم بس من غير المرور على الشاشة الكاملة،
                نفس الأداة اللي أمناء الفصول بيستخدموها، وبتسمح له كمان
                باختيار أي فصل (مش مقفول على فصل واحد زيهم). */}
            {activeTab === 'servant-add-student' && <AddStudentTool />}
            {/* طلب 2026-09-19: سجل غياب وحضور الخدام — يوضّح لأمين الخدمة
                العامة كل خادم (أمين فصل / مساعد / خادم عادي) حضر كام جمعة من
                أصل جمع الموسم اللي بدأ من الجمعة 25 سبتمبر 2026 لغاية الجمعة
                18 سبتمبر 2027 (مدارس الأحد بتقابل يوم الجمعة الساعة 5:30
                عصرًا). الحساب نفسه بيتم في get_servant_attendance_log() في
                قاعدة البيانات (super_admin فقط). */}
            {activeTab === 'servant-attendance-log' && <ServantAttendanceLog />}
            {/* طلب Mr. Gerges 2026-09-27: "الفقرة الافتتاحية" — درجات الفصل
                ككل (ترنيمة/قراءة إنجيل/أسئلة/هدوء)، متاحة لأمين الخدمة العامة
                لأي فصل (مش مقفول على فصل واحد زي باقي الخدام). */}
            {activeTab === 'servant-opening-segment' && <OpeningSegmentScores />}
            {activeTab === 'servant-birthdays' && <BirthdaysPage />}
            {/* أمين الخدمة العامة ما كانش قدامه أي طريقة يسجل بيها حضور خالص
                (لا كاميرا ولا تسجيل يدوي) — نفس شاشة الماسح اللي أمناء
                الفصول/المساعدين/الخدام شايفينها، وبما إنه مش مقفول على فصل
                معين، هيشوف كل الفصول في تبويب التسجيل اليدوي (get_manual_
                attendance_roster() في schema.sql بترجع الكل لـ super_admin). */}
            {activeTab === 'scanner' && (
              <>
                {/* طلب Mr. Gerges 2026-10-23: أعياد ميلاد المخدومين لكل الخدام */}
                <StudentBirthdays />
                <QRScanner />
              </>
            )}
          </>
        )}

        {/* CLASS ADMIN / ASSISTANT ADMIN / SERVANT (أمين الفصل / أمين مساعد / خادم) */}
        {(role === 'class_admin' || role === 'assistant_admin' || role === 'servant') && (
          <>
            {activeTab === 'scanner' && (
              <>
                {/* طلب Mr. Gerges 2026-10-23: أعياد ميلاد المخدومين لكل الخدام */}
                <StudentBirthdays />
                <QRScanner />
              </>
            )}
            {activeTab === 'servant-leaderboard' && <ClassLeaderboard />}
            {activeTab === 'servant-manual-points' && <ManualPointsTool />}
            {/* طلب 2026-09-20: إضافة مخدوم بقت متاحة للتلاتة أدوار دول
                بالتساوي (كانت أمين الفصل والمساعد بس قبل كده) — add_scoped_
                student() في قاعدة البيانات بقت بتقبل 'servant' كمان، وبتقفل
                دايمًا على فصل صاحب الحساب نفسه، مش مجرد إخفاء/إظهار الزرار.
                افتقاد الفصل (AbsenceTracker) اتشالت من هنا خالص — بقت حصرية
                لأمين الخدمة العامة بس، فوق في قسم super_admin. */}
            {activeTab === 'servant-add-student' && <AddStudentTool />}
            {/* طلب 2026-09-20: أكواد QR المخدومين — عرض بس، مقفولة على فصل
                صاحب الحساب سيرفر سايد جوه get_manual_attendance_roster()
                (نفس الدالة المستخدمة أصلاً في تبويب التسجيل اليدوي بشاشة
                الماسح). */}
            {activeTab === 'servant-qr-directory' && <StudentQRDirectory />}
            {/* طلب Mr. Gerges 2026-09-27: "الفقرة الافتتاحية" — مقفولة على
                فصل صاحب الحساب سيرفر سايد جوه record_opening_segment_score()
                و get_opening_segment_score(). */}
            {activeTab === 'servant-opening-segment' && <OpeningSegmentScores />}
            {activeTab === 'servant-birthdays' && <BirthdaysPage />}
          </>
        )}

        {/* STUDENT / PARENT (المخدوم / ولي الأمر) */}
        {role === 'student' && (
          <>
            {activeTab === 'student-card' && <StudentCard />}
            {activeTab === 'student-history' && <HistoryTimeline />}
          </>
        )}

        {/* طلب Mr. Gerges 2026-09-25: "بياناتي" — صالحة لأي دور، فمكتوبة مرة
            واحدة هنا برا أي شرط على role. */}
        {activeTab === 'my-profile' && <MyProfile />}

      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PointsProvider>
          <MainContent />
        </PointsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
