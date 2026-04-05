
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'staff', 'patient');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  mobile TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff/doctor/admin can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff/doctor/admin can update patients" ON public.patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete patients" ON public.patients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_name TEXT DEFAULT 'Dr. S. S. Rathore',
  date DATE NOT NULL,
  time_slot TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Prescriptions
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  diagnosis TEXT,
  medicines TEXT,
  advice TEXT,
  followup_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);

-- Medical History
CREATE TABLE public.medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view medical_history" ON public.medical_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert medical_history" ON public.medical_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update medical_history" ON public.medical_history FOR UPDATE TO authenticated USING (true);

-- Billing
CREATE TABLE public.billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Partial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view billing" ON public.billing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert billing" ON public.billing FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update billing" ON public.billing FOR UPDATE TO authenticated USING (true);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id UUID REFERENCES public.billing(id) ON DELETE CASCADE NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);

-- X-Ray Reports
CREATE TABLE public.xray_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT,
  report_type TEXT DEFAULT 'X-Ray',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.xray_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view xray_reports" ON public.xray_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert xray_reports" ON public.xray_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update xray_reports" ON public.xray_reports FOR UPDATE TO authenticated USING (true);

-- Physiotherapy Sessions
CREATE TABLE public.physiotherapy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  exercise_plan TEXT,
  session_number INTEGER NOT NULL DEFAULT 1,
  total_sessions INTEGER NOT NULL DEFAULT 10,
  pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
  progress_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.physiotherapy_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view physiotherapy" ON public.physiotherapy_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert physiotherapy" ON public.physiotherapy_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update physiotherapy" ON public.physiotherapy_sessions FOR UPDATE TO authenticated USING (true);

-- Beds
CREATE TABLE public.beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_number TEXT NOT NULL UNIQUE,
  bed_type TEXT NOT NULL CHECK (bed_type IN ('Ward', 'Semi-Private', 'Private')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view beds" ON public.beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert beds" ON public.beds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update beds" ON public.beds FOR UPDATE TO authenticated USING (true);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON public.billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON public.beds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('xray-files', 'xray-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', true);

-- Storage policies
CREATE POLICY "Authenticated users can view xray files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'xray-files');
CREATE POLICY "Authenticated users can upload xray files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'xray-files');

CREATE POLICY "Authenticated users can view reports" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'reports');
CREATE POLICY "Authenticated users can upload reports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Authenticated users can view prescriptions" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'prescriptions');
CREATE POLICY "Authenticated users can upload prescriptions" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'prescriptions');

-- Seed default beds
INSERT INTO public.beds (bed_number, bed_type, status) VALUES
  ('W-01', 'Ward', 'available'), ('W-02', 'Ward', 'available'), ('W-03', 'Ward', 'available'),
  ('W-04', 'Ward', 'available'), ('W-05', 'Ward', 'available'),
  ('SP-01', 'Semi-Private', 'available'), ('SP-02', 'Semi-Private', 'available'),
  ('SP-03', 'Semi-Private', 'available'), ('SP-04', 'Semi-Private', 'available'),
  ('P-01', 'Private', 'available'), ('P-02', 'Private', 'available'),
  ('P-03', 'Private', 'available'), ('P-04', 'Private', 'available'),
  ('P-05', 'Private', 'available'), ('P-06', 'Private', 'available');
