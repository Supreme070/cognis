ALTER TABLE leads ADD COLUMN notified INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_leads_notified ON leads (notified);
