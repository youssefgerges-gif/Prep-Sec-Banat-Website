-- ========================================================
-- SUNDAY SCHOOL GAMIFICATION SYSTEM - SUPABASE DATABASE SCHEMA
-- كنيسة مارمينا والبابا كيرلس - خدمة مدارس أحد إعدادي وثانوي بنات
-- (نسخة منفصلة عن نسخة مدارس الأحد الابتدائي — قاعدة بيانات وديبلويمنت
-- وريبو GitHub لوحدهم تمامًا)
--
-- نظام إعدادي وثانوي بنات (طلب Mr. Gerges 2026-09-25) مختلف عن الابتدائي:
--   - 7 فصول: أولى/تانية/تالتة إعدادي + أولى/تانية/تالتة ثانوي + جامعيين وخريجين
--     (القائمة نفسها في CLASSES جوه src/services/supabase.js).
--   - مفيش شفيع للفصل، ومفيش أمين فصل ولا أمين مساعد.
--   - الأدوار: 'admin' (أمين الخدمة — أبونا بيشوي حليم)، 'servant' (خادم)،
--     'student' (مخدومة). كل الخدام صلاحياتهم واحدة وبيشوفوا كل المخدومات
--     في كل الفصول. أمين الخدمة زي أي خادم + إدارة الخدام (الموافقة على
--     الخدام الجداد، إيقاف أو مسح حساب خادم).
--   - الخادم بيعمل حسابه بنفسه من صفحة الدخول ("خادم جديد؟")، والحساب بيفضل
--     status = 'pending' (مش شايف أي بيانات) لحد ما أمين الخدمة يوافق.
--   - الحضور والغياب للمخدومات بس — مفيش غياب للخدام ولا اجتماع خدام.
--
-- الملف ده آمن يتشغل أكتر من مرة (idempotent)، وكمان بيحوّل أي قاعدة
-- بيانات قديمة كانت شغالة بنظام الابتدائي للنظام الجديد (بيحوّل كل
-- الأدوار القديمة لـ'servant' وبيشيل دوال غياب الخدام).
-- ========================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  class_id TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS title TEXT;
-- Real login: a short username (e.g. SRV01, STU12345) instead of an email,
-- linked to a Supabase Auth account once the person sets their own password.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
-- بيانات إضافية للمخدومة وقت إضافتها (تاريخ الميلاد، العنوان، رقم ولي الأمر).
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
-- أب الاعتراف (للمخدومة) — اختياري.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS confession_father TEXT;
-- حساب التدريب: حساب واحد بيقدر يبدّل دوره بنفسه (خادم / مخدومة) وهو بيشرح
-- للخدام الموقع. مفيش طريقة تتفعّل من الموقع — بتتحط يدويًا في قاعدة البيانات:
--   UPDATE public.users SET is_training_account = true WHERE username = 'الكود';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_training_account BOOLEAN NOT NULL DEFAULT false;
-- حالة الحساب: active (شغال) / pending (خادم سجّل ومستني موافقة أمين الخدمة)
-- / suspended (أمين الخدمة وقّفه). أي حساب قديم بيبقى active.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'pending', 'suspended'));

-- الفصل مالوش قيمة افتراضية: المخدومة لازم يتحدد فصلها صراحة، والخادم
-- مش مربوط بفصل (class_id = NULL).
ALTER TABLE public.users ALTER COLUMN class_id DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON public.users (username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_key ON public.users (auth_user_id) WHERE auth_user_id IS NOT NULL;

-- أي دور قديم من نظام الابتدائي (أمين خدمة عامة / أمين فصل / أمين مساعد)
-- بيتحوّل لـ'servant' عادي، ومبيبقاش مربوط بفصل.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE public.users
SET role = 'servant', class_id = NULL, title = 'خادم'
WHERE role IN ('super_admin', 'class_admin', 'assistant_admin');
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'servant', 'student'));

-- 2. Attendance logs (المخدومات بس)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Points ledger
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  servant_id TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- حساب أمين الخدمة (أبونا بيشوي حليم) — كود الدخول ADM01.
-- بيتعمل مرة واحدة بس (لو مفيش أمين خدمة خالص). أول مرة أبونا يدخل بالكود
-- ADM01 بيختار كلمة السر بنفسه ("أول مرة تدخل").
-- ========================================================
INSERT INTO public.users (name, role, qr_code, username, title, status)
SELECT 'أبونا بيشوي حليم', 'admin', 'QR-ADM-01', 'ADM01', 'أمين الخدمة', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin')
  AND NOT EXISTS (SELECT 1 FROM public.users WHERE username = 'ADM01' OR qr_code = 'QR-ADM-01');

-- Any row still missing a username gets its QR code with "QR-" and dashes
-- stripped (e.g. QR-STU-12345 -> STU12345). Never overwrites an existing one.
UPDATE public.users
SET username = UPPER(REPLACE(REPLACE(qr_code, 'QR-', ''), '-', ''))
WHERE username IS NULL;

-- ========================================================
-- RLS
--   - أي خادم: يقرا ويكتب كل حاجة (نفس الصلاحيات للكل).
--   - المخدومة: تشوف صفها هي وسجلها هي بس.
--   - مش مسجل دخول: ولا حاجة (غير دوال الدخول تحت).
-- ========================================================
DROP POLICY IF EXISTS "Public Users Access" ON public.users;
DROP POLICY IF EXISTS "Public Attendance Access" ON public.attendance_logs;
DROP POLICY IF EXISTS "Public Ledger Access" ON public.points_ledger;
DROP POLICY IF EXISTS "Users can view own row" ON public.users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admin can insert users" ON public.users;
DROP POLICY IF EXISTS "Super admin can update users" ON public.users;
DROP POLICY IF EXISTS "Super admin can delete users" ON public.users;
DROP POLICY IF EXISTS "Servants can insert users" ON public.users;
DROP POLICY IF EXISTS "Servants can update users" ON public.users;
DROP POLICY IF EXISTS "Servants can delete users" ON public.users;
DROP POLICY IF EXISTS "Staff can view all attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Staff can record attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Staff can delete attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Staff can view all points" ON public.points_ledger;
DROP POLICY IF EXISTS "Students can view own points" ON public.points_ledger;
DROP POLICY IF EXISTS "Staff can add points" ON public.points_ledger;
DROP POLICY IF EXISTS "Staff can delete points" ON public.points_ledger;

-- SECURITY DEFINER so the lookup bypasses RLS (a policy on `users` that
-- queries `users` would otherwise recurse into itself).
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- خادم شغال (أو أمين الخدمة) — حساب pending أو suspended مش بيعدّي.
CREATE OR REPLACE FUNCTION public.is_servant()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((
    SELECT role IN ('servant', 'admin') AND status = 'active'
    FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
  ), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((
    SELECT role = 'admin' AND status = 'active'
    FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
  ), FALSE);
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_servant() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_servant() TO authenticated;

-- ===== users =====
CREATE POLICY "Users can view own row" ON public.users
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "Staff can view all users" ON public.users
  FOR SELECT TO authenticated USING (public.is_servant());
-- الخدام بيضيفوا ويعدّلوا ويمسحوا المخدومات بس. حسابات الخدام نفسها
-- (إضافة/تعديل/مسح/تغيير الدور) لأمين الخدمة بس. كل واحد بيعدّل بياناته
-- هو من "بياناتي" عن طريق update_own_profile().
CREATE POLICY "Servants can insert users" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (public.is_servant() AND role = 'student'));
CREATE POLICY "Servants can update users" ON public.users
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.is_servant() AND role = 'student'))
  WITH CHECK (public.is_admin() OR (public.is_servant() AND role = 'student'));
CREATE POLICY "Servants can delete users" ON public.users
  FOR DELETE TO authenticated
  USING (public.is_admin() OR (public.is_servant() AND role = 'student'));

-- ===== attendance_logs =====
CREATE POLICY "Staff can view all attendance" ON public.attendance_logs
  FOR SELECT TO authenticated USING (public.is_servant());
CREATE POLICY "Students can view own attendance" ON public.attendance_logs
  FOR SELECT TO authenticated USING (user_id = public.current_user_id());
-- الحضور للمخدومات بس، ولازم يكون تاريخه يوم خميس (بتوقيت القاهرة —
-- ميعاد مدارس الأحد). ينفع يتسجل حضور لخميس فات (لو حد اتنسي)، بس مش لتاريخ
-- في المستقبل. أي محاولة تسجيل حضور لخادم أو ليوم غير الخميس بتترفض هنا.
CREATE POLICY "Staff can record attendance" ON public.attendance_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_servant()
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = attendance_logs.user_id AND u.role = 'student')
    AND EXTRACT(ISODOW FROM (attendance_logs.timestamp AT TIME ZONE 'Africa/Cairo')) = 4
    AND attendance_logs.timestamp <= now() + INTERVAL '5 minutes'
  );
-- للتراجع عن حضور اتسجل بالغلط.
CREATE POLICY "Staff can delete attendance" ON public.attendance_logs
  FOR DELETE TO authenticated USING (public.is_servant());

-- ===== points_ledger =====
CREATE POLICY "Staff can view all points" ON public.points_ledger
  FOR SELECT TO authenticated USING (public.is_servant());
CREATE POLICY "Students can view own points" ON public.points_ledger
  FOR SELECT TO authenticated USING (student_id = public.current_user_id());
CREATE POLICY "Staff can add points" ON public.points_ledger
  FOR INSERT TO authenticated WITH CHECK (public.is_servant());
CREATE POLICY "Staff can delete points" ON public.points_ledger
  FOR DELETE TO authenticated USING (public.is_servant());

-- ========================================================
-- LOGIN LOOKUP FUNCTIONS
-- A logged-out visitor has no direct read access to `users`, so the "type
-- your username" step needs a narrow function returning only safe fields.
-- ========================================================
CREATE OR REPLACE FUNCTION public.find_login_account(p_username TEXT)
RETURNS TABLE (id UUID, name TEXT, role TEXT, class_id TEXT, title TEXT, username TEXT, has_password BOOLEAN)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT id, name, role, class_id, title, username, (auth_user_id IS NOT NULL) AS has_password
  FROM public.users
  WHERE username = UPPER(TRIM(p_username));
$$;

REVOKE EXECUTE ON FUNCTION public.find_login_account(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_login_account(TEXT) TO anon, authenticated;

-- Links the just-created Supabase Auth account to its existing `users` row.
CREATE OR REPLACE FUNCTION public.claim_login_account(p_username TEXT)
RETURNS TABLE (id UUID, name TEXT, role TEXT, class_id TEXT, title TEXT, username TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.users%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'لازم تسجل دخول الأول';
  END IF;

  SELECT * INTO v_row FROM public.users u WHERE u.username = UPPER(TRIM(p_username));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'الكود غير موجود';
  END IF;

  IF v_row.auth_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'تم إنشاء كلمة سر لهذا الكود من قبل';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'الحساب ده مرتبط بكود تاني بالفعل';
  END IF;

  -- qualified: RETURNS TABLE makes "id" an in-scope plpgsql variable.
  UPDATE public.users SET auth_user_id = auth.uid() WHERE public.users.id = v_row.id;

  RETURN QUERY SELECT v_row.id, v_row.name, v_row.role, v_row.class_id, v_row.title, v_row.username;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_login_account(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_login_account(TEXT) TO authenticated;

-- ========================================================
-- PASSWORD RECOVERY (نسيان كلمة السر)
-- مفيش إيميلات حقيقية، فبدل استرجاع كلمة السر بنمسح حساب الدخول بتاع الكود
-- ده، فيرجع لحالة "أول مرة تدخل" وصاحبه يختار كلمة سر جديدة بنفسه.
-- أي خادم يقدر يعمل كده لأي حد (خادم أو مخدومة).
-- ========================================================
CREATE OR REPLACE FUNCTION public.reset_login_password(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_target public.users%ROWTYPE;
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بإعادة تعيين كلمة السر';
  END IF;

  SELECT * INTO v_target FROM public.users u WHERE u.username = UPPER(TRIM(p_username));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'الكود غير موجود';
  END IF;

  -- الخادم يعيد تعيين كلمة سر المخدومات بس؛ كلمة سر أي خادم من أمين الخدمة.
  IF v_target.role <> 'student' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'إعادة تعيين كلمة سر الخدام من أمين الخدمة بس';
  END IF;

  IF v_target.auth_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  DELETE FROM auth.users WHERE id = v_target.auth_user_id;
  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_login_password(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_login_password(TEXT) TO authenticated;

-- ========================================================
-- ABSENCE REPORT (الافتقاد) — المخدومات بس، كل الفصول، لأي خادم.
-- مخدومة لسه ما حضرتش خالص بيتحسب غيابها من تاريخ إضافتها مش من أول يوم.
-- ========================================================
CREATE OR REPLACE FUNCTION public.get_absence_report(min_weeks INTEGER DEFAULT 2)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  qr_code TEXT,
  class_id TEXT,
  role TEXT,
  last_attended_at TIMESTAMPTZ,
  weeks_absent INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض سجل الافتقاد';
  END IF;

  RETURN QUERY
  WITH scoped AS (
    SELECT
      u.id, u.name, COALESCE(u.guardian_phone, u.phone) AS phone, u.qr_code, u.class_id, u.role, u.created_at,
      (SELECT MAX(al.timestamp) FROM public.attendance_logs al WHERE al.user_id = u.id) AS last_attended_at
    FROM public.users u
    WHERE u.role = 'student'
  ),
  computed AS (
    SELECT
      scoped.*,
      (CASE
        WHEN scoped.last_attended_at IS NULL THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - scoped.created_at)) / 604800))::INTEGER
        ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - scoped.last_attended_at)) / 604800))::INTEGER
      END) AS weeks_absent_calc
    FROM scoped
  )
  SELECT
    computed.id, computed.name, computed.phone, computed.qr_code,
    computed.class_id, computed.role, computed.last_attended_at,
    computed.weeks_absent_calc
  FROM computed
  WHERE computed.weeks_absent_calc >= min_weeks
  ORDER BY computed.weeks_absent_calc DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_absence_report(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_absence_report(INTEGER) TO authenticated;

-- ========================================================
-- STUDENT ROSTER (قائمة المخدومات) — كل المخدومات لأي خادم.
-- ========================================================
CREATE OR REPLACE FUNCTION public.get_scoped_students()
RETURNS TABLE (id UUID, name TEXT, phone TEXT, qr_code TEXT, class_id TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض قائمة المخدومات';
  END IF;

  RETURN QUERY
  SELECT u.id, u.name, u.phone, u.qr_code, u.class_id
  FROM public.users u
  WHERE u.role = 'student'
  ORDER BY u.name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_scoped_students() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_scoped_students() TO authenticated;

-- ========================================================
-- MANUAL POINTS — مع منع الرصيد السالب (بيتفحص في قاعدة البيانات نفسها).
-- ========================================================
CREATE OR REPLACE FUNCTION public.add_manual_points(
  p_student_id UUID,
  p_amount NUMERIC,
  p_reason TEXT,
  p_servant_id TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, student_id UUID, amount NUMERIC, reason TEXT, servant_id TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student public.users%ROWTYPE;
  v_current_balance NUMERIC;
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بإضافة أو خصم نقاط';
  END IF;

  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'قيمة النقاط مطلوبة';
  END IF;

  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'سبب إضافة/خصم النقاط مطلوب للأرشيف';
  END IF;

  SELECT * INTO v_student FROM public.users u WHERE u.id = p_student_id AND u.role = 'student';
  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'المخدومة غير موجودة';
  END IF;

  IF p_amount < 0 THEN
    SELECT COALESCE(SUM(pl.amount), 0) INTO v_current_balance
    FROM public.points_ledger pl WHERE pl.student_id = p_student_id;

    IF v_current_balance + p_amount < 0 THEN
      RAISE EXCEPTION 'مينفعش تخصم % نقطة — المخدومة معاها % نقطة بس دلوقتي، والخصم ده هيخلي رصيدها بالسالب', ABS(p_amount), v_current_balance;
    END IF;
  END IF;

  RETURN QUERY
  INSERT INTO public.points_ledger (student_id, amount, reason, servant_id, created_at)
  VALUES (p_student_id, p_amount, TRIM(p_reason), COALESCE(p_servant_id, 'system'), NOW())
  RETURNING points_ledger.id, points_ledger.student_id, points_ledger.amount, points_ledger.reason, points_ledger.servant_id, points_ledger.created_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_manual_points(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_manual_points(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

-- ========================================================
-- MANUAL ATTENDANCE ROSTER — قائمة تسجيل الحضور اليدوي وشاشة أكواد QR.
-- كل المخدومات (مفيش خدام في القائمة لأن مفيش حضور للخدام).
-- ========================================================
DROP FUNCTION IF EXISTS public.get_manual_attendance_roster();

CREATE OR REPLACE FUNCTION public.get_manual_attendance_roster()
RETURNS TABLE (
  id UUID, name TEXT, role TEXT, qr_code TEXT, username TEXT, class_id TEXT,
  phone TEXT, birth_date DATE, address TEXT, guardian_phone TEXT, confession_father TEXT
)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض قائمة تسجيل الحضور اليدوي';
  END IF;

  RETURN QUERY
  SELECT u.id, u.name, u.role, u.qr_code, u.username, u.class_id,
         u.phone, u.birth_date, u.address, u.guardian_phone, u.confession_father
  FROM public.users u
  WHERE u.role = 'student'
  ORDER BY u.name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_manual_attendance_roster() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_manual_attendance_roster() TO authenticated;

-- ========================================================
-- ADD A NEW STUDENT (إضافة مخدومة) — أي خادم، في أي فصل (لازم يختاره).
-- الاسم والفصل بس إلزاميين. تاريخ الميلاد والعنوان ورقم ولي الأمر اختياريين
-- (ينفع يتكملوا بعدين من شاشة "أكواد QR" — وأي مخدومة ناقصها حاجة منهم
-- بيبان عليها "بيانات ناقصة"). الـqr_code والـusername بيتعملوا هنا تلقائي.
-- ========================================================
DROP FUNCTION IF EXISTS public.add_scoped_student(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_scoped_student(TEXT, DATE, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.add_scoped_student(
  p_name TEXT,
  p_birth_date DATE DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_guardian_phone TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_class_id TEXT DEFAULT NULL,
  p_confession_father TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, name TEXT, qr_code TEXT, username TEXT, class_id TEXT, title TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_qr_code TEXT;
  v_username TEXT;
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بإضافة مخدومة جديدة';
  END IF;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'اسم المخدومة مطلوب';
  END IF;
  IF p_class_id IS NULL OR TRIM(p_class_id) = '' THEN
    RAISE EXCEPTION 'يجب اختيار الفصل الدراسي';
  END IF;

  -- كود فريد (بيعيد المحاولة لو الرقم العشوائي اتكرر بالصدفة).
  LOOP
    v_qr_code := 'QR-STU-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users u WHERE u.qr_code = v_qr_code);
  END LOOP;
  v_username := UPPER(REPLACE(REPLACE(v_qr_code, 'QR-', ''), '-', ''));

  RETURN QUERY
  INSERT INTO public.users (name, role, phone, class_id, title, qr_code, username, birth_date, address, guardian_phone, confession_father)
  VALUES (
    TRIM(p_name), 'student', NULLIF(TRIM(p_phone), ''), TRIM(p_class_id), 'مخدومة', v_qr_code, v_username,
    p_birth_date, NULLIF(TRIM(p_address), ''), NULLIF(TRIM(p_guardian_phone), ''), NULLIF(TRIM(p_confession_father), '')
  )
  RETURNING users.id, users.name, users.qr_code, users.username, users.class_id, users.title;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_scoped_student(TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_scoped_student(TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ========================================================
-- LEADERBOARD — POINTS (لوحة الصدارة، النقاط) — أي خادم، أي فصل.
-- ========================================================
CREATE OR REPLACE FUNCTION public.get_class_points_leaderboard(p_class_id TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, name TEXT, qr_code TEXT, total_points NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض لوحة الصدارة';
  END IF;
  IF p_class_id IS NULL OR TRIM(p_class_id) = '' THEN
    RAISE EXCEPTION 'يجب اختيار الفصل الدراسي';
  END IF;

  RETURN QUERY
  SELECT u.id, u.name, u.qr_code, COALESCE(SUM(pl.amount), 0) AS total_points
  FROM public.users u
  LEFT JOIN public.points_ledger pl ON pl.student_id = u.id
  WHERE u.role = 'student' AND u.class_id = p_class_id
  GROUP BY u.id, u.name, u.qr_code
  ORDER BY total_points DESC, u.name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_class_points_leaderboard(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_points_leaderboard(TEXT) TO authenticated;

-- ========================================================
-- LEADERBOARD — ATTENDANCE (لوحة الصدارة، الحضور)
-- نسبة حضور كل مخدومة من تاريخ انضمامها: الأسابيع اللي فيها حضور ÷ الأسابيع
-- اللي عدّت. اللي لسه منضمة من أقل من أسبوع مش بتظهر لحد ما يعدّي أسبوع.
-- ========================================================
CREATE OR REPLACE FUNCTION public.get_class_attendance_ranking(p_class_id TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  qr_code TEXT,
  elapsed_weeks INTEGER,
  attended_weeks INTEGER,
  attendance_percent NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض ترتيب الحضور';
  END IF;
  IF p_class_id IS NULL OR TRIM(p_class_id) = '' THEN
    RAISE EXCEPTION 'يجب اختيار الفصل الدراسي';
  END IF;

  RETURN QUERY
  WITH scoped AS (
    SELECT u.id, u.name, u.qr_code, u.created_at
    FROM public.users u
    WHERE u.role = 'student' AND u.class_id = p_class_id
  ),
  computed AS (
    SELECT
      scoped.id, scoped.name, scoped.qr_code,
      GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - scoped.created_at)) / 604800))::INTEGER AS elapsed_weeks_calc,
      (SELECT COUNT(DISTINCT FLOOR(EXTRACT(EPOCH FROM (al.timestamp - scoped.created_at)) / 604800))
       FROM public.attendance_logs al
       WHERE al.user_id = scoped.id AND al.timestamp >= scoped.created_at)::INTEGER AS attended_weeks_calc
    FROM scoped
  )
  SELECT
    computed.id, computed.name, computed.qr_code,
    computed.elapsed_weeks_calc, computed.attended_weeks_calc,
    ROUND(100.0 * computed.attended_weeks_calc / computed.elapsed_weeks_calc, 1) AS attendance_percent
  FROM computed
  WHERE computed.elapsed_weeks_calc > 0
  ORDER BY attendance_percent DESC, computed.name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_class_attendance_ranking(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_class_attendance_ranking(TEXT) TO authenticated;

-- ========================================================
-- تعديل بيانات مخدومة (تكملة البيانات الناقصة) — أي خادم، أي مخدومة.
-- بيعدّل بيانات التواصل بس (تليفون / تاريخ ميلاد / عنوان / رقم ولي الأمر).
-- الاسم والفصل والكود بيتعدلوا من شاشة "الكشوفات".
-- باراميتر NULL = "متلمسش العمود ده"، نص فاضي = "امسحه"،
-- و p_clear_birth_date = true بيمسح تاريخ الميلاد.
-- ========================================================
DROP FUNCTION IF EXISTS public.update_scoped_student(UUID, TEXT, DATE, BOOLEAN, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_scoped_student(
  p_student_id UUID,
  p_phone TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_clear_birth_date BOOLEAN DEFAULT FALSE,
  p_address TEXT DEFAULT NULL,
  p_guardian_phone TEXT DEFAULT NULL,
  p_confession_father TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.users%ROWTYPE;
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل بيانات المخدومات';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_student_id AND role = 'student') THEN
    RAISE EXCEPTION 'المخدومة غير موجودة';
  END IF;

  UPDATE public.users
  SET
    phone = CASE WHEN p_phone IS NOT NULL THEN NULLIF(TRIM(p_phone), '') ELSE phone END,
    birth_date = CASE
      WHEN p_clear_birth_date THEN NULL
      WHEN p_birth_date IS NOT NULL THEN p_birth_date
      ELSE birth_date
    END,
    address = CASE WHEN p_address IS NOT NULL THEN NULLIF(TRIM(p_address), '') ELSE address END,
    guardian_phone = CASE WHEN p_guardian_phone IS NOT NULL THEN NULLIF(TRIM(p_guardian_phone), '') ELSE guardian_phone END,
    confession_father = CASE WHEN p_confession_father IS NOT NULL THEN NULLIF(TRIM(p_confession_father), '') ELSE confession_father END
  WHERE id = p_student_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_scoped_student(UUID, TEXT, DATE, BOOLEAN, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_scoped_student(UUID, TEXT, DATE, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;

-- ========================================================
-- بياناتي — أي حساب (أمين خدمة أو خادم أو مخدومة) يعدّل بياناته بنفسه:
-- الاسم، التليفون، تاريخ الميلاد، العنوان، أب الاعتراف (ورقم ولي الأمر
-- للمخدومة). الدور والفصل والكود مش بيتغيروا من هنا.
-- باراميتر NULL = "متلمسش"، نص فاضي = "امسحه" (الاسم مينفعش يتمسح).
-- ========================================================
DROP FUNCTION IF EXISTS public.update_own_profile(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_own_profile(TEXT, TEXT, TEXT, DATE, BOOLEAN);

CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_guardian_phone TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_clear_birth_date BOOLEAN DEFAULT FALSE,
  p_name TEXT DEFAULT NULL,
  p_confession_father TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
  v_row public.users%ROWTYPE;
BEGIN
  v_id := public.current_user_id();
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'غير مسجل دخول';
  END IF;
  IF p_name IS NOT NULL AND TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'الاسم مطلوب';
  END IF;

  UPDATE public.users
  SET
    name = COALESCE(NULLIF(TRIM(p_name), ''), name),
    phone = CASE WHEN p_phone IS NOT NULL THEN NULLIF(TRIM(p_phone), '') ELSE phone END,
    address = CASE WHEN p_address IS NOT NULL THEN NULLIF(TRIM(p_address), '') ELSE address END,
    guardian_phone = CASE WHEN p_guardian_phone IS NOT NULL THEN NULLIF(TRIM(p_guardian_phone), '') ELSE guardian_phone END,
    confession_father = CASE WHEN p_confession_father IS NOT NULL THEN NULLIF(TRIM(p_confession_father), '') ELSE confession_father END,
    birth_date = CASE
      WHEN p_clear_birth_date THEN NULL
      WHEN p_birth_date IS NOT NULL THEN p_birth_date
      ELSE birth_date
    END
  WHERE id = v_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_own_profile(TEXT, TEXT, TEXT, DATE, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_profile(TEXT, TEXT, TEXT, DATE, BOOLEAN, TEXT, TEXT) TO authenticated;

-- ========================================================
-- تسجيل خادم جديد بنفسه (من صفحة الدخول: "خادم جديد؟")
-- الخادم بيعمل حساب Supabase Auth الأول (رقم التليفون + كلمة سر يختارها)،
-- وبعدين الدالة دي بتعمل صفه في users مربوط بالحساب ده: role = servant،
-- status = pending (مش شايف أي بيانات لحد ما أمين الخدمة يوافق).
-- كود الدخول = رقم التليفون نفسه.
-- ========================================================
CREATE OR REPLACE FUNCTION public.register_servant(
  p_name TEXT,
  p_phone TEXT,
  p_birth_date DATE DEFAULT NULL,
  p_confession_father TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_phone TEXT;
  v_qr TEXT;
  v_row public.users%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'لازم تعمل الحساب الأول';
  END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'الحساب ده متسجل بالفعل';
  END IF;
  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'الاسم مطلوب';
  END IF;

  v_phone := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');
  IF v_phone !~ '^01[0-9]{9}$' THEN
    RAISE EXCEPTION 'رقم التليفون لازم يكون 11 رقم ويبدأ بـ 01';
  END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE username = v_phone) THEN
    RAISE EXCEPTION 'رقم التليفون ده متسجل بحساب تاني';
  END IF;

  LOOP
    v_qr := 'QR-SRV-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users u WHERE u.qr_code = v_qr);
  END LOOP;

  INSERT INTO public.users (name, role, status, title, phone, username, qr_code, auth_user_id, birth_date, confession_father, address)
  VALUES (
    TRIM(p_name), 'servant', 'pending', 'خادم', v_phone, v_phone, v_qr, auth.uid(),
    p_birth_date, NULLIF(TRIM(p_confession_father), ''), NULLIF(TRIM(p_address), '')
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_servant(TEXT, TEXT, DATE, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_servant(TEXT, TEXT, DATE, TEXT, TEXT) TO authenticated;

-- ========================================================
-- إدارة الخدام — أمين الخدمة بس.
--   admin_set_servant_status: موافقة (active) أو إيقاف (suspended).
--   admin_delete_servant: رفض طلب أو مسح حساب خادم نهائيًا (مع حساب الدخول).
-- ========================================================
CREATE OR REPLACE FUNCTION public.admin_set_servant_status(p_user_id UUID, p_status TEXT)
RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.users%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'إدارة الخدام لأمين الخدمة بس';
  END IF;
  IF p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'حالة غير صالحة';
  END IF;

  UPDATE public.users SET status = p_status
  WHERE id = p_user_id AND role = 'servant'
  RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'الخادم غير موجود';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_servant(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'إدارة الخدام لأمين الخدمة بس';
  END IF;
  SELECT auth_user_id INTO v_auth FROM public.users WHERE id = p_user_id AND role = 'servant';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'الخادم غير موجود';
  END IF;

  DELETE FROM public.users WHERE id = p_user_id;
  IF v_auth IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_auth;
  END IF;
  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_servant_status(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_servant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_servant_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_servant(UUID) TO authenticated;

-- ========================================================
-- حساب التدريب — تبديل الدور (خادم / مخدومة). بيشتغل بس لو
-- is_training_account = true على صف صاحب الحساب.
-- ========================================================
CREATE OR REPLACE FUNCTION public.switch_training_role(
  p_role TEXT,
  p_class_id TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
  v_row public.users%ROWTYPE;
BEGIN
  v_id := public.current_user_id();
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'غير مسجل دخول';
  END IF;
  IF NOT COALESCE((SELECT is_training_account FROM public.users WHERE id = v_id), FALSE) THEN
    RAISE EXCEPTION 'الحساب ده مش حساب تدريب — مينفعش تغيّر دورك';
  END IF;
  IF p_role NOT IN ('servant', 'student') THEN
    RAISE EXCEPTION 'دور غير صالح';
  END IF;
  IF (SELECT role FROM public.users WHERE id = v_id) = 'admin' THEN
    RAISE EXCEPTION 'حساب أمين الخدمة مينفعش يبقى حساب تدريب';
  END IF;

  IF p_role = 'servant' THEN
    UPDATE public.users SET role = 'servant', class_id = NULL WHERE id = v_id RETURNING * INTO v_row;
  ELSE
    IF p_class_id IS NULL OR TRIM(p_class_id) = '' THEN
      RAISE EXCEPTION 'اختار فصل';
    END IF;
    UPDATE public.users SET role = 'student', class_id = TRIM(p_class_id) WHERE id = v_id RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.switch_training_role(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.switch_training_role(TEXT, TEXT) TO authenticated;

-- ========================================================
-- الفقرة الافتتاحية اتشالت من الموقع (طلب 2026-10-07) — امسح الجدول والدوال.
-- ========================================================
DROP FUNCTION IF EXISTS public.record_opening_segment_score(TEXT, DATE, INTEGER, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.record_opening_segment_score(TEXT, DATE, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_opening_segment_score(TEXT, DATE);
DROP FUNCTION IF EXISTS public.get_opening_segment_leaderboard();
DROP FUNCTION IF EXISTS public.get_opening_segment_leaderboard(DATE);
DROP TABLE IF EXISTS public.opening_segment_scores;

-- ========================================================
-- أعياد الميلاد وهدايا الحفلة الشهرية (طلب 2026-09-25)
-- حفلة أعياد الميلاد بتتعمل آخر خميس في كل شهر. الخدام بيشوفوا مين من
-- المخدومات عيد ميلادها في الشهر (من birth_date)، ويعلّموا على اللي استلمت
-- هديتها. كل صف في birthday_gifts = مخدومة استلمت هدية شهر معيّن في سنة
-- معيّنة (فالسنة الجاية بتبدأ من جديد تلقائي).
-- ========================================================
CREATE TABLE IF NOT EXISTS public.birthday_gifts (
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gift_year INTEGER NOT NULL,
  gift_month INTEGER NOT NULL CHECK (gift_month BETWEEN 1 AND 12),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  servant_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  PRIMARY KEY (student_id, gift_year, gift_month)
);

ALTER TABLE public.birthday_gifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Servants can view gifts" ON public.birthday_gifts;
DROP POLICY IF EXISTS "Servants can mark gifts" ON public.birthday_gifts;
DROP POLICY IF EXISTS "Servants can unmark gifts" ON public.birthday_gifts;
CREATE POLICY "Servants can view gifts" ON public.birthday_gifts
  FOR SELECT TO authenticated USING (public.is_servant());
CREATE POLICY "Servants can mark gifts" ON public.birthday_gifts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_servant()
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = birthday_gifts.student_id AND u.role = 'student')
  );
CREATE POLICY "Servants can unmark gifts" ON public.birthday_gifts
  FOR DELETE TO authenticated USING (public.is_servant());

-- مخدومات عيد ميلادهم في شهر معيّن + هل استلموا هدية الشهر ده في السنة دي.
CREATE OR REPLACE FUNCTION public.get_birthdays(p_month INTEGER, p_year INTEGER)
RETURNS TABLE (
  id UUID,
  name TEXT,
  class_id TEXT,
  phone TEXT,
  guardian_phone TEXT,
  birth_date DATE,
  birth_day INTEGER,
  age_turning INTEGER,
  received_at TIMESTAMPTZ,
  received_by TEXT
)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض أعياد الميلاد';
  END IF;
  IF p_month IS NULL OR p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'الشهر غير صحيح';
  END IF;

  RETURN QUERY
  SELECT
    u.id, u.name, u.class_id, u.phone, u.guardian_phone, u.birth_date,
    EXTRACT(DAY FROM u.birth_date)::INTEGER AS birth_day,
    (p_year - EXTRACT(YEAR FROM u.birth_date))::INTEGER AS age_turning,
    g.received_at,
    s.name AS received_by
  FROM public.users u
  LEFT JOIN public.birthday_gifts g
    ON g.student_id = u.id AND g.gift_year = p_year AND g.gift_month = p_month
  LEFT JOIN public.users s ON s.id = g.servant_id
  WHERE u.role = 'student'
    AND u.birth_date IS NOT NULL
    AND EXTRACT(MONTH FROM u.birth_date) = p_month
  ORDER BY EXTRACT(DAY FROM u.birth_date), u.name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_birthdays(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_birthdays(INTEGER, INTEGER) TO authenticated;

-- ========================================================
-- إشعارات الموبايل (Web Push)
-- كل خادم بيفعّل الإشعارات من موبايله، والاشتراك بيتحفظ هنا. الإشعارات نفسها
-- بتتبعت من Edge Function اسمها birthday-notify (في supabase/functions)،
-- وبتشتغل أول كل شهر (شوف supabase/birthday-cron.sql).
-- ========================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (user_id = public.current_user_id());

-- بيحفظ اشتراك الموبايل ده للخادم اللي داخل دلوقتي (ولو نفس الموبايل كان
-- متسجل لخادم تاني قبل كده، بينقله للخادم الحالي).
CREATE OR REPLACE FUNCTION public.save_push_subscription(p_endpoint TEXT, p_p256dh TEXT, p_auth TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_servant() THEN
    RAISE EXCEPTION 'الإشعارات للخدام بس';
  END IF;
  IF p_endpoint IS NULL OR p_p256dh IS NULL OR p_auth IS NULL THEN
    RAISE EXCEPTION 'بيانات الاشتراك ناقصة';
  END IF;

  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth)
  VALUES (public.current_user_id(), p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (endpoint) DO UPDATE
    SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, created_at = NOW();
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_push_subscription(p_endpoint TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.push_subscriptions
  WHERE endpoint = p_endpoint AND user_id = public.current_user_id();
  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_push_subscription(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_push_subscription(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_push_subscription(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_push_subscription(TEXT) TO authenticated;

-- ========================================================
-- CLEANUP: حاجات من نظام الابتدائي مالهاش لازمة هنا
-- (غياب الخدام، اجتماع الخدام، ربط الخادم بفصل).
-- ========================================================
DROP FUNCTION IF EXISTS public.get_servant_attendance_log();
DROP FUNCTION IF EXISTS public.get_servant_meeting_attendance_log();
DROP FUNCTION IF EXISTS public.current_user_class_id();
DROP FUNCTION IF EXISTS public.reset_all_points_and_opening_segment_scores();
ALTER TABLE public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_log_type_check;
ALTER TABLE public.attendance_logs DROP COLUMN IF EXISTS log_type;
