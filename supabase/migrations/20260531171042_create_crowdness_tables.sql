CREATE TABLE IF NOT EXISTS crowdness (
  space_id TEXT PRIMARY KEY REFERENCES spaces(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('lots', 'limited', 'none')),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crowdness_history (
  id SERIAL PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('lots', 'limited', 'none')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crowdness_history_space_id ON crowdness_history(space_id);
CREATE INDEX IF NOT EXISTS idx_crowdness_history_created_at ON crowdness_history(created_at);
