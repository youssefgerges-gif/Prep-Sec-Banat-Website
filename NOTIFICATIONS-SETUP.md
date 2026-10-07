# تفعيل إشعارات الموبايل لأعياد الميلاد

الإشعار جوه الموقع (البانر فوق + الرقم على تاب "أعياد الميلاد") شغال لوحده من غير أي إعداد.
الخطوات دي لإشعارات الموبايل اللي بتوصل حتى لو الموقع مقفول. بتتعمل **مرة واحدة بس**.

## 1. اعمل مفاتيح الإشعارات (VAPID)
على الكمبيوتر، في فولدر المشروع:
```
npx web-push generate-vapid-keys
```
هيطلعلك **Public Key** و **Private Key**. احتفظ بيهم.

## 2. حط المفتاح العام في الموقع
في ملف `.env` (وفي إعدادات الاستضافة لو الموقع مرفوع، زي Vercel/Netlify) ضيف:
```
VITE_VAPID_PUBLIC_KEY=المفتاح_العام
```
وبعدين اعمل Build/Deploy للموقع تاني.

## 3. حط الأسرار في Supabase
Supabase → **Edge Functions** → **Secrets** → ضيف:
| الاسم | القيمة |
|---|---|
| `VAPID_PUBLIC_KEY` | المفتاح العام |
| `VAPID_PRIVATE_KEY` | المفتاح الخاص (متشاركهوش مع حد) |
| `VAPID_SUBJECT` | `mailto:` + إيميلك، مثلاً `mailto:you@gmail.com` |
| `CRON_SECRET` | أي كلمة سر طويلة تختارها |

## 4. ارفع الـ Edge Function
Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**:
- الاسم: `birthday-notify`
- الصق محتوى الملف `supabase/functions/birthday-notify/index.ts`

(أو بالـ CLI: `supabase functions deploy birthday-notify`)

## 5. شغّل الجدولة
- شغّل `schema.sql` (لو ما شغّلتهوش بعد آخر تحديث) — فيه جداول أعياد الميلاد والاشتراكات.
- افتح `supabase/birthday-cron.sql`، غيّر `YOUR-PROJECT-REF` و `YOUR-CRON-SECRET` و `YOUR-ANON-KEY`، وشغّله في SQL Editor.

## 6. كل خادم يفعّل الإشعارات على موبايله
- يفتح الموقع → تاب **أعياد الميلاد** → **تفعيل** ويوافق على الإشعارات.
- **آيفون:** لازم الأول من Safari: زرار المشاركة ← **Add to Home Screen**، ويفتح الموقع من الأيقونة ويفعّل من هناك (iOS 16.4 أو أحدث).

## تجربة سريعة
من SQL Editor تقدر تبعت الإشعار دلوقتي من غير ما تستنى أول الشهر:
```sql
SELECT net.http_post(
  url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/birthday-notify?type=month-start',
  headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR-ANON-KEY', 'x-cron-secret', 'YOUR-CRON-SECRET'),
  body := '{}'::jsonb
);
```
(لو مفيش مخدومات عيد ميلادها الشهر ده، مش هيتبعت حاجة.)
