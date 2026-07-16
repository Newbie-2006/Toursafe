# Supabase Setup — TourSafe

Supabase is **optional**. Without it, TourSafe runs in local demo mode (realtime
across tabs in one browser via `BroadcastChannel` + `localStorage`). Configuring
Supabase upgrades the app to **server persistence + cross-DEVICE realtime** — e.g.
a tourist on a phone showing up live on the police laptop.

You do **not** edit any source or `.env` to enable it. Keys are entered in the UI.

---

## What gets synced

| Table | Written by | Read by | Purpose |
|---|---|---|---|
| `sos_requests` | Tourist SOS | Police SOS queue + map | Live SOS |
| `incidents` | Tourist report | Police incident queue + map | Live incidents |
| `tourist_presence` | Tourist heartbeat (~6s) | Police map + crowd density + Active-Tourists count | Live location |
| `digital_ids` | Tourist login / profile save | Police "ID Verification" | Cross-device ID lookup |
| `officers` | (seeded once by the SQL) | Incident "Assign Officer" | Officer roster |

Alerts/notifications stay local by design (they're per-user UI).

---

## Step 1 — Create a Supabase project

1. Go to <https://supabase.com> → sign in → **New project**.
2. Give it a name (e.g. `toursafe`), set a database password, pick a region.
3. Wait ~2 minutes for it to provision.

## Step 2 — Create the database

1. In the project, open **SQL Editor → New query**.
2. Open [`supabase/schema.sql`](./schema.sql) from this repo, copy **all** of it,
   paste it into the editor.
3. Click **Run**. You should see “Success. No rows returned”.
   - Safe to re-run; it uses `create table if not exists` and `on conflict do nothing`.
   - Run it on a **fresh** project. (If you previously ran an older schema, that's
     fine — the new tables are additive.)

## Step 3 — Copy your keys

1. Go to **Project Settings → API** (gear icon, bottom-left → “API”).
2. Copy two values:
   - **Project URL** — looks like `https://abcdxyz.supabase.co`
   - **anon public** key (under “Project API keys”) — a long JWT string.
   - ⚠️ Use the **anon public** key, NOT the `service_role` key. The anon key is
     safe in the browser; the service key must never be shipped to a client.

## Step 4 — Enter the keys in the app

1. Run the app (`npm run dev`) and sign in.
2. Go to **Settings → Supabase**.
3. Paste the **Project URL** and **anon public** key → **Save**.
4. That's it — the app now mirrors to Supabase and subscribes to realtime.

## Step 5 — Verify it works

**Persistence check**
1. Trigger an SOS or file an incident as a tourist.
2. In your Supabase dashboard, open **Table Editor → `sos_requests`** (or
   `incidents`) — you should see the new row.
3. Open **Table Editor → `tourist_presence`** — you should see a row for your
   tourist that updates its `last_seen`/`lat`/`lng` as you move.

**Cross-device realtime check** (the payoff)
1. On **Device A** (or a normal browser) sign in as a **tourist**, configure the
   same Supabase keys, and keep the dashboard open.
2. On **Device B** (or a different browser/profile) sign in as **police** with the
   same Supabase keys.
3. The police **Active Tourists** count, crowd-density grid, and live map markers
   should reflect the tourist on Device A — with no shared browser storage.
4. In the police **Digital ID Verification** box, type the tourist's TourSafe ID
   (e.g. `TS-IN-5822`) → it resolves from Supabase even though that tourist never
   logged in on Device B.

> Tip: both sides must have the **same** Supabase URL + anon key configured.

---

## Security notes (before any real deployment)

The RLS policies in `schema.sql` are **permissive** (`using (true)`) so the anon
key can read/write for a demo. Before production:

- Add Supabase Auth and replace the demo policies with `auth.uid()` / role checks.
- Restrict `tourist_presence` / `sos_requests` writes to the owning tourist and
  reads of the full fleet to the police role.
- Consider a scheduled cleanup for stale presence rows (SQL at the bottom of
  `schema.sql`); the app already hides stale rows client-side by `last_seen`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Nothing appears in Table Editor | Re-check you pasted the **Project URL** and **anon** key in Settings → Supabase and clicked Save. |
| Rows insert but police doesn't update live | Confirm the `alter publication supabase_realtime add table …` block ran (Step 2). Re-run `schema.sql`. |
| `permission denied for table …` | RLS is on but the policy didn't apply — re-run the RLS section of `schema.sql`. |
| Used the wrong key | Make sure it's **anon public**, not `service_role`. |
| Still works offline | That's expected — Supabase is a mirror; local mode is the always-on fallback. |
