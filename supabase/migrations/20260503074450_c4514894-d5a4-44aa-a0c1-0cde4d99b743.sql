UPDATE storage.buckets SET public = false WHERE id = 'invoices';

DROP POLICY IF EXISTS "Public can view invoices" ON storage.objects;

CREATE POLICY "staff_select_invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices' AND public.is_staff(auth.uid()));

CREATE POLICY "staff_insert_invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices' AND public.is_staff(auth.uid()));

CREATE POLICY "staff_update_invoices"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices' AND public.is_staff(auth.uid()));