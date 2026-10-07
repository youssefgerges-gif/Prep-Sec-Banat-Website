import React from 'react';
import { SAINT_IMAGES } from '../../services/saintImages';

export default function SaintIconArt({ classId, className = "w-full h-full" }) {
  // Prefer the real saint photo when we have one for this class; fall back
  // to the hand-drawn SVG art below only if a class has no photo assigned.
  const photo = SAINT_IMAGES[classId];
  if (photo) {
    return <img src={photo} alt="أيقونة شفيع الفصل" className={`${className} object-cover`} />;
  }

  switch (classId) {
    case 'kg':
      // الملاك ميخائيل والشهيد أبانوب النهيسي
      return (
        <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goldBgKg" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>
            <radialGradient id="haloArch" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <linearGradient id="swordGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Ornate Wooden Icon Frame */}
          <rect width="400" height="400" rx="24" fill="#451a03" />
          <rect x="10" y="10" width="380" height="380" rx="18" fill="url(#goldBgKg)" stroke="#fef08a" strokeWidth="4" />
          <rect x="20" y="20" width="360" height="360" rx="14" fill="none" stroke="#78350f" strokeWidth="2" strokeDasharray="8 4" />

          {/* Coptic Arch Header */}
          <path d="M 40 120 Q 200 20 360 120" fill="none" stroke="#78350f" strokeWidth="3" opacity="0.4" />
          <circle cx="200" cy="50" r="14" fill="#78350f" opacity="0.3" />
          <path d="M 200 40 L 200 60 M 190 50 L 210 50" stroke="#fef08a" strokeWidth="3" />

          {/* Archangel Michael Halo */}
          <circle cx="150" cy="140" r="75" fill="url(#haloArch)" stroke="#78350f" strokeWidth="3" />
          <circle cx="150" cy="140" r="72" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 3" />

          {/* St. Abanoub Halo */}
          <circle cx="280" cy="170" r="55" fill="url(#haloArch)" stroke="#78350f" strokeWidth="3" />

          {/* Archangel Wings */}
          <path d="M 140 130 C 50 30, 20 120, 50 250 C 80 270, 120 220, 140 170 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="3" />
          <path d="M 60 80 C 90 120, 110 180, 130 220" stroke="#ffffff" strokeWidth="2" fill="none" />
          
          <path d="M 160 130 C 230 40, 250 120, 230 230 C 200 250, 170 210, 160 170 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="3" />

          {/* Archangel Michael Body & Armor */}
          <path d="M 100 340 L 150 190 L 200 340 Z" fill="#1e40af" stroke="#1e3a8a" strokeWidth="3" />
          <path d="M 120 220 L 180 220 L 170 300 L 130 300 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          
          {/* Archangel Face */}
          <circle cx="150" cy="140" r="38" fill="#fde047" stroke="#b45309" strokeWidth="2" />
          {/* Hair & Diadem */}
          <path d="M 120 130 C 130 100, 170 100, 180 130 C 170 120, 130 120, 120 130 Z" fill="#78350f" />
          <path d="M 125 125 L 175 125" stroke="#38bdf8" strokeWidth="4" />

          {/* Flaming Sword */}
          <path d="M 120 290 L 60 150" stroke="url(#swordGlow)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 50 160 L 70 140" stroke="#f59e0b" strokeWidth="6" />

          {/* St. Abanoub Body (Deacon Vestment - Tunic & Orarion) */}
          <path d="M 230 350 L 280 210 L 330 350 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="3" />
          <path d="M 260 210 L 270 350" stroke="#fbbf24" strokeWidth="8" />

          {/* St. Abanoub Face (Child Saint) */}
          <circle cx="280" cy="170" r="28" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
          <path d="M 260 160 C 270 145, 290 145, 300 160 C 290 155, 270 155, 260 160 Z" fill="#451a03" />

          {/* St. Abanoub Palm Branch & Censer */}
          <path d="M 290 250 Q 340 190 360 160" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 310 230 Q 335 210 345 200 M 320 210 Q 345 190 355 180" stroke="#22c55e" strokeWidth="3" fill="none" />
          
          {/* Censer (الشورية) */}
          <path d="M 255 260 L 255 310" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 2" />
          <ellipse cx="255" cy="315" rx="10" ry="12" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />

          {/* Banner Title Card */}
          <rect x="30" y="340" width="340" height="42" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <text x="200" y="367" textAnchor="middle" fill="#fef08a" fontSize="17" fontWeight="900" fontFamily="Cairo, sans-serif">
            الملاك ميخائيل والشهيد أبانوب
          </text>
        </svg>
      );

    case 'grade-1':
      // الشهيد كرياكوس وأمه يوليطه
      return (
        <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goldBgG1" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </radialGradient>
            <radialGradient id="haloG1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ca8a04" />
            </radialGradient>
          </defs>

          <rect width="400" height="400" rx="24" fill="#451a03" />
          <rect x="10" y="10" width="380" height="380" rx="18" fill="url(#goldBgG1)" stroke="#fef08a" strokeWidth="4" />
          <rect x="20" y="20" width="360" height="360" rx="14" fill="none" stroke="#78350f" strokeWidth="2" strokeDasharray="6 3" />

          {/* St. Julitta Halo */}
          <circle cx="150" cy="140" r="70" fill="url(#haloG1)" stroke="#78350f" strokeWidth="3" />
          {/* St. Cyriacus Halo */}
          <circle cx="270" cy="180" r="55" fill="url(#haloG1)" stroke="#78350f" strokeWidth="3" />

          {/* St. Julitta Mantle (Royal Blue & Red) */}
          <path d="M 80 340 C 80 200, 210 200, 210 340 Z" fill="#1e3a8a" stroke="#172554" strokeWidth="3" />
          <path d="M 90 140 Q 150 90 200 140 Q 150 200 90 140 Z" fill="#991b1b" stroke="#450a0a" strokeWidth="2" />
          <circle cx="150" cy="140" r="32" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />

          {/* St. Cyriacus Child Figure */}
          <path d="M 220 340 C 220 220, 310 220, 310 340 Z" fill="#047857" stroke="#064e3b" strokeWidth="3" />
          <circle cx="270" cy="180" r="26" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />

          {/* Martyr Crosses held by both */}
          <path d="M 195 240 L 195 150 M 175 180 L 215 180" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" />
          <circle cx="195" cy="150" r="6" fill="#f59e0b" />

          {/* Banner Title */}
          <rect x="30" y="340" width="340" height="42" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <text x="200" y="367" textAnchor="middle" fill="#fef08a" fontSize="17" fontWeight="900" fontFamily="Cairo, sans-serif">
            الشهيد كرياكوس وأمه يوليطه
          </text>
        </svg>
      );

    case 'grade-2':
      // الشهيد أبي سيفين والأم إيريني
      return (
        <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goldBgG2" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>
            <radialGradient id="haloG2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
          </defs>

          <rect width="400" height="400" rx="24" fill="#451a03" />
          <rect x="10" y="10" width="380" height="380" rx="18" fill="url(#goldBgG2)" stroke="#fef08a" strokeWidth="4" />

          {/* Abu Sefein Halo */}
          <circle cx="140" cy="130" r="65" fill="url(#haloG2)" stroke="#78350f" strokeWidth="3" />
          {/* Tamav Eirini Halo */}
          <circle cx="280" cy="150" r="55" fill="url(#haloG2)" stroke="#78350f" strokeWidth="3" />

          {/* Abu Sefein Swords */}
          <path d="M 80 60 L 130 120 M 70 80 L 100 80" stroke="#f8fafc" strokeWidth="6" strokeLinecap="round" />
          <path d="M 200 60 L 150 120 M 210 80 L 180 80" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" />

          {/* Black Charger Horse Silhouette */}
          <path d="M 40 330 C 50 230, 160 210, 190 280 L 220 330 Z" fill="#0f172a" />

          {/* Abu Sefein Soldier Figure */}
          <path d="M 100 330 L 140 180 L 180 330 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="3" />
          <circle cx="140" cy="130" r="30" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />

          {/* Mother Eirini (Monastic Veil & Cross) */}
          <path d="M 230 340 C 230 210, 330 210, 330 340 Z" fill="#090d16" stroke="#1e293b" strokeWidth="3" />
          <circle cx="280" cy="150" r="26" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
          <path d="M 280 200 L 280 260 M 265 220 L 295 220" stroke="#fef08a" strokeWidth="4" />

          {/* Banner Title */}
          <rect x="30" y="340" width="340" height="42" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <text x="200" y="367" textAnchor="middle" fill="#fef08a" fontSize="17" fontWeight="900" fontFamily="Cairo, sans-serif">
            الشهيد أبي سيفين والأم إيريني
          </text>
        </svg>
      );

    case 'grade-3':
      // الأنبا بولا والأنبا أنطونيوس
      return (
        <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goldBgG3" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>
            <radialGradient id="haloG3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
          </defs>

          <rect width="400" height="400" rx="24" fill="#451a03" />
          <rect x="10" y="10" width="380" height="380" rx="18" fill="url(#goldBgG3)" stroke="#fef08a" strokeWidth="4" />

          {/* Desert Mountain Landscape */}
          <path d="M 20 320 L 120 180 L 220 320 L 320 200 L 380 320 Z" fill="#78350f" opacity="0.3" />

          {/* Anba Boula Halo */}
          <circle cx="130" cy="140" r="65" fill="url(#haloG3)" stroke="#78350f" strokeWidth="3" />
          {/* Anba Antonios Halo */}
          <circle cx="270" cy="140" r="65" fill="url(#haloG3)" stroke="#78350f" strokeWidth="3" />

          {/* Anba Boula (Palm Garment & White Beard) */}
          <path d="M 70 340 L 130 190 L 190 340 Z" fill="#854d0e" stroke="#713f12" strokeWidth="3" />
          <circle cx="130" cy="140" r="30" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
          <path d="M 115 150 C 130 210, 130 210, 145 150 Z" fill="#f8fafc" />

          {/* Anba Antonios (Monastic Schema & Staff) */}
          <path d="M 210 340 L 270 190 L 330 340 Z" fill="#1c1917" stroke="#090d16" strokeWidth="3" />
          <circle cx="270" cy="140" r="30" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
          <path d="M 255 150 C 270 210, 270 210, 285 150 Z" fill="#f8fafc" />

          {/* Raven with Bread */}
          <path d="M 180 70 Q 200 50 220 70 Q 200 90 180 70 Z" fill="#090d16" />
          <circle cx="200" cy="85" r="10" fill="#fed7aa" stroke="#d97706" strokeWidth="2" />

          {/* Banner Title */}
          <rect x="30" y="340" width="340" height="42" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <text x="200" y="367" textAnchor="middle" fill="#fef08a" fontSize="17" fontWeight="900" fontFamily="Cairo, sans-serif">
            الأنبا بولا والأنبا أنطونيوس
          </text>
        </svg>
      );

    case 'grade-4':
      // الشهيد مارمينا والبابا كيرلس
      return (
        <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goldBgG4" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </radialGradient>
            <radialGradient id="haloG4" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
          </defs>

          <rect width="400" height="400" rx="24" fill="#0c4a6e" />
          <rect x="10" y="10" width="380" height="380" rx="18" fill="url(#goldBgG4)" stroke="#fef08a" strokeWidth="4" />

          {/* St. Mina Halo */}
          <circle cx="130" cy="130" r="65" fill="url(#haloG4)" stroke="#78350f" strokeWidth="3" />
          {/* Pope Cyrillus VI Halo */}
          <circle cx="270" cy="130" r="65" fill="url(#haloG4)" stroke="#78350f" strokeWidth="3" />

          {/* St. Mina Soldier & Camels */}
          <path d="M 70 340 L 130 180 L 190 340 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="3" />
          <circle cx="130" cy="130" r="30" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
          {/* Two Camels */}
          <path d="M 40 320 Q 60 260 80 320 M 30 300 Q 50 240 70 300" stroke="#fef08a" strokeWidth="4" fill="none" />

          {/* Pope Cyrillus VI (Crown & Vestments) */}
          <path d="M 210 340 L 270 180 L 330 340 Z" fill="#4c1d95" stroke="#3b0764" strokeWidth="3" />
          {/* Coptic Patriarchal Crown */}
          <path d="M 245 80 L 295 80 L 285 105 L 255 105 Z" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
          <circle cx="270" cy="134" r="30" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
          <path d="M 255 145 C 270 200, 270 200, 285 145 Z" fill="#f8fafc" />

          {/* Staff */}
          <path d="M 310 320 L 310 100 M 295 120 L 325 120" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />

          {/* Banner Title */}
          <rect x="30" y="340" width="340" height="42" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <text x="200" y="367" textAnchor="middle" fill="#fef08a" fontSize="17" fontWeight="900" fontFamily="Cairo, sans-serif">
            الشهيد مارمينا والبابا كيرلس
          </text>
        </svg>
      );

    case 'grade-5':
      // الشهيد مارجرجس والشهيدة مارينا
      return (
        <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goldBgG5" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#3b0764" />
            </radialGradient>
            <radialGradient id="haloG5" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
          </defs>

          <rect width="400" height="400" rx="24" fill="#3b0764" />
          <rect x="10" y="10" width="380" height="380" rx="18" fill="url(#goldBgG5)" stroke="#fef08a" strokeWidth="4" />

          {/* St. George Halo */}
          <circle cx="130" cy="130" r="65" fill="url(#haloG5)" stroke="#78350f" strokeWidth="3" />
          {/* St. Marina Halo */}
          <circle cx="270" cy="130" r="65" fill="url(#haloG5)" stroke="#78350f" strokeWidth="3" />

          {/* St. George on White Horse */}
          <path d="M 40 330 C 60 220, 160 220, 180 330 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="130" cy="130" r="30" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
          {/* Spear Slaying Dragon */}
          <path d="M 130 150 L 60 320" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
          <path d="M 30 330 Q 90 350 140 330" stroke="#22c55e" strokeWidth="8" fill="none" />

          {/* St. Marina */}
          <path d="M 210 340 L 270 180 L 330 340 Z" fill="#991b1b" stroke="#7f1d1d" strokeWidth="3" />
          <circle cx="270" cy="130" r="30" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
          <path d="M 270 180 L 270 250 M 250 200 L 290 200" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />

          {/* Banner Title */}
          <rect x="30" y="340" width="340" height="42" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <text x="200" y="367" textAnchor="middle" fill="#fef08a" fontSize="17" fontWeight="900" fontFamily="Cairo, sans-serif">
            الشهيد مارجرجس والشهيدة مارينا
          </text>
        </svg>
      );

    case 'grade-6':
    default:
      // العذراء مريم والأنبا هدرا
      return (
        <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="goldBgG6" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </radialGradient>
            <radialGradient id="haloG6" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
          </defs>

          <rect width="400" height="400" rx="24" fill="#1e3a8a" />
          <rect x="10" y="10" width="380" height="380" rx="18" fill="url(#goldBgG6)" stroke="#fef08a" strokeWidth="4" />

          {/* Virgin Mary Halo */}
          <circle cx="130" cy="130" r="65" fill="url(#haloG6)" stroke="#78350f" strokeWidth="3" />
          {/* Anba Hadra Halo */}
          <circle cx="270" cy="130" r="65" fill="url(#haloG6)" stroke="#78350f" strokeWidth="3" />

          {/* Virgin Mary (Blue Mantle & Red Tunica) */}
          <path d="M 70 340 C 70 180, 190 180, 190 340 Z" fill="#1d4ed8" stroke="#1e40af" strokeWidth="3" />
          <path d="M 95 130 Q 130 80 165 130 Z" fill="#b91c1c" />
          <circle cx="130" cy="130" r="30" fill="#fde047" stroke="#b45309" strokeWidth="2" />

          {/* Anba Hadra (Bishop Vestments & Serpent Staff) */}
          <path d="M 210 340 L 270 180 L 330 340 Z" fill="#065f46" stroke="#047857" strokeWidth="3" />
          <circle cx="270" cy="130" r="30" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />
          <path d="M 255 145 C 270 200, 270 200, 285 145 Z" fill="#f8fafc" />

          {/* Coptic Serpent Staff */}
          <path d="M 310 320 L 310 90 Q 325 80 310 70" stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round" />

          {/* Banner Title */}
          <rect x="30" y="340" width="340" height="42" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <text x="200" y="367" textAnchor="middle" fill="#fef08a" fontSize="17" fontWeight="900" fontFamily="Cairo, sans-serif">
            العذراء مريم والأنبا هدرا
          </text>
        </svg>
      );
  }
}
