-- READ-ONLY. Run in the Supabase SQL editor BEFORE applying the lockdown, and paste the
-- four result tables back. Nothing here changes data or settings.

-- 1) Is row-level security on for every CES table?
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename like 'ces\_%'
order by 1;

-- 2) Every policy on the CES tables (the migration drops three of these by name)
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename like 'ces\_%'
order by 1, 2;

-- 3) What the public-facing roles are allowed to do on the CES tables
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public' and table_name like 'ces\_%' and grantee in ('anon', 'authenticated')
group by 1, 2
order by 1, 2;

-- 4) (Shared project awareness) NAMES ONLY of the non-CES tables in the same schema and
--    whether they have RLS on. Lets us see what the other application exposes. Optional.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename not like 'ces\_%'
order by 1;
