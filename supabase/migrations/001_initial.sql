-- Red Metal — Initial Schema
-- Run this in the Supabase SQL editor after creating the project.
-- Prerequisites:
--   1. Run: CREATE EXTENSION IF NOT EXISTS moddatetime;
--   2. Disable RLS on all three tables (single-user personal tool)

-- ── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE companies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  ticker          text,
  exchange        text CHECK (exchange IN ('TSX-V', 'TSX', 'ASX', 'OTC', 'NYSE', 'Other')),
  type            text NOT NULL CHECK (type IN ('explorer', 'developer', 'producer')),
  jurisdiction    text NOT NULL CHECK (jurisdiction IN (
                    'BC Canada', 'Ontario Canada', 'Quebec Canada',
                    'Chile', 'Peru', 'Argentina', 'Ecuador',
                    'USA', 'Australia', 'DRC', 'Other'
                  )),
  website         text,
  market_cap_tier text CHECK (market_cap_tier IN ('micro', 'small', 'mid')),
  stage           text NOT NULL DEFAULT 'watchlist'
                    CHECK (stage IN ('watchlist', 'screening', 'active', 'passed', 'rejected')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE journal_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE checklist_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  criterion   text NOT NULL,
  checked     boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, criterion)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_companies_stage       ON companies(stage);
CREATE INDEX idx_journal_company_id    ON journal_entries(company_id);
CREATE INDEX idx_checklist_company_id  ON checklist_items(company_id);

-- ── moddatetime triggers (keep updated_at current) ───────────────────────────

CREATE TRIGGER handle_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_checklist_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- ── Checklist seeding trigger ─────────────────────────────────────────────────
-- Auto-inserts all 7 checklist rows (checked=false) when a company is created.
-- This ensures the Graduate button logic can simply COUNT WHERE checked=true.

CREATE OR REPLACE FUNCTION seed_checklist_items()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO checklist_items (company_id, criterion)
  VALUES
    (NEW.id, 'jurisdiction_tier'),
    (NEW.id, 'jurisdiction_no_blockers'),
    (NEW.id, 'resource_grade'),
    (NEW.id, 'resource_scale'),
    (NEW.id, 'management_track_record'),
    (NEW.id, 'management_insider_ownership'),
    (NEW.id, 'balance_sheet_runway');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seed_checklist_on_company_insert
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE PROCEDURE seed_checklist_items();

-- ── Disable RLS (single-user personal tool) ───────────────────────────────────

ALTER TABLE companies       DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items DISABLE ROW LEVEL SECURITY;

-- ── Smoke test (run manually to verify, then delete) ─────────────────────────
-- INSERT INTO companies (name, type, jurisdiction) VALUES ('Test Corp', 'explorer', 'BC Canada');
-- SELECT COUNT(*) FROM checklist_items WHERE company_id = (SELECT id FROM companies WHERE name = 'Test Corp');
-- -- Expected: 7
-- DELETE FROM companies WHERE name = 'Test Corp';
-- -- Cascade should remove checklist_items rows too
