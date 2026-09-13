# CHARTMAKER

Dynamic lead sheet & chord chart manager. Write charts in universal Roman numeral syntax (or absolute chords), transpose live between all 12 keys, and export print-ready PDFs.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Auth email/password + OAuth scaffold, Postgres with RLS)
- @react-pdf/renderer for PDF export
- Jest unit tests for the music engine

## Getting started

1. Install dependencies: `npm install`
2. Create `.env.local` from `.env.example` with your Supabase project URL + anon key.
3. Run `supabase/schema.sql` in the Supabase Dashboard → SQL Editor. This creates the `charts` table, `updated_at` trigger, and all RLS policies.
4. `npm run dev` and open http://localhost:3000

## Chart syntax (summary)

| Input | Meaning |
| --- | --- |
| `I`, `iv`, `V` | Scale-degree chord; uppercase = major base, lowercase = minor |
| `IIdim`, `vii°`, `iii+` | Qualities: `dim`, `°`, `ø`, `aug`, `+`, `sus2`, `sus4`, `maj`, `m` |
| `Imaj7b9`, `13#11`, `7alt`, `9b5`, `add9` | Arbitrary extension/alteration strings pass through verbatim |
| `I/iii`, `V/vii` | Slash chords — both chord and bass are Roman numerals and transpose |
| `Cmaj7`, `Bb/D` | Absolute chords also accepted; transposed by interval from the chart's original key |
| `My song[I] has not[iv]` | Inline lyric brackets — a chord applies to the word BEFORE the bracket and renders above it |
| `\| I \| vi \| IIdim \| IV \|` | Grid bars — chords within two delimiters form one bar |
| `**bold**`, `*italic*`, `***both***` | Text formatting in lyrics, labels and free text |

The 12 target keys: C (neutral), F Bb Eb Ab Db (flats), G D A E B F# (sharps). Output spelling always follows the target key's accidental convention.

## Scripts

- `npm run dev` — dev server
- `npm run build` / `npm start` — production
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check across all files
- `npm test` — music engine unit tests

## Deployment

- Repo: `github.com:PelleDelorean/transposer` (SSH)
- Hosting: Vercel (Hobby). Import the repo, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in project env vars, deploy. Add `https://<project>.vercel.app/auth/callback` to the Supabase redirect allow-list.

## API keys

Supabase is replacing the legacy JWT-based keys (anon / service_role) with
new-format opaque keys:

| New key | Replaces | Exposure |
| --- | --- | --- |
| `sb_publishable_...` | anon key | Safe for browsers, `NEXT_PUBLIC_` |
| `sb_secret_...` | service_role key | Server-only, never in the browser |

This app only needs the publishable key (all DB access goes through RLS via
the user's session). Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the code
falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` if your project still uses
legacy keys. The secret key is not used anywhere in this app.
