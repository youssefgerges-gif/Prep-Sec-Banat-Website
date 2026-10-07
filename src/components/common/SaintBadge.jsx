import React from 'react';
import { Sparkles, Shield, Heart } from 'lucide-react';
import SaintIconArt from './SaintIconArt';

export default function SaintBadge({ classInfo, size = 'medium' }) {
  if (!classInfo) return null;

  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 bg-gradient-to-r ${classInfo.color || 'from-indigo-600 to-sky-600'} text-white shadow-xl flex items-center justify-between border border-white/20`}>
      {/* Background Coptic Cross Pattern & Glow */}
      <div className="absolute top-0 left-0 -translate-x-6 -translate-y-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 right-0 translate-x-6 translate-y-6 w-24 h-24 bg-amber-400/20 rounded-full blur-xl"></div>

      <div className="relative z-10 space-y-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
          <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> شفيع الفصل القديس المبارك
        </span>
        <h3 className="text-xl font-black">{classInfo.saintName || classInfo.patron}</h3>
        <p className="text-white/90 text-xs font-medium">{classInfo.saintTitle}</p>
        <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-white/80">
          <span>أمين الفصل: <strong className="text-white">{classInfo.admin}</strong></span>
          <span>•</span>
          <span>المساعد: <strong className="text-white">{classInfo.assistantAdmin}</strong></span>
        </div>
      </div>

      {/* Real Saint Photo Artwork with Golden Halo */}
      <div className="relative shrink-0 mr-3 z-10">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-2xl backdrop-blur-md ring-4 ring-amber-400/30">
          <SaintIconArt classId={classInfo.id} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
