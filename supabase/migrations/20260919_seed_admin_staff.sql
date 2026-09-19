-- ==============================================================================
-- MIGRATION: 20260919_seed_admin_staff.sql
-- Citizens Elementary School (CES) Discipleship Training Platform
-- Classification: ACCESS CONTROL & SEED DATA
-- Purpose: Seed administrator staff profile linked to Supabase auth.users
-- ==============================================================================

INSERT INTO ces_staff_profiles (id, full_name, email, role)
SELECT 
  u.id,
  'Lead Administrator',
  u.email,
  'super_admin'
FROM auth.users u
WHERE u.email = 'admin@citizens.church'
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin', full_name = 'Lead Administrator';
