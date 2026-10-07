import React, { useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTabsForRole } from '../../config/navigation';

// شريط التنقل السفلي على الموبايل. التابات اللي عليها `mobile: true` في
// config/navigation.js بتظهر في الشريط نفسه (والتاب `primary` بيبقى الزرار
// الكبير في النص)، والباقي بيظهر في قايمة "المزيد" عشان كل زرار يفضل كبير
// وسهل يتلمس بدل ما الشريط يتزحم.
export default function BottomNav({ activeTab, setActiveTab, badges = {} }) {
  const { role } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = getTabsForRole(role);
  if (tabs.length === 0) return null;

  const barTabs = tabs.filter(t => t.mobile);
  const moreTabs = tabs.filter(t => !t.mobile);
  const moreActive = moreTabs.some(t => t.id === activeTab);
  const moreBadge = moreTabs.reduce((sum, t) => sum + (badges[t.id] || 0), 0);
  const Badge = ({ n }) => n > 0 ? (
    <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-pink-600 text-white text-[9px] font-black flex items-center justify-center">{n}</span>
  ) : null;

  const go = (id) => {
    setActiveTab(id);
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen && (
        <div className="xl:hidden fixed inset-0 z-40 bg-slate-900/30" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-20 left-3 right-3 bg-white rounded-3xl shadow-xl border border-slate-200 p-3 dir-rtl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-xs font-black text-slate-700">شاشات تانية</span>
              <button type="button" onClick={() => setMoreOpen(false)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center" aria-label="إغلاق">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {moreTabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => go(tab.id)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-bold text-right transition-colors ${
                      active ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${tab.iconClass || ''}`} />
                    <span className="flex-1">{tab.label}</span>
                    {badges[tab.id] > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center">{badges[tab.id]}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-1.5 dir-rtl transition-colors duration-300">
        <div className="flex items-center justify-around gap-1">
          {barTabs.map(tab => {
            const Icon = tab.icon;
            if (tab.primary) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => go(tab.id)}
                  aria-label={tab.label}
                  className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/40 -mt-6 border-4 border-white transition-transform active:scale-95"
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            }
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => go(tab.id)}
                className={`relative flex flex-shrink-0 flex-col items-center py-1 px-2 rounded-xl transition-all ${
                  active ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
                }`}
              >
                <Badge n={badges[tab.id]} />
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] whitespace-nowrap">{tab.shortLabel}</span>
              </button>
            );
          })}

          {moreTabs.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(o => !o)}
              className={`relative flex flex-shrink-0 flex-col items-center py-1 px-2 rounded-xl transition-all ${
                moreActive || moreOpen ? 'text-sky-600 font-extrabold' : 'text-slate-500 font-medium'
              }`}
            >
              <Badge n={moreBadge} />
              <MoreHorizontal className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] whitespace-nowrap">المزيد</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
