import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PointsProvider } from './context/PointsContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import BottomNav from './components/common/BottomNav';
import Toast from './components/common/Toast';
import Login from './components/auth/Login';

// Scanner Component
import QRScanner from './components/scanner/QRScanner';

// Servant Components
import ClassLeaderboard from './components/servant/ClassLeaderboard';
import ManualPointsTool from './components/servant/ManualPointsTool';
import AddStudentTool from './components/servant/AddStudentTool';
import StudentQRDirectory from './components/servant/StudentQRDirectory';
import Birthdays from './components/servant/Birthdays';
import MyProfile from './components/common/MyProfile';
import ServantsAdmin from './components/admin/ServantsAdmin';
import PendingApproval from './components/auth/PendingApproval';
import { isServant } from './services/supabase';
import BirthdayBanner, { useBirthdaySummary } from './components/common/BirthdayBanner';

// Admin Components
import Analytics from './components/admin/Analytics';
import AbsenceTracker from './components/admin/AbsenceTracker';
import UserManagement from './components/admin/UserManagement';

// Student Components
import StudentCard from './components/student/StudentCard';
import HistoryTimeline from './components/student/HistoryTimeline';
import { TABS_BY_ROLE, DEFAULT_TAB_BY_ROLE } from './config/navigation';

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
  const isActive = (currentUser?.status || 'active') === 'active';
  const staff = isServant(role) && isActive;
  const birthdaySummary = useBirthdaySummary(staff);
  const { allUsers } = useAuth();
  const pendingServants = role === 'admin' ? (allUsers || []).filter(u => u.role === 'servant' && u.status === 'pending').length : 0;
  // أرقام على التابات: هدايا أعياد الميلاد اللي لسه، وطلبات الخدام الجداد.
  const tabBadges = {
    ...(birthdaySummary?.pending ? { birthdays: birthdaySummary.pending } : {}),
    ...(pendingServants ? { 'servants-admin': pendingServants } : {})
  };

  // Land on the right tab once we know who's actually logged in (role is
  // unknown until the session/profile finishes loading): استخدم التاب اللي
  // في رابط الصفحة لو صالح لدور المستخدم ده، وإلا ارجع للتاب الافتراضي بتاعه.
  useEffect(() => {
    if (role) {
      const validTabs = (TABS_BY_ROLE[role] || []).map(t => t.id);
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

  // خادم لسه مستني موافقة أمين الخدمة، أو حساب موقوف.
  if (!isActive) {
    return <PendingApproval />;
  }

  return (
    <div className="min-h-screen pb-24 xl:pb-12 bg-slate-50 text-slate-800 transition-colors duration-300 dir-rtl">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} badges={tabBadges} />

      {/* Gamified Toast Popup */}
      <Toast />

      {/* View Router Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* الخدام — كلهم نفس الصلاحيات ونفس الشاشات */}
        {staff && activeTab !== 'birthdays' && (
          <BirthdayBanner summary={birthdaySummary} onOpen={() => setActiveTab('birthdays')} />
        )}

        {staff && (
          <>
            {activeTab === 'admin-analytics' && <Analytics />}
            {activeTab === 'scanner' && <QRScanner />}
            {activeTab === 'servant-leaderboard' && <ClassLeaderboard />}
            {activeTab === 'servant-manual-points' && <ManualPointsTool />}
            {activeTab === 'admin-efteqad' && <AbsenceTracker />}
            {activeTab === 'birthdays' && <Birthdays />}
            {activeTab === 'servant-add-student' && <AddStudentTool />}
            {activeTab === 'servant-qr-directory' && <StudentQRDirectory />}
            {activeTab === 'admin-users' && <UserManagement />}
            {role === 'admin' && activeTab === 'servants-admin' && <ServantsAdmin />}
          </>
        )}

        {/* المخدومة / ولي الأمر */}
        {role === 'student' && (
          <>
            {activeTab === 'student-card' && <StudentCard />}
            {activeTab === 'student-history' && <HistoryTimeline />}
          </>
        )}

        {/* بياناتي — لأي دور */}
        {activeTab === 'my-profile' && <MyProfile />}

      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} badges={tabBadges} />

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
