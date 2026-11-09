import React, { useState, useEffect } from 'react';
import { Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';
import { getStudentBalance, ROLE_LABELS } from '../../services/supabase';
import { getTabsForRole } from '../../config/navigation';
import logo from '../../assets/eparchy-logo.png';

export default function Navbar({ activeTab, setActiveTab, badges = {} }) {
  const { role, currentUser, logout } = useAuth();
  const { refreshKey } = usePoints();
  const [studentPoints, setStudentPoints] = useState(0);

  // Fetch student balance whenever student user or transaction happens
  useEffect(() => {
    if (currentUser && currentUser.role === 'student') {
      getStudentBalance(currentUser.id).then(pts => setStudentPoints(pts));
    }
  }, [currentUser, refreshKey]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <img src={logo} alt="شعار الكنيسة" className="w-10 h-10 rounded-full shadow-md object-cover shrink-0" />
            <div>
              <h1 className="font-extrabold text-slate-900 text-lg leading-tight whitespace-nowrap">
                مدارس الأحد
              </h1>
              <p className="text-xs text-slate-500 font-medium whitespace-nowrap">إعدادي وثانوي بنات</p>
            </div>
          </div>

          {/* Desktop navigation — same list for every servant */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 overflow-x-auto no-scrollbar">
            {getTabsForRole(role).filter(t => !t.desktopHidden).map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const activeClass = tab.primary
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-white text-sky-700 shadow-sm border border-slate-200/60';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    active ? activeClass : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active && tab.primary ? '' : tab.iconClass || ''}`} /> {tab.shortLabel}
                  {badges[tab.id] > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center">{badges[tab.id]}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Student Balance Badge, Logged-in Person Info & Logout */}
          <div className="flex items-center gap-2">

            {/* Live Student Points Counter */}
            {currentUser && currentUser.role === 'student' && (
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3.5 py-1.5 rounded-2xl shadow-sm border border-amber-400 flex items-center gap-1.5 text-xs font-black animate-pulse-glow">
                <Sparkles className="w-4 h-4 fill-white" />
                <span>{studentPoints}</span>
                <span className="opacity-90 font-normal">نقطة</span>
              </div>
            )}

            {/* Logged-in identity + logout */}
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-slate-100/80 border border-slate-200 rounded-2xl py-1.5 pr-1.5 pl-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('my-profile')}
                  title="بياناتي"
                  className={`flex items-center gap-2.5 rounded-xl ${activeTab === 'my-profile' ? 'ring-2 ring-sky-400' : ''}`}
                >
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {currentUser.name?.[0]}
                </div>
                <div className="leading-tight text-right hidden sm:block xl:hidden 2xl:block">
                  <span className="block text-xs font-extrabold text-slate-900 max-w-[140px] truncate">{currentUser.name}</span>
                  <span className="block text-[10px] font-bold text-sky-700">{ROLE_LABELS[role] || role}</span>
                </div>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  title="تسجيل الخروج"
                  className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 border border-rose-200/60 transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
