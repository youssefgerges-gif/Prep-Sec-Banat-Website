// Supabase Edge Function: birthday-notify
// بتبعت إشعار موبايل (Web Push) لكل الخدام اللي فعّلوا الإشعارات.
//
//   ?type=month-start  (أول كل شهر) — عدد المخدومات اللي عيد ميلادهم الشهر ده
//                       وميعاد الحفلة (آخر خميس).
//   ?type=party-day    (اختياري، يوم الخميس) — بيبعت بس لو النهارده آخر خميس
//                       في الشهر، بعدد اللي لسه ما استلموش هداياهم.
//
// الأسرار المطلوبة (Supabase > Edge Functions > Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (مثلاً mailto:you@gmail.com),
//   CRON_SECRET (أي كلمة سر طويلة — نفسها اللي في supabase/birthday-cron.sql)
// SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY موجودين تلقائيًا.
//
// الطلب لازم يبعت المفتاح العام (anon) في Authorization (عشان بوابة Supabase
// تقبله لو "Verify JWT" شغال) + الـ CRON_SECRET في x-cron-secret (الحماية
// الحقيقية) — الاتنين موجودين في أوامر birthday-cron.sql.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export function cairoToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((x) => x.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function lastThursday(year: number, month: number) {
  const lastDay = new Date(Date.UTC(year, month, 0));
  const offset = (lastDay.getUTCDay() - 4 + 7) % 7;
  return lastDay.getUTCDate() - offset;
}

const girls = (n: number) => (n === 1 || n > 10 ? "مخدومة" : "مخدومات");
const gifts = (n: number) => (n === 1 || n > 10 ? "هدية" : "هدايا");

export function buildMessage(
  type: string,
  today: { year: number; month: number; day: number },
  total: number,
  pending: number,
) {
  const monthName = ARABIC_MONTHS[today.month - 1];
  const party = lastThursday(today.year, today.month);
  if (type === "party-day") {
    if (today.day !== party || total === 0) return null;
    return {
      title: `النهارده حفلة أعياد ميلاد ${monthName} 🎉`,
      body: `${total} ${girls(total)} عيد ميلادهم الشهر ده — لسه ${pending} ما استلموش. متنساش تعلّم "تم الاستلام".`,
      tag: `bday-party-${today.year}-${today.month}`,
    };
  }
  if (total === 0) return null;
  return {
    title: `أعياد ميلاد ${monthName} 🎂`,
    body: `الشهر ده فيه ${total} ${girls(total)} عيد ميلادهم — جهّزوا ${total} ${gifts(total)}. الحفلة الخميس ${party} ${monthName}.`,
    tag: `bday-month-${today.year}-${today.month}`,
  };
}

Deno.serve(async (req) => {
  try {
    return await handle(req);
  } catch (err) {
    console.error("birthday-notify failed", err);
    return new Response(`error: ${(err as Error)?.message || err}`, { status: 500 });
  }
});

async function handle(req: Request): Promise<Response> {
  // trim() عشان لو اتنسخت كلمة السر بمسافة أو سطر فاضي زيادة.
  const secret = (Deno.env.get("CRON_SECRET") || "").trim();
  if (!secret) {
    return new Response("CRON_SECRET is not set in Edge Function secrets", { status: 500 });
  }
  if ((req.headers.get("x-cron-secret") || "").trim() !== secret) {
    return new Response("unauthorized: x-cron-secret does not match CRON_SECRET", { status: 401 });
  }

  const type = new URL(req.url).searchParams.get("type") || "month-start";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const today = cairoToday();

  const { data: students, error: stuErr } = await supabase
    .from("users")
    .select("id, birth_date")
    .eq("role", "student")
    .not("birth_date", "is", null);
  if (stuErr) return new Response(stuErr.message, { status: 500 });

  const monthStudents = (students || []).filter((s) => Number(String(s.birth_date).slice(5, 7)) === today.month);

  let pending = monthStudents.length;
  if (type === "party-day" && monthStudents.length > 0) {
    const { data: received } = await supabase
      .from("birthday_gifts")
      .select("student_id")
      .eq("gift_year", today.year)
      .eq("gift_month", today.month);
    pending = monthStudents.length - (received || []).length;
  }

  const message = buildMessage(type, today, monthStudents.length, pending);
  if (!message) return Response.json({ sent: 0, skipped: true, total: monthStudents.length });

  // trim() عشان لو المفاتيح اتنسخت بمسافة أو سطر زيادة.
  const vapidPublic = (Deno.env.get("VAPID_PUBLIC_KEY") || "").trim();
  const vapidPrivate = (Deno.env.get("VAPID_PRIVATE_KEY") || "").trim();
  let vapidSubject = (Deno.env.get("VAPID_SUBJECT") || "").trim() || "mailto:admin@example.com";
  if (!/^(mailto:|https:)/.test(vapidSubject)) vapidSubject = `mailto:${vapidSubject}`;
  if (!vapidPublic || !vapidPrivate) {
    return new Response("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY is not set in Edge Function secrets", { status: 500 });
  }
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  } catch (err) {
    return new Response(`VAPID keys problem: ${(err as Error).message}`, { status: 500 });
  }

  // اشتراكات الخدام وأمين الخدمة (الحسابات الشغالة بس).
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, users!inner(role, status)")
    .in("users.role", ["servant", "admin"])
    .eq("users.status", "active");
  if (subErr) return new Response(subErr.message, { status: 500 });

  const payload = JSON.stringify({ ...message, url: "/?tab=birthdays" });
  let sent = 0;
  const expired: string[] = [];
  await Promise.all((subs || []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      sent++;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) expired.push(s.id); // الاشتراك انتهى (الخادم مسح الموقع مثلاً)
      else console.error("push failed", code, err);
    }
  }));
  if (expired.length) await supabase.from("push_subscriptions").delete().in("id", expired);

  return Response.json({ sent, expired: expired.length, total: monthStudents.length, pending });
}
