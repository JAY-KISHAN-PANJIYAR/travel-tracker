# Atlas — Travel Tracker v2

A Next.js travel tracker with an interactive map, Supabase auth/database, and deployment to Vercel.

## What's included

- 🗺️ **Interactive world map** — visited countries and states highlighted, with city pins
- 🛰️ **3 map styles** — Standard, Dark, Satellite (toggle in top-right)
- ⭐ **Wishlist mode** — mark places you want to visit (purple on map)
- ✈️ **Trip grouping** — tag cities to a named trip (e.g. "Europe 2024")
- ⭐ **5-star ratings** — rate each city you've visited
- ✏️ **Edit places** — update notes, ratings, dates without deleting
- 📊 **Rich stats** — countries, states, cities, continents, most-visited, latest visit, continent progress bar
- 🔍 **Search + filter** — filter by Visited / Wishlist, search by name
- 👤 **Multi-user** — each user sees only their own places (Supabase Auth + RLS)
- 📱 **Mobile responsive** — map/list toggle on small screens

## Setup

### 1. Unzip and install
```bash
unzip travel-tracker-v2.zip
cd travel-tracker
npm install
```

### 2. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. In **SQL Editor**, paste and run the contents of `supabase/schema.sql`
3. Enable **Email Auth** under Authentication → Providers

### 3. Environment variables
```bash
cp .env.local.example .env.local
```
Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
Find these in Supabase → Settings → API.

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel
1. Push to GitHub
2. Import in [vercel.com](https://vercel.com) → New Project
3. Add the same two env vars in Vercel → Settings → Environment Variables
4. Deploy!

## Database schema (v2 additions vs v1)
- `continent` — auto-filled from country code
- `rating` — integer 1-5
- `status` — `'visited'` or `'wishlist'`
- `trip_name` — optional trip label
- Unique constraint updated to allow same city across different trips
