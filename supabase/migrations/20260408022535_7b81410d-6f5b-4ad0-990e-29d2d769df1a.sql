
-- Add invoice_pdf_url column to billing table
ALTER TABLE public.billing ADD COLUMN invoice_pdf_url text;

-- Create public storage bucket for invoices
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);

-- Allow public read access to invoices
CREATE POLICY "Public can view invoices"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices');

-- Staff can upload invoices
CREATE POLICY "Staff can upload invoices"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices' AND public.is_staff(auth.uid()));

-- Staff can update invoices
CREATE POLICY "Staff can update invoices"
ON storage.objects FOR UPDATE
USING (bucket_id = 'invoices' AND public.is_staff(auth.uid()));

-- Admin can delete invoices
CREATE POLICY "Admin can delete invoices"
ON storage.objects FOR DELETE
USING (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'));
