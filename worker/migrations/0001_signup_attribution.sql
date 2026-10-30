-- Acquisition attribution for the CamBridge waitlist (D1 database: cambridge_signups).
-- This project has no migration runner; apply once, by hand, BEFORE deploying the worker:
--   cd worker && npx wrangler d1 execute cambridge_signups --remote --file=migrations/0001_signup_attribution.sql
-- ALTER TABLE ADD COLUMN is not idempotent: running it twice fails on "duplicate column name".
-- First touch (from localStorage acq_ft), written on INSERT only. Never raw referrer URLs,
-- IPs, click-id values or user agents (user_agent / referer are older columns).
ALTER TABLE signups ADD COLUMN acq_source TEXT;
ALTER TABLE signups ADD COLUMN acq_medium TEXT;
ALTER TABLE signups ADD COLUMN acq_campaign TEXT;
ALTER TABLE signups ADD COLUMN acq_content TEXT;
ALTER TABLE signups ADD COLUMN acq_term TEXT;
ALTER TABLE signups ADD COLUMN acq_referrer_host TEXT;
ALTER TABLE signups ADD COLUMN acq_landing_path TEXT;
ALTER TABLE signups ADD COLUMN acq_click_id_type TEXT;
ALTER TABLE signups ADD COLUMN acq_captured_at TEXT;
-- Last touch (a later visit that carried UTM parameters, from localStorage acq_lt).
ALTER TABLE signups ADD COLUMN acq_lt_source TEXT;
ALTER TABLE signups ADD COLUMN acq_lt_medium TEXT;
ALTER TABLE signups ADD COLUMN acq_lt_campaign TEXT;
ALTER TABLE signups ADD COLUMN acq_lt_content TEXT;
