
-- =====================================================
-- FIX ALL SECURITY ISSUES
-- =====================================================

-- 1. Drop ALL existing permissive public policies on ALL tables
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

-- 2. Create proper authenticated-only RLS policies for all clinical tables
-- PATIENTS
CREATE POLICY "auth_select_patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_patients" ON public.patients FOR UPDATE TO authenticated USING (true);

-- APPOINTMENTS
CREATE POLICY "auth_select_appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);

-- PRESCRIPTIONS
CREATE POLICY "auth_select_prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);

-- MEDICAL_HISTORY
CREATE POLICY "auth_select_medical_history" ON public.medical_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_medical_history" ON public.medical_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_medical_history" ON public.medical_history FOR UPDATE TO authenticated USING (true);

-- BILLING
CREATE POLICY "auth_select_billing" ON public.billing FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_billing" ON public.billing FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_billing" ON public.billing FOR UPDATE TO authenticated USING (true);

-- PAYMENTS
CREATE POLICY "auth_select_payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_payments" ON public.payments FOR UPDATE TO authenticated USING (true);

-- XRAY_REPORTS
CREATE POLICY "auth_select_xray_reports" ON public.xray_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_xray_reports" ON public.xray_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_xray_reports" ON public.xray_reports FOR UPDATE TO authenticated USING (true);

-- PHYSIOTHERAPY_SESSIONS
CREATE POLICY "auth_select_physio" ON public.physiotherapy_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_physio" ON public.physiotherapy_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_physio" ON public.physiotherapy_sessions FOR UPDATE TO authenticated USING (true);

-- BEDS
CREATE POLICY "auth_select_beds" ON public.beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_beds" ON public.beds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_beds" ON public.beds FOR UPDATE TO authenticated USING (true);

-- 3. Fix user_roles - only admin can insert, authenticated can read own
CREATE POLICY "auth_select_own_roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin_insert_roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('xray-files', 'reports', 'prescriptions');
