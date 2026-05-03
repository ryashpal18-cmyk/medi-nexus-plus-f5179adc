
CREATE POLICY admin_delete_roles ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY admin_update_roles ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY staff_delete_private_objects ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('xray-files','reports','prescriptions') AND public.is_staff(auth.uid()));
