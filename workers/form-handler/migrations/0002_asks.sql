CREATE TABLE IF NOT EXISTS asks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sid TEXT,
  page TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  sources TEXT,
  model TEXT,
  path TEXT,
  latency_ms INTEGER,
  escalated INTEGER NOT NULL DEFAULT 0,
  handed_off INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_asks_created_at ON asks (created_at);
CREATE INDEX IF NOT EXISTS idx_asks_sid ON asks (sid);
