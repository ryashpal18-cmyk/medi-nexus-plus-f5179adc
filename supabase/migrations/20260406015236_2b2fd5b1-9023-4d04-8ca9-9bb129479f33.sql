
-- Drop all existing policies on clinical tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('patients','appointments','prescriptions','medical_history','billing','payments','xray_reports','physiotherapy_sessions','beds','user_roles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- Helper: check if user has any staff role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'doctor', 'staff')
  )
$$;

-- ========== PATIENTS ==========
CREATE POLICY "staff_select_patients" ON public.patients FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_patients" ON public.patients FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ========== APPOINTMENTS ==========
CREATE POLICY "staff_select_appointments" ON public.appointments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ========== PRESCRIPTIONS ==========
CREATE POLICY "staff_select_prescriptions" ON public.prescriptions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_prescriptions" ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_prescriptions" ON public.prescriptions FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ========== MEDICAL_HISTORY ==========
CREATE POLICY "staff_select_medical_history" ON public.medical_history FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_medical_history" ON public.medical_history FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_medical_history" ON public.medical_history FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ========== BILLING ==========
CREATE POLICY "staff_select_billing" ON public.billing FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_billing" ON public.billing FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_billing" ON public.billing FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ========== PAYMENTS ==========
CREATE POLICY "staff_select_payments" ON public.payments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_payments" ON public.payments FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ========== XRAY_REPORTS ==========
CREATE POLICY "staff_select_xray_reports" ON public.xray_reports FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_xray_reports" ON public.xray_reports FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_xray_reports" ON public.xray_reports FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ========== PHYSIOTHERAPY_SESSIONS ==========
CREATE POLICY "staff_select_physio" ON public.physiotherapy_sessions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_physio" ON public.physiotherapy_sessions FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_physio" ON public.physiotherapy_sessions FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ========== BEDS ==========
CREATE POLICY "staff_select_beds" ON public.beds FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_beds" ON public.beds FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_beds" ON public.beds FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

-- ========== USER_ROLES ==========
CREATE POLICY "users_select_own_role" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "admin_select_all_roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== STORAGE POLICIES ==========
-- Drop existing storage policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END$$;

-- Storage: staff-only access
CREATE POLICY "staff_select_storage" ON storage.objects FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_insert_storage" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_storage" ON storage.objects FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
