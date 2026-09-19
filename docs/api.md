# API

There is no custom backend. Both apps talk to Supabase directly with the user's own JWT, so every request is
authorised by Row Level Security in Postgres.

* **Reads**: `supabase.from('<table>').select('*')`. The apps load everything the signed-in user may see
  (`packages/supabase/src/client.ts`, `hydrateRemoteState`) into an in-memory store that both UIs render from.
* **Writes**: business changes go through the SQL functions listed in [database.md](database.md) so that
  multi-row changes (request + workflow + task + notification) are atomic. Simple record edits (assets,
  goals, personal details, reminders) are ordinary table writes permitted by RLS.
* **Files**: `packages/supabase/src/helpers.ts` (`uploadClientDocument`, `openDocument`) uploads to the private
  `client-documents` bucket, registers the file in `documents`, and opens files through 60-second signed URLs.
* **Live updates**: Supabase Realtime `postgres_changes` on all business tables triggers a debounced reload.

## Environment

`.env` (never committed):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

If these are missing or still contain the placeholder values, the app shows a setup message instead of running.
The service-role key must never be used in the browser.
