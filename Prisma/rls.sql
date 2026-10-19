-- =============================================================
-- Optional defense-in-depth: native Postgres Row Level Security.
-- The app already enforces per-user ownership in lib/authz.ts on
-- every query. This file adds a second, DB-level barrier so that
-- even a bug in application code, a leaked service-role credential
-- misuse, or a future service querying the DB directly cannot read
-- or write another user's rows.
--
-- Run this after `prisma migrate deploy`. Prisma's own pooled
-- connection currently runs as the table owner (bypasses RLS by
-- default), so to make this bite you'd create a separate, lower-
-- privilege DB role for the app and set
--   SET ROLE app_user;  -- per-request, with app.current_user_id set
-- This file is provided as the hardening path for when you're
-- ready to split that out; app-layer checks are authoritative today.
-- =============================================================

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Session variable the app sets per-request: SELECT set_config('app.current_user_id', $1, true);
CREATE POLICY registrations_owner_select ON registrations
  FOR SELECT
  USING (
    "userId" = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) = 'ADMIN'
  );

CREATE POLICY registrations_owner_write ON registrations
  FOR INSERT
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY registrations_owner_update ON registrations
  FOR UPDATE
  USING (
    "userId" = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) = 'ADMIN'
  );

CREATE POLICY players_via_registration ON players
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = players."registrationId"
        AND (
          r."userId" = current_setting('app.current_user_id', true)
          OR current_setting('app.current_user_role', true) = 'ADMIN'
        )
    )
  );

CREATE POLICY payments_via_registration ON payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = payments."registrationId"
        AND (
          r."userId" = current_setting('app.current_user_id', true)
          OR current_setting('app.current_user_role', true) = 'ADMIN'
        )
    )
  );
