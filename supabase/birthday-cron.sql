-- ========================================================
-- جدولة إشعار أعياد الميلاد (بيتشغّل مرة واحدة بعد ما تعمل Deploy
-- للـ Edge Function اسمها birthday-notify — شوف NOTIFICATIONS-SETUP.md).
--
-- قبل ما تشغّله، غيّر حاجتين تحت:
--   YOUR-PROJECT-REF  = الجزء اللي قبل .supabase.co في رابط مشروعك
--   YOUR-CRON-SECRET  = نفس الـ CRON_SECRET اللي حطيته في Secrets
--   YOUR-ANON-KEY     = المفتاح العام (anon) بتاع المشروع
--
-- آمن تشغّله أكتر من مرة (بيمسح الجدولة القديمة الأول).
-- ========================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobname) FROM cron.job
WHERE jobname IN ('banat-birthday-month-start', 'banat-birthday-party-day');

-- أول يوم في كل شهر، الساعة 7 الصبح UTC (9 أو 10 الصبح بتوقيت القاهرة).
SELECT cron.schedule(
  'banat-birthday-month-start',
  '0 7 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/birthday-notify?type=month-start',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR-ANON-KEY', 'x-cron-secret', 'YOUR-CRON-SECRET'),
    body := '{}'::jsonb
  );
  $$
);

-- (اختياري) تذكير يوم الحفلة: بيشتغل كل خميس الساعة 12 الضهر UTC، والفانكشن
-- نفسها بتبعت بس لو النهارده آخر خميس في الشهر. لو عايزه، شيل الـ "--" من
-- أول كل سطر تحت وشغّله.
-- SELECT cron.schedule(
--   'banat-birthday-party-day',
--   '0 12 * * 4',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/birthday-notify?type=party-day',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer YOUR-ANON-KEY', 'x-cron-secret', 'YOUR-CRON-SECRET'),
--     body := '{}'::jsonb
--   );
--   $$
-- );
