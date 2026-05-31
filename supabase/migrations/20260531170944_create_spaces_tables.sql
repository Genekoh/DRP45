-- Create spaces table to store study spaces with Google Place IDs
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  opening_hrs TEXT,
  safety_level INTEGER,
  features TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  google_place_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create cache table for Google Places API responses (2-hour TTL)
CREATE TABLE IF NOT EXISTS place_cache (
  id SERIAL PRIMARY KEY,
  google_place_id TEXT UNIQUE NOT NULL,
  current_popularity INTEGER,
  place_name TEXT,
  rating NUMERIC,
  user_ratings_total INTEGER,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '2 hours',
  FOREIGN KEY (google_place_id) REFERENCES spaces(google_place_id) ON DELETE CASCADE
);

-- Create index for cache expiry queries
CREATE INDEX IF NOT EXISTS idx_place_cache_expires ON place_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_place_cache_google_id ON place_cache(google_place_id);
