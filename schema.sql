-- Medicy LIMS schema for Supabase
-- Run in the Supabase SQL editor as the project owner.
-- Authorization uses auth.users.raw_app_meta_data (available as app_metadata in JWTs).

create table if not exists public.lims_requests (
  id uuid primary key default gen_random_uuid(),
  type varchar(20) not null,
  sub_type varchar(100) not null,
  status varchar(30) not null default 'Pending Sample',
  department varchar(30) not null default 'Molecular',
  facility_id varchar(50),
  facility varchar(255),
  created_by uuid references auth.users(id) on delete set null,
  clinician_email varchar(255) not null,
  patient_name varchar(255) not null,
  patient_id varchar(100),
  patient_phone varchar(50),
  patient_details jsonb not null default '{}'::jsonb,
  request_details jsonb not null default '{}'::jsonb,
  sample_details jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  results_uploaded_at timestamptz,
  results_uploaded_by varchar(255)
);

-- Safe upgrades for projects created from the original TB/HIV-only schema.
alter table public.lims_requests add column if not exists department varchar(30) default 'Molecular';
alter table public.lims_requests add column if not exists facility_id varchar(50);
alter table public.lims_requests add column if not exists facility varchar(255);
alter table public.lims_requests add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.lims_requests alter column type type varchar(20);
alter table public.lims_requests alter column sub_type type varchar(100);

update public.lims_requests
set department = case
  when type = 'Haematology' then 'Haematology'
  when type = 'Chemistry' then 'Chemistry'
  else 'Molecular'
end
where department is null;

-- Legacy Zingwangwa rows predate facility isolation. Assign them before enforcing it.
update public.lims_requests set facility_id = 'ZCH001' where facility_id is null;

alter table public.lims_requests alter column department set not null;
alter table public.lims_requests alter column facility_id set not null;

alter table public.lims_requests drop constraint if exists lims_requests_type_check;
alter table public.lims_requests add constraint lims_requests_type_check
  check (type in ('TB', 'HIV', 'Haematology', 'Chemistry'));

alter table public.lims_requests drop constraint if exists lims_requests_status_check;
alter table public.lims_requests add constraint lims_requests_status_check
  check (status in ('Pending Sample', 'Sample Received', 'Testing', 'Completed'));

alter table public.lims_requests drop constraint if exists lims_requests_department_check;
alter table public.lims_requests add constraint lims_requests_department_check
  check (department in ('Molecular', 'Haematology', 'Chemistry'));

create index if not exists idx_lims_requests_facility on public.lims_requests(facility_id);
create index if not exists idx_lims_requests_type on public.lims_requests(type);
create index if not exists idx_lims_requests_status on public.lims_requests(status);
create index if not exists idx_lims_requests_clinician on public.lims_requests(clinician_email);
create index if not exists idx_lims_requests_created_by on public.lims_requests(created_by);
create index if not exists idx_lims_requests_patient_name on public.lims_requests(patient_name);
create index if not exists idx_lims_requests_patient_id on public.lims_requests(patient_id);

create or replace function public.set_medicy_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_medicy_updated_at on public.lims_requests;
create trigger set_medicy_updated_at
before update on public.lims_requests
for each row execute function public.set_medicy_updated_at();

alter table public.lims_requests enable row level security;

drop policy if exists "Clinicians can insert requests" on public.lims_requests;
drop policy if exists "Clinicians can view their own requests" on public.lims_requests;
drop policy if exists "Lab Technicians have full update access" on public.lims_requests;
drop policy if exists "medicy_select_requests" on public.lims_requests;
drop policy if exists "medicy_insert_requests" on public.lims_requests;
drop policy if exists "medicy_lab_update_requests" on public.lims_requests;

create policy "medicy_select_requests"
on public.lims_requests
for select
to authenticated
using (
  facility_id = (select auth.jwt() -> 'app_metadata' ->> 'facility_id')
  and (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'lab'
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or created_by = (select auth.uid())
    or clinician_email = (select auth.jwt() ->> 'email')
    or ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'tb' and type = 'TB')
    or ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'hiv' and type = 'HIV')
  )
);

create policy "medicy_insert_requests"
on public.lims_requests
for insert
to authenticated
with check (
  facility_id = (select auth.jwt() -> 'app_metadata' ->> 'facility_id')
  and created_by = (select auth.uid())
  and clinician_email = (select auth.jwt() ->> 'email')
  and (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'lab'
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'tb' and type = 'TB')
    or ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'hiv' and type = 'HIV')
    or (
      (select auth.jwt() -> 'app_metadata' ->> 'role') = 'clinician'
      and type in ('Haematology', 'Chemistry')
    )
  )
);

create policy "medicy_lab_update_requests"
on public.lims_requests
for update
to authenticated
using (
  facility_id = (select auth.jwt() -> 'app_metadata' ->> 'facility_id')
  and (select auth.jwt() -> 'app_metadata' ->> 'role') in ('lab', 'admin')
)
with check (
  facility_id = (select auth.jwt() -> 'app_metadata' ->> 'facility_id')
  and (select auth.jwt() -> 'app_metadata' ->> 'role') in ('lab', 'admin')
);

revoke all on table public.lims_requests from anon;
grant select, insert, update on table public.lims_requests to authenticated;
grant all on table public.lims_requests to service_role;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lims_requests'
  ) then
    alter publication supabase_realtime add table public.lims_requests;
  end if;
end $$;

-- Required app_metadata per user (set with the Supabase Admin API/service role):
-- {
--   "role": "admin" | "lab" | "tb" | "hiv" | "clinician",
--   "facility_id": "ZCH001",
--   "facility_name": "Zingwangwa Community Hospital"
-- }
-- Never store authorization roles in user_metadata; end users can edit it.
