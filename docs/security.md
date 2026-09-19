# Royal Square Financial Security & POPIA Compliance

## Security Architecture
- **Row Level Security (RLS)**: Enforced on all tables. Clients can only access records matching their `auth.uid()`. Advisers/compliance can access client portfolios with audit trails.
- **Storage Protection**: The `client-documents` bucket is strictly private. Files are segmented under `${clientId}/${filename}`.
- **Principle of Least Privilege**: Client profiles cannot alter their role, account status, or internal adviser notes.
- **POPIA Compliance**: South African Protection of Personal Information Act principles enforced:
  - Data minimization.
  - Transparent audit trail via `audit_logs`.
  - Secure document disposal and restricted access to identity numbers.
