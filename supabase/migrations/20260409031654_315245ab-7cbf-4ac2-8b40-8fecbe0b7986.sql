
-- Allow admin to delete billing records
CREATE POLICY "admin_delete_billing"
ON public.billing
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to delete patient records
CREATE POLICY "admin_delete_patients"
ON public.patients
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to delete appointments for cascade cleanup
CREATE POLICY "admin_delete_appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to delete prescriptions for cascade cleanup
CREATE POLICY "admin_delete_prescriptions"
ON public.prescriptions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to delete physiotherapy_sessions for cascade cleanup
CREATE POLICY "admin_delete_physio"
ON public.physiotherapy_sessions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to delete xray_reports for cascade cleanup
CREATE POLICY "admin_delete_xray"
ON public.xray_reports
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to delete medical_history for cascade cleanup
CREATE POLICY "admin_delete_medical_history"
ON public.medical_history
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to delete payments for cascade cleanup
CREATE POLICY "admin_delete_payments"
ON public.payments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create deleted_records_log table for recovery
CREATE TABLE public.deleted_records_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_data JSONB NOT NULL,
  deleted_by UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deleted_records_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_deleted_log"
ON public.deleted_records_log
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "staff_insert_deleted_log"
ON public.deleted_records_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "admin_delete_deleted_log"
ON public.deleted_records_log
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
