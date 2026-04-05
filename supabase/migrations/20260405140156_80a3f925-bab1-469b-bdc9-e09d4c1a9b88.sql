
-- Drop and recreate policies for patients
DROP POLICY IF EXISTS "Admin can delete patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can view patients" ON patients;
DROP POLICY IF EXISTS "Staff/doctor/admin can insert patients" ON patients;
DROP POLICY IF EXISTS "Staff/doctor/admin can update patients" ON patients;

CREATE POLICY "Allow select on patients" ON patients FOR SELECT USING (true);
CREATE POLICY "Allow insert on patients" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on patients" ON patients FOR UPDATE USING (true);

-- Drop and recreate policies for appointments
DROP POLICY IF EXISTS "Admin can delete appointments" ON appointments;
DROP POLICY IF EXISTS "Auth users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Auth users can update appointments" ON appointments;
DROP POLICY IF EXISTS "Auth users can view appointments" ON appointments;

CREATE POLICY "Allow select on appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow insert on appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on appointments" ON appointments FOR UPDATE USING (true);

-- Drop and recreate policies for prescriptions
DROP POLICY IF EXISTS "Auth users can insert prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Auth users can update prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Auth users can view prescriptions" ON prescriptions;

CREATE POLICY "Allow select on prescriptions" ON prescriptions FOR SELECT USING (true);
CREATE POLICY "Allow insert on prescriptions" ON prescriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on prescriptions" ON prescriptions FOR UPDATE USING (true);

-- Drop and recreate policies for medical_history
DROP POLICY IF EXISTS "Auth users can insert medical_history" ON medical_history;
DROP POLICY IF EXISTS "Auth users can update medical_history" ON medical_history;
DROP POLICY IF EXISTS "Auth users can view medical_history" ON medical_history;

CREATE POLICY "Allow select on medical_history" ON medical_history FOR SELECT USING (true);
CREATE POLICY "Allow insert on medical_history" ON medical_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on medical_history" ON medical_history FOR UPDATE USING (true);

-- Drop and recreate policies for billing
DROP POLICY IF EXISTS "Auth users can insert billing" ON billing;
DROP POLICY IF EXISTS "Auth users can update billing" ON billing;
DROP POLICY IF EXISTS "Auth users can view billing" ON billing;

CREATE POLICY "Allow select on billing" ON billing FOR SELECT USING (true);
CREATE POLICY "Allow insert on billing" ON billing FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on billing" ON billing FOR UPDATE USING (true);

-- Drop and recreate policies for payments
DROP POLICY IF EXISTS "Auth users can insert payments" ON payments;
DROP POLICY IF EXISTS "Auth users can view payments" ON payments;

CREATE POLICY "Allow select on payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow insert on payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on payments" ON payments FOR UPDATE USING (true);

-- Drop and recreate policies for xray_reports
DROP POLICY IF EXISTS "Auth users can insert xray_reports" ON xray_reports;
DROP POLICY IF EXISTS "Auth users can update xray_reports" ON xray_reports;
DROP POLICY IF EXISTS "Auth users can view xray_reports" ON xray_reports;

CREATE POLICY "Allow select on xray_reports" ON xray_reports FOR SELECT USING (true);
CREATE POLICY "Allow insert on xray_reports" ON xray_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on xray_reports" ON xray_reports FOR UPDATE USING (true);

-- Drop and recreate policies for physiotherapy_sessions
DROP POLICY IF EXISTS "Auth users can insert physiotherapy" ON physiotherapy_sessions;
DROP POLICY IF EXISTS "Auth users can update physiotherapy" ON physiotherapy_sessions;
DROP POLICY IF EXISTS "Auth users can view physiotherapy" ON physiotherapy_sessions;

CREATE POLICY "Allow select on physiotherapy_sessions" ON physiotherapy_sessions FOR SELECT USING (true);
CREATE POLICY "Allow insert on physiotherapy_sessions" ON physiotherapy_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on physiotherapy_sessions" ON physiotherapy_sessions FOR UPDATE USING (true);

-- Drop and recreate policies for beds
DROP POLICY IF EXISTS "Auth users can insert beds" ON beds;
DROP POLICY IF EXISTS "Auth users can update beds" ON beds;
DROP POLICY IF EXISTS "Auth users can view beds" ON beds;

CREATE POLICY "Allow select on beds" ON beds FOR SELECT USING (true);
CREATE POLICY "Allow insert on beds" ON beds FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on beds" ON beds FOR UPDATE USING (true);

-- user_roles - keep more restrictive but add anon select
DROP POLICY IF EXISTS "Admin can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Admin can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admin can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Allow select on user_roles" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Allow insert on user_roles" ON user_roles FOR INSERT WITH CHECK (true);
