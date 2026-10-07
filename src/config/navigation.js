import { Trophy, Award, QrCode, CalendarCheck, Users, User, UserPlus, CreditCard, BarChart3, Cake, UserCircle2, ShieldCheck } from 'lucide-react';

// قايمة الشاشات لكل دور — مصدر واحد بيستخدمه App.jsx (التوجيه والتحقق من
// التاب اللي في الرابط) وNavbar (الكمبيوتر) وBottomNav (الموبايل).
//
// خدمة إعدادي وثانوي بنات: كل الخدام صلاحياتهم واحدة، فكلهم بيشوفوا نفس
// الشاشات بالظبط. `mobile: true` معناها التاب بيظهر في الشريط السفلي على
// الموبايل (الباقي بيظهر في قايمة "المزيد"). التاب اللي عليه `primary`
// بيبقى الزرار الكبير في النص. `desktopHidden` = مش في شريط الكمبيوتر
// (بياناتي بتتفتح بالضغط على اسمك فوق).
export const STAFF_TABS = [
  { id: 'admin-analytics', label: 'الإحصائيات', shortLabel: 'الإحصائيات', icon: BarChart3, iconClass: 'text-sky-600', mobile: true },
  { id: 'servant-leaderboard', label: 'لوحة الصدارة', shortLabel: 'الصدارة', icon: Trophy, iconClass: 'text-amber-500', mobile: true },
  { id: 'scanner', label: 'تسجيل الحضور', shortLabel: 'الحضور', icon: QrCode, primary: true, mobile: true },
  { id: 'servant-manual-points', label: 'إضافة نقاط', shortLabel: 'النقاط', icon: Award, iconClass: 'text-indigo-500', mobile: true },
  { id: 'admin-efteqad', label: 'الافتقاد', shortLabel: 'الافتقاد', icon: CalendarCheck, iconClass: 'text-rose-500', mobile: true },
  { id: 'birthdays', label: 'أعياد الميلاد', shortLabel: 'أعياد الميلاد', icon: Cake, iconClass: 'text-pink-600' },
  { id: 'servant-add-student', label: 'إضافة مخدومة', shortLabel: 'إضافة', icon: UserPlus, iconClass: 'text-emerald-600' },
  { id: 'servant-qr-directory', label: 'أكواد QR', shortLabel: 'QR', icon: CreditCard, iconClass: 'text-indigo-600' },
  { id: 'admin-users', label: 'الخدام والمخدومات', shortLabel: 'الكشوفات', icon: Users, iconClass: 'text-sky-600' },
  { id: 'my-profile', label: 'بياناتي', shortLabel: 'بياناتي', icon: UserCircle2, iconClass: 'text-slate-600', desktopHidden: true },
];

export const STUDENT_TABS = [
  { id: 'student-card', label: 'كارتي', shortLabel: 'كارتي', icon: User, iconClass: 'text-sky-600', mobile: true },
  { id: 'student-history', label: 'سجل الحضور والنقاط', shortLabel: 'السجل', icon: CalendarCheck, iconClass: 'text-indigo-600', mobile: true },
  { id: 'my-profile', label: 'بياناتي', shortLabel: 'بياناتي', icon: UserCircle2, iconClass: 'text-slate-600', mobile: true, desktopHidden: true },
];

// أمين الخدمة: نفس شاشات الخدام + "إدارة الخدام".
export const ADMIN_TABS = [
  ...STAFF_TABS.filter(t => t.id !== 'my-profile'),
  { id: 'servants-admin', label: 'إدارة الخدام', shortLabel: 'الخدام', icon: ShieldCheck, iconClass: 'text-violet-600' },
  STAFF_TABS.find(t => t.id === 'my-profile'),
];

export const TABS_BY_ROLE = {
  admin: ADMIN_TABS,
  servant: STAFF_TABS,
  student: STUDENT_TABS,
};

export const DEFAULT_TAB_BY_ROLE = {
  admin: 'admin-analytics',
  servant: 'admin-analytics',
  student: 'student-card',
};

export const getTabsForRole = (role) => TABS_BY_ROLE[role] || [];
