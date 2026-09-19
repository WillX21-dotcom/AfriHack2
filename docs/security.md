# Security

* **Roles are server-side.** `profiles.role` is authoritative. Sign-up metadata, e-mail addresses and URLs
  never grant a role; triggers block non-admins from editing `role`, `is_active` and `email`.
  Only an admin can promote users (`admin_set_user_role`); admins cannot demote themselves.
* **Row Level Security everywhere**, with `anon` locked out. See [database.md](database.md).
* **No trusted client code.** The dashboard and client apps only ever hold the anon key and the user's JWT.
  Editing `localStorage` cannot elevate access: the cached session is re-derived from the database on load,
  and RLS decides what data is returned regardless of what the UI shows.
* **Output escaping.** All rendering goes through `html` (auto-escape), preventing a client from injecting
  script into an adviser's session through names, titles, messages or file names.
* **Private documents.** Bucket is private, folder-per-client with storage policies, 10 MB limit, MIME allow-list,
  and files are opened via 60-second signed URLs.
* **Tamper-resistant audit trail.** Written by `SECURITY DEFINER` triggers; staff can read but not edit or
  delete; retained even if the client record is later deleted.
* **Passwords**: minimum 8 characters (`supabase/config.toml` for local; set the same in the hosted project's
  Auth settings).
* **Deactivation**: setting `is_active = false` blocks sign-in and data loading in the apps.

## Operational checklist

1. Push migrations 022-024 and create the first admin ([database.md](database.md)).
2. In Supabase Auth settings, decide on e-mail confirmation and set the minimum password length to 8.
3. Enable the `pg_cron` extension if you want hourly reminder notifications (or call
   `process_due_reminders()` from a scheduled job with the service role).
4. Rotate any anon/service keys that were ever shared outside the team.
