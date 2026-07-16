-- =====================================================================
-- TourSafe — Supabase schema (v2)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- OPTIONAL: the app runs fully in local demo mode (BroadcastChannel +
-- localStorage) without Supabase. Configuring Supabase upgrades the app to
-- real server persistence + cross-DEVICE realtime (tourist on a phone, police
-- on a laptop). Everything below is safe to run on a fresh project.
--
-- Tables that sync to Supabase when configured:
--   officers, sos_requests, incidents, tourist_presence, digital_ids
-- Alerts/notifications intentionally stay local (per-user UI only).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- Reference roster of officers (read-only in the app).
create table if not exists public.officers (
  id     text primary key,
  name   text not null,
  badge  text not null,
  status text not null default 'available' check (status in ('available','on_call','off_duty')),
  zone   text,
  lat    double precision,
  lng    double precision
);

-- Emergency SOS requests raised by tourists.
create table if not exists public.sos_requests (
  id              text primary key,
  tourist_name    text not null,
  tourist_id      text not null,
  lat             double precision not null,
  lng             double precision not null,
  status          text not null default 'active' check (status in ('active','acknowledged','resolved')),
  message         text,
  created_at      timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at     timestamptz
);

-- Incident reports filed by tourists.
create table if not exists public.incidents (
  id                  text primary key,
  category            text not null,
  priority            text not null check (priority in ('low','medium','high','critical')),
  status              text not null default 'open' check (status in ('open','assigned','resolved')),
  title               text not null,
  description         text not null,
  lat                 double precision not null,
  lng                 double precision not null,
  address             text,
  reporter_name       text not null,
  assigned_officer_id text references public.officers(id) on delete set null,
  created_at          timestamptz not null default now()
);

-- Live tourist presence — one row per tourist, upserted on each heartbeat.
-- Powers the Police live map, crowd density and "Active Tourists" count.
create table if not exists public.tourist_presence (
  tourist_id   text primary key,
  name         text not null,
  nationality  text,
  lat          double precision not null,
  lng          double precision not null,
  safety_score integer,
  last_seen    timestamptz not null default now()
);

-- Issued digital identities — the registry the Police "ID Verification"
-- panel checks a scanned QR / typed Tourist ID against.
create table if not exists public.digital_ids (
  tourist_id              text primary key,
  full_name               text not null,
  nationality             text,
  passport_no             text,
  visa_no                 text,
  blood_group             text,
  insurance_provider      text,
  insurance_no            text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  verified                boolean default false,
  issued_at               date,
  expires_at              date,
  updated_at              timestamptz not null default now()
);

-- Helpful indexes for verification lookups.
create index if not exists digital_ids_passport_idx on public.digital_ids (passport_no);
create index if not exists tourist_presence_last_seen_idx on public.tourist_presence (last_seen);

-- ---------------------------------------------------------------------
-- Realtime — publish operational tables so subscribers get live changes.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  begin alter publication supabase_realtime add table public.sos_requests;    exception when others then null; end;
  begin alter publication supabase_realtime add table public.incidents;       exception when others then null; end;
  begin alter publication supabase_realtime add table public.tourist_presence; exception when others then null; end;
  begin alter publication supabase_realtime add table public.digital_ids;     exception when others then null; end;
end $$;

-- Include full old-row data on updates/deletes (needed for reliable realtime).
alter table public.sos_requests    replica identity full;
alter table public.incidents       replica identity full;
alter table public.tourist_presence replica identity full;
alter table public.digital_ids     replica identity full;

-- ---------------------------------------------------------------------
-- Row Level Security
-- NOTE: These policies are intentionally PERMISSIVE so the public anon key
-- can read/write in a hackathon demo. Tighten them (auth.uid() checks, role
-- gating) before any real deployment.
-- ---------------------------------------------------------------------
alter table public.officers          enable row level security;
alter table public.sos_requests      enable row level security;
alter table public.incidents         enable row level security;
alter table public.tourist_presence  enable row level security;
alter table public.digital_ids       enable row level security;

drop policy if exists "demo_read_officers" on public.officers;
create policy "demo_read_officers" on public.officers for select using (true);

drop policy if exists "demo_all_sos" on public.sos_requests;
create policy "demo_all_sos" on public.sos_requests for all using (true) with check (true);

drop policy if exists "demo_all_incidents" on public.incidents;
create policy "demo_all_incidents" on public.incidents for all using (true) with check (true);

drop policy if exists "demo_all_presence" on public.tourist_presence;
create policy "demo_all_presence" on public.tourist_presence for all using (true) with check (true);

drop policy if exists "demo_all_digital_ids" on public.digital_ids;
create policy "demo_all_digital_ids" on public.digital_ids for all using (true) with check (true);

-- ---------------------------------------------------------------------
-- Seed the officer roster (matches src/lib/demo-data.ts).
-- ---------------------------------------------------------------------
insert into public.officers (id, name, badge, status, zone, lat, lng) values
  ('o1','Insp. Meera Nair','DL-2231','available','Connaught Place',28.6312,77.2185),
  ('o2','SI Rohan Verma','DL-4417','available','India Gate',28.6135,77.2280),
  ('o3','Const. Aisha Khan','DL-7789','on_call','Paharganj',28.6440,77.2150),
  ('o4','SI David Thomas','DL-9902','available','Central',28.6200,77.2120),
  ('o5','Const. Priya Das','DL-1120','off_duty','North Block',28.6145,77.2000)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Optional housekeeping: drop tourists that stopped sending heartbeats.
-- Call periodically (e.g. a Supabase scheduled function) if you like; the app
-- also hides stale rows client-side by `last_seen`, so this is not required.
--   delete from public.tourist_presence where last_seen < now() - interval '3 minutes';
-- ---------------------------------------------------------------------
