# TourSafe — Travel Smart. Stay Safe.

An **AI-powered tourist safety monitoring & emergency response platform**: realtime SOS,
geo-fencing, Google Maps, a secure digital identity, incident reporting, and a live
**Police Command Center** — all in one premium, multilingual, dark/light Next.js app.

Built for the **System Siege** hackathon. Fully **BYOK (Bring Your Own API Key)** — an
evaluator configures every integration from the UI, with **zero source or `.env` edits**.

---

## ✨ Highlights

- 🧭 **Tourist Dashboard** — safety score, live risk, nearest police/hospital, quick actions, interactive map, weather, alerts, travel timeline.
- 🆘 **Realtime SOS** — hold-to-activate (3s), animated confirmation, instantly appears in the Police Command Center.
- 🤖 **AI Safety Assistant** — real **Google Gemini** streaming responses (travel guidance, translation, emergency & medical guidance, lost passport, embassy help). Answers in the selected language.
- 🗺️ **Google Maps** — current location, safe/caution/danger geo-fenced zones, police, hospitals, embassies, animated markers.
- 🛡️ **Police Command Center** — a distinct dark "mission control": realtime SOS + incident queues, **live tourist tracking on the map**, **real crowd-density grid computed from tourist positions**, assign officers, resolve, risk analytics (Recharts), resource management, translation center, digital ID verification against issued IDs.
- 🪪 **Digital Identity** — Apple-Wallet-style card with a **unique per-tourist** TourSafe ID + scannable QR + a **simulated** blockchain verification timeline (unique hashes per tourist).
- 🌐 **5 languages** — English, Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ). Persisted across refresh; Gemini replies respect the choice.
- 🎨 **Handcrafted light & dark themes**, soft neumorphism, 24px radii, Framer Motion micro-interactions.
- 🧯 **Never crashes** — elegant fallbacks when AI, Maps, or Supabase are not configured.

---

## 🔑 Where the API keys come from & how it all works (read this first)

TourSafe is **BYOK**. Nothing is hardcoded. There are three integrations, each configured
**from the running app** and stored **only in your browser** (`localStorage`):

| Integration | Where you get the key | Where you paste it | What it powers | If missing |
|---|---|---|---|---|
| **Google Gemini** (AI) | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | **Settings → AI Configuration** | AI Assistant, Translation, Emergency guidance | Elegant "Configure AI" onboarding card (no crash) |
| **Google Maps** | [Google Cloud Console → Maps](https://console.cloud.google.com/google/maps-apis) (enable *Maps JavaScript API* + *Places API*) | **Settings → Maps Configuration** | Interactive map, zones, markers | Friendly "Map not configured" placeholder |
| **Supabase** (optional) | [supabase.com](https://supabase.com) → Project → Settings → API | **Settings → Supabase** | Server persistence + cross-device realtime | **Local demo mode** (browser storage + realtime across tabs) |

**How the AI key stays safe:** the key you enter in the browser is sent with each request to
a Next.js API route (`/api/ai/chat`) that forwards it **directly to Google**. It is **never
bundled into the client, never logged, and never committed**. See `src/lib/config.ts` and
`src/app/api/ai/`.

**How realtime works without Supabase:** SOS, incidents, and **live tourist presence**
(each tourist's ID + moving location + safety score) are broadcast over the browser's
`BroadcastChannel` + `localStorage` events, so the Tourist app and the Police Command Center
stay in sync instantly across tabs in the same browser. The **crowd-density grid** and the
**live tourist markers/count** on the police map are computed from those real presence
positions — no random values. Configure Supabase to extend this to real server persistence
and cross-device realtime (`supabase/schema.sql` provided).

**Digital identity is per-tourist:** every signed-in tourist gets a unique, deterministic
TourSafe ID, passport/visa/insurance, QR payload, and verification ledger derived from their
account — there is no shared demo persona. The Police "Digital ID Verification" panel checks a
scanned QR or typed ID against the IDs actually issued on the device.

> ⚠️ **The blockchain workflow is SIMULATED.** The "Blockchain Verification" timeline generates
> unique hashes and timestamps locally per tourist for demonstration only. Nothing is written to
> or read from any real blockchain, and no on-chain claims are made.

> **For evaluators:** you do **not** need to touch code or `.env`. Just open the app →
> **Settings → AI Configuration** → paste a Gemini key → **Test Connection**. Do the same for
> Maps if you want the live map. Everything else works out of the box in demo mode.

---

## 🧠 AI Configuration (mandatory hackathon section)

- **Provider:** Google Gemini
- **Default model:** `gemini-2.5-flash` (also `gemini-2.5-pro`, `gemini-2.0-flash`)
- **Supports BYOK:** ✅ Yes
- **Configure:** Settings → AI Configuration → enter key → **Save**
- **Test:** click **Test Connection** (calls `/api/ai/test`, returns Connected / Invalid / Disconnected)
- **No source modification required.** The key is stored in `localStorage` and used automatically by every AI feature.
- **Real LLM only:** every AI response is a live Gemini API call — no hardcoded or rule-based fake responses.

---

## 🛠️ Tech Stack

| Area | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 + custom design tokens |
| UI | Hand-built shadcn-style primitives |
| Animation | Framer Motion |
| Icons | Lucide React |
| AI | Google Gemini (REST, streaming) |
| Maps | Google Maps JS API (`@react-google-maps/api`) |
| Database / Realtime | Supabase (optional) + local `BroadcastChannel` fallback |
| Validation | Zod + React Hook Form |
| Charts | Recharts |
| QR | `qrcode.react` |
| Deploy | Vercel |

---

## 📁 Project Structure

```
src/
├─ app/                    # App Router routes
│  ├─ (tourist)/           # Tourist app shell + pages
│  │  ├─ dashboard/  map/  assistant/  digital-id/  profile/
│  │  └─ settings/  settings/ai/  settings/maps/
│  ├─ police/              # Police Command Center (forced dark)
│  ├─ api/ai/chat/         # Gemini streaming proxy (BYOK)
│  ├─ api/ai/test/         # Gemini key validation
│  ├─ layout.tsx  page.tsx  providers.tsx  globals.css
│  ├─ not-found.tsx  error.tsx
├─ components/             # UI primitives, brand, nav, shared
│  ├─ ui/                  # button, card, input, modal, toast, tabs…
│  └─ tourist/  settings/  brand/
├─ features/              # Feature modules (config, i18n, theme, data,
│  │                      #   ai, map, sos, incident, identity, route,
│  │                      #   police, location, settings)
├─ lib/                   # config (BYOK), gemini, supabase, safety,
│  │                      #   validation, demo-data, i18n dictionaries, utils
└─ types/                 # shared TypeScript types
supabase/schema.sql       # optional database schema
```

---

## 🚀 Getting Started

```bash
# 1. Install
npm install

# 2. Run
npm run dev
# → http://localhost:3000

# 3. Configure integrations in the UI (Settings → AI / Maps / Supabase)
```

Build & lint:

```bash
npm run lint     # ESLint — clean
npm run build    # Production build — zero TypeScript errors
npm run start    # Serve the production build
```

---

## 🔐 Environment Variables (all optional)

Copy `.env.example` → `.env.local`. **Everything is optional** — these are only first-load
defaults; the UI can configure all of them at runtime.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=
GEMINI_API_KEY=              # server-side fallback only; BYOK is preferred
NEXT_PUBLIC_APP_NAME=TourSafe
```

---

## 🗄️ Supabase Setup (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste `supabase/schema.sql` → **Run**.
3. Copy **Project URL** and **anon public key** from **Settings → API**.
4. In the app: **Settings → Supabase** → paste both → **Save**.

Without Supabase the app runs in **local demo mode** and remains fully functional.

---

## ▲ Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) (framework auto-detected: Next.js).
3. **No environment variables required** — deploy as-is.
4. After deploy, open the app and configure keys in **Settings** (BYOK).

The project builds cleanly with no additional configuration.

---

## 🔒 Security

- Secrets are **never** hardcoded, logged, or committed.
- The Gemini key is forwarded server-side, straight to Google.
- All forms validated with **Zod**; inputs sanitized.
- Role-separated surfaces: Tourist app vs. Police Command Center.
- Supabase RLS policies included (demo-permissive — tighten before production).

---

## 🔭 Future Scope

- Supabase Auth with real tourist/officer roles & protected routes.
- On-chain (not simulated) identity anchoring.
- Live Google Directions API for safe-route polylines.
- Push notifications & offline-first PWA.
- Predictive risk modeling from historical incident data.

---

## 📜 License

Built for the System Siege hackathon. © TourSafe.
