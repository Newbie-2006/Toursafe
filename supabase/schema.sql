-- =====================================================================
-- TourSafe — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Optional: the app runs in local demo mode without Supabase. Configure it
-- to enable server-side persistence + cross-device realtime.
-- =====================================================================

-- ---------- Tables ----------

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  role text not null default 'tourist' check (role in ('tourist','police')),
  nationality text,
  preferred_language text default 'en',
  created_at timestamptz not null default now()
);

create table if not exists public.officers (
  id text primary key,
  name text not null,
  badge text not null,
  status text not null default 'available' check (status in ('available','on_call','off_duty')),
  zone text,
  lat double precision,
  lng double precision
);

create table if not exists public.sos_requests (
  id text primary key,
  tourist_name text not null,
  tourist_id text not null,
  lat double precision not null,
  lng double precision not null,
  status text not null default 'active' check (status in ('active','acknowledged','resolved')),
  message text,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

create table if not exists public.incidents (
  id text primary key,
  category text not null,
  priority text not null check (priority in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','assigned','resolved')),
  title text not null,
  description text not null,
  lat double precision not null,
  lng double precision not null,
  address text,
  reporter_name text not null,
  assigned_officer_id text references public.officers(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id text primary key,
  level text not null check (level in ('info','warning','danger','success')),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.digital_identity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  full_name text not null,
  nationality text,
  passport_no text,
  visa_no text,
  blood_group text,
  insurance_provider text,
  insurance_no text,
  emergency_contact_name text,
  emergency_contact_phone text,
  verified boolean default false,
  issued_at date,
  expires_at date
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  body text,
  read boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tourist_locations (
  id uuid primary key default gen_random_uuid(),
  tourist_id text not null,
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default now()
);

-- ---------- Realtime ----------
-- Adds the operational tables to the realtime publication so the police
-- command center receives live updates.
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.sos_requests;
alter publication supabase_realtime add table public.incidents;

-- ---------- Row Level Security ----------
-- NOTE: For a hackathon demo these policies are intentionally permissive so the
-- public anon key can read/write. Tighten them (auth.uid() checks, role gating)
-- before any real deployment.

alter table public.sos_requests enable row level security;
alter table public.incidents enable row level security;
alter table public.alerts enable row level security;
alter table public.officers enable row level security;

drop policy if exists "demo_all_sos" on public.sos_requests;
create policy "demo_all_sos" on public.sos_requests for all using (true) with check (true);

drop policy if exists "demo_all_incidents" on public.incidents;
create policy "demo_all_incidents" on public.incidents for all using (true) with check (true);

drop policy if exists "demo_all_alerts" on public.alerts;
create policy "demo_all_alerts" on public.alerts for all using (true) with check (true);

drop policy if exists "demo_read_officers" on public.officers;
create policy "demo_read_officers" on public.officers for select using (true);

-- ---------- Seed officers (optional) ----------
insert into public.officers (id, name, badge, status, zone, lat, lng) values
  ('o1','Insp. Meera Nair','DL-2231','available','Connaught Place',28.6312,77.2185),
  ('o2','SI Rohan Verma','DL-4417','available','India Gate',28.6135,77.2280),
  ('o3','Const. Aisha Khan','DL-7789','on_call','Paharganj',28.6440,77.2150),
  ('o4','SI David Thomas','DL-9902','available','Central',28.6200,77.2120),
  ('o5','Const. Priya Das','DL-1120','off_duty','North Block',28.6145,77.2000)
on conflict (id) do nothing;
