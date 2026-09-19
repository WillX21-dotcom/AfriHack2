# Architecture

```
Client PWA (apps/client)         Royal Desk (apps/dashboard)
        \                               /
         \-- packages/shared (auth, html, format, types) --/
                        |
              packages/supabase (client, dataStore, helpers)
                        |
        Supabase: Auth · Postgres + RLS + RPC · Storage · Realtime
```

* One React shell (`src/App.tsx`) mounts either the client app or the Royal Desk according to the **role stored
  in the database** (`profiles.role`). The cached session in `localStorage` is only used for first paint; it is
  re-verified against Supabase on every load.
* Both apps render from the same `dataStore`, which is rebuilt from Supabase after every change and whenever
  Realtime reports one. This is what keeps the client and the adviser looking at identical records.
* Screens render HTML strings. Every template uses the `html` tag from `packages/shared/src/html.ts`, which
  escapes interpolated values by default. Never build markup with plain template strings: request titles,
  messages and names are typed by other users.
* Live refreshes are held back while a user is typing so a form is never wiped by an incoming update.

## Repository layout

| Path | Contents |
| --- | --- |
| `apps/client` | Mobile-first client portal |
| `apps/dashboard` | Adviser / admin desk |
| `packages/shared` | Auth, `html` escaping, formatters, types, constants (claim stages, request types) |
| `packages/supabase` | Supabase client, `dataStore`, hydration, realtime, document helpers |
| `supabase/migrations` | Schema, RLS, functions, triggers, storage, realtime |
| `supabase/schema.sql` | Consolidated schema for new projects |
