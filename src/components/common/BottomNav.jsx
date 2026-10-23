import React from 'react';
import { Trophy, Award, QrCode, CalendarCheck, Users, User, UserPlus, BarChart3, CreditCard, UserCircle2, Music4, Cake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { role } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-1.5 dir-rtl transition-colors duration-300">
      {/* من 2026-09-18: الصفوف بقى فيها أزرار أكتر من قبل (إضافة مخدوم،
          وإضافة نقاط لأمين الخدمة كمان)، فبقى ممكن ميبقوش كلهم مرتاحين في
          سطر واحد على موبايل ضيق. بدل ما نسيبهم يتزنقوا/يلفوا على سطر تاني
          (صعب يتلمسوا وسهل حد ميلاحظهمش)، الصف بقى يعمل سكرول أفقي بدل كده
          — كل زرار فاضل بحجمه الطبيعي وسهل تلمسه بالسحب، وscrollbar
          اتخفى (no-scrollbar في index.css) عشان الشكل يفضل نضيف. */}
      <div className="flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">

        {/* SERVANT / CLASS ADMIN MOBILE NAV */}
        {(role === 'class_admin' || role === 'assistant_admin' || role === 'servant') && (
          <>
            <button
              onClick={() => setActiveTab('servant-leaderboard')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-leaderboard' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Trophy className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">الصدارة</span>
            </button>

            <button
              onClick={() => setActiveTab('servant-manual-points')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-manual-points' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Award className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">إضافة نقاط</span>
            </button>

            {/* Quick QR Scan Action Button */}
            <button
              onClick={() => setActiveTab('scanner')}
              className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/40 -mt-6 border-4 border-white transition-transform active:scale-95"
            >
              <QrCode className="w-6 h-6" />
            </button>

            {/* طلب 2026-09-20: إضافة مخدوم بقت متاحة لكل "الخدام" بالتساوي
                (أمين فصل/مساعد/خادم عادي)، مش بس أمين الفصل والمساعد زي
                الأول — الداتا نفسها متقفلة على فصل كل واحد فيهم بس من
                add_scoped_student() في قاعدة البيانات. (افتقاد الفصل اتشالت
                من هنا خالص، وبقت حصرية لأمين الخدمة العامة بس — شوف قايمته
                هو تحت.) */}
            <button
              onClick={() => setActiveTab('servant-add-student')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-add-student' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <UserPlus className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">إضافة مخدوم</span>
            </button>

            {/* طلب 2026-09-20: أكواد QR المخدومين — نفس زرار سطح المكتب. */}
            <button
              onClick={() => setActiveTab('servant-qr-directory')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-qr-directory' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <CreditCard className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">أكواد QR</span>
            </button>

            <button
              onClick={() => setActiveTab('servant-opening-segment')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-opening-segment' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Music4 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">الفقرة الافتتاحية</span>
            </button>
            <button
              onClick={() => setActiveTab('servant-birthdays')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-birthdays' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Cake className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">أعياد الميلاد</span>
            </button>

            <button
              onClick={() => setActiveTab('my-profile')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'my-profile' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <UserCircle2 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">بياناتي</span>
            </button>
          </>
        )}

        {/* SUPER ADMIN MOBILE NAV */}
        {role === 'super_admin' && (
          <>
            <button
              onClick={() => setActiveTab('admin-analytics')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'admin-analytics' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Trophy className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">الإحصائيات</span>
            </button>
            <button
              onClick={() => setActiveTab('admin-efteqad')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'admin-efteqad' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <CalendarCheck className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">الافتفاد</span>
            </button>
            <button
              onClick={() => setActiveTab('admin-users')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'admin-users' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">المستخدمين</span>
            </button>
            <button
              onClick={() => setActiveTab('servant-leaderboard')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-leaderboard' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Trophy className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">نقاط المخدومين</span>
            </button>
            {/* طلب 2026-09-18: أمين الخدمة العامة يقدر يزود/يخصم نقاط بنفسه
                برضو، مش بس يشوفها — نفس أداة "إضافة نقاط" اللي أمناء
                الفصول/المساعدين/الخدام شايفينها، شغالة تلقائيًا لكل
                الفصول لأمين الخدمة من غير أي تعديل في قاعدة البيانات. */}
            <button
              onClick={() => setActiveTab('servant-manual-points')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-manual-points' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Award className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">إضافة نقاط</span>
            </button>
            <button
              onClick={() => setActiveTab('servant-add-student')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-add-student' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <UserPlus className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">إضافة مخدوم</span>
            </button>
            {/* طلب 2026-09-19: سجل غياب وحضور الخدام — نفس زرار سطح المكتب. */}
            <button
              onClick={() => setActiveTab('servant-attendance-log')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-attendance-log' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">سجل حضور الخدام</span>
            </button>
            <button
              onClick={() => setActiveTab('servant-opening-segment')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-opening-segment' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Music4 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">الفقرة الافتتاحية</span>
            </button>
            <button
              onClick={() => setActiveTab('servant-birthdays')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'servant-birthdays' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Cake className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">أعياد الميلاد</span>
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'scanner' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <QrCode className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">تسجيل حضور</span>
            </button>
            <button
              onClick={() => setActiveTab('my-profile')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                activeTab === 'my-profile' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <UserCircle2 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">بياناتي</span>
            </button>
          </>
        )}

        {/* STUDENT MOBILE NAV */}
        {role === 'student' && (
          <>
            <button
              onClick={() => setActiveTab('student-card')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-4 rounded-xl transition-all ${
                activeTab === 'student-card' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] whitespace-nowrap">الكارت الرقمي</span>
            </button>
            <button
              onClick={() => setActiveTab('student-history')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-4 rounded-xl transition-all ${
                activeTab === 'student-history' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <CalendarCheck className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] whitespace-nowrap">سجل الحضور والنقاط</span>
            </button>
            <button
              onClick={() => setActiveTab('my-profile')}
              className={`flex flex-shrink-0 flex-col items-center py-1 px-4 rounded-xl transition-all ${
                activeTab === 'my-profile' ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <UserCircle2 className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] whitespace-nowrap">بياناتي</span>
            </button>
          </>
        )}

      </div>
    </div>
  );
}
