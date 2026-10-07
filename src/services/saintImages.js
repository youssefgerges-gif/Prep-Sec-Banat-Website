// 7 Coptic Saint Patron Images for the 7 Sunday School Classes.
//
// These are the real patron-saint icons/artwork for each class (matching the
// saintName/patron fields on each entry in CLASSES, see supabase.js), used
// as: (1) the class icon wherever SaintIconArt is rendered (Analytics class
// list, ClassLeaderboard's SaintBadge), and (2) the background artwork on
// the membership/ID card for that class (StudentCard, and the printable QR
// card in UserManagement).
import kgImage from '../assets/saints/kg.jpg';
import grade1Image from '../assets/saints/grade-1.jpg';
import grade2Image from '../assets/saints/grade-2.jpg';
import grade3Image from '../assets/saints/grade-3.jpg';
import grade4Image from '../assets/saints/grade-4.jpg';
import grade5Image from '../assets/saints/grade-5.jpg';
import grade6Image from '../assets/saints/grade-6.jpg';

export const SAINT_IMAGES = {
  'kg': kgImage,           // الملاك ميخائيل والشهيد أبانوب النهيسي
  'grade-1': grade1Image,  // الشهيد كرياكوس وأمه يوليطه
  'grade-2': grade2Image,  // الشهيد أبي سيفين والأم إيريني
  'grade-3': grade3Image,  // الأنبا بولا والأنبا أنطونيوس
  'grade-4': grade6Image,  // الشهيد مارمينا والبابا كيرلس السادس (تم تبديل الصورة صح مع سنة 6)
  'grade-5': grade5Image,  // الشهيد مارجرجس والشهيدة مارينا
  'grade-6': grade4Image,  // العذراء مريم والأنبا هدرا الأسواني (تم تبديل الصورة صح مع سنة 4)
};

export default SAINT_IMAGES;
