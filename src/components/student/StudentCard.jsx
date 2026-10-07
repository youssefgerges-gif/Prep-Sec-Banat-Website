import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Sparkles, QrCode, Church, Award, Shield, UserCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePoints } from '../../context/PointsContext';
import { getStudentBalance, getClassName } from '../../services/supabase';

export default function StudentCard() {
  const { currentUser, allUsers, selectUser } = useAuth();
  const { refreshKey } = usePoints();
  const [balance, setBalance] = useState(0);

  const studentUsers = allUsers.filter(u => u.role === 'student');
  const currentStudent = currentUser?.role === 'student' ? currentUser : studentUsers[0];

  useEffect(() => {
    if (currentStudent) {
      getStudentBalance(currentStudent.id).then(pts => setBalance(pts));
    }
  }, [currentStudent, refreshKey]);

  if (!currentStudent) return null;

  const className = getClassName(currentStudent.class_id);

  return (
    <div className="max-w-md mx-auto space-y-6 dir-rtl text-right">
      
      {/* لو ولي أمر عنده أكتر من بنت على نفس الحساب */}
      {studentUsers.length > 1 && (
      <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-100 flex items-center justify-between gap-3 transition-colors duration-300">
        <span className="text-xs font-extrabold text-slate-600 shrink-0">المخدومة:</span>
        <select
          value={currentStudent.id}
          onChange={(e) => {
            const stu = studentUsers.find(s => s.id === e.target.value);
            if (stu) selectUser(stu);
          }}
          className="flex-1 bg-slate-50 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-sky-500"
        >
          {studentUsers.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.qr_code})</option>
          ))}
        </select>
      </div>
      )}

      {/* Main Digital Church Membership Card */}
      <div className="relative rounded-3xl p-6 text-white shadow-2xl overflow-hidden border border-white/20">

        <div className="absolute inset-0 bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600" />

        {/* Decorative Ambient Blurs */}
        <div className="absolute top-0 left-0 -translate-x-6 -translate-y-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 translate-x-6 translate-y-6 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300">
              <Church className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide">كارت المخدومة</h3>
              <p className="text-[10px] text-sky-100 font-medium">مدارس الأحد — إعدادي وثانوي بنات</p>
            </div>
          </div>

          <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-sm">
            {className}
          </span>
        </div>

        {/* Card Body: QR Code & Student Name */}
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          
          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-white/30 transform hover:scale-105 transition-transform duration-300">
            <QRCodeSVG value={currentStudent.qr_code} size={170} />
          </div>

          {/* Student Profile Info */}
          <div>
            <h2 className="text-2xl font-black">{currentStudent.name}</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-mono font-bold mt-1">
              <QrCode className="w-3.5 h-3.5 text-amber-300" /> {currentStudent.qr_code}
            </div>
          </div>

        </div>

        {/* Card Footer: Live Points Badge */}
        <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs text-sky-100 font-medium">رصيد النقاط المحتسب:</span>
          
          <div className="bg-amber-400 text-slate-950 px-4 py-2 rounded-2xl font-black text-base flex items-center gap-1.5 shadow-lg border border-amber-300 animate-pulse-glow">
            <Sparkles className="w-5 h-5 fill-slate-950" />
            <span>{balance}</span>
            <span className="text-xs font-normal">نقطة 🌟</span>
          </div>
        </div>

        </div>

      </div>

    </div>
  );
}
