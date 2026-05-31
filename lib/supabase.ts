const SUPABASE_URL = "https://nsbunkmqwfslqvyikxgq.supabase.co";
const SUPABASE_KEY = "sb_publishable_xLSFuqCDX7xj0UUWiILtww_KKlH4FkZ";

const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

export type CrowdnessLevel = "lots" | "limited" | "none";

export interface Space {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  opening_hrs: string;
  safety_level: number;
  features: string[];
  tags: string[];
  google_place_id?: string;
}

export interface PlaceCache {
  google_place_id: string;
  current_popularity: number | null;
  place_name: string;
  rating: number;
  user_ratings_total: number;
  cached_at: string;
  expires_at: string;
}

// ============ SPACES TABLE ============

/**
 * Fetch all spaces from Supabase
 */
export async function fetchAllSpaces(): Promise<Space[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/spaces`, {
    headers: HEADERS,
  });

  if (!res.ok) {
    console.error("Error fetching spaces:", res.statusText);
    return [];
  }

  return await res.json();
}

/**
 * Fetch a single space by ID
 */
export async function fetchSpaceById(spaceId: string): Promise<Space | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/spaces?id=eq.${spaceId}&limit=1`,
    {
      headers: HEADERS,
    }
  );

  if (!res.ok) {
    return null;
  }

  const spaces = await res.json();
  return spaces[0] || null;
}

/**
 * Update or create a space with Google Place ID
 */
export async function upsertSpace(space: Space): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/spaces`, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(space),
  });
  if (!res.ok) {
    throw new Error(`upsertSpace failed: ${res.statusText}`);
  }
}

// ============ CROWDNESS TABLE ============

/**
 * Fetch crowdness for all spaces
 */
export async function fetchAllCrowdness(): Promise<
  Record<string, CrowdnessLevel>
> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/crowdness?select=space_id,level`, {
    headers: HEADERS,
  });
  const data: { space_id: string; level: CrowdnessLevel }[] = await res.json();
  const map: Record<string, CrowdnessLevel> = {};
  for (const row of data) {
    map[row.space_id] = row.level;
  }
  return map;
}

/**
 * Update crowdness for a specific space (upsert)
 */
export async function updateCrowdness(
  spaceId: string,
  level: CrowdnessLevel
): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/crowdness`, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      space_id: spaceId,
      level,
      updated_at: new Date().toISOString(),
    }),
  });
}

/**
 * Fetch historical crowdness data for a space (last 7 days)
 */
export async function fetchHistoricalCrowdness(
  spaceId: string,
  days: number = 7
): Promise<{ created_at: string; level: CrowdnessLevel }[]> {
  const sinceDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crowdness_history?space_id=eq.${spaceId}&created_at=gte.${sinceDate}&order=created_at.desc`,
    { headers: HEADERS }
  );

  if (!res.ok) {
    return [];
  }

  return await res.json();
}

/**
 * Log crowdness to history
 */
export async function logCrowdnessHistory(
  spaceId: string,
  level: CrowdnessLevel,
  timestamp?: Date
): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/crowdness_history`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      space_id: spaceId,
      level,
      created_at: (timestamp || new Date()).toISOString(),
    }),
  });
}

// ============ CACHE TABLE ============

/**
 * Get cached Google place data (if not expired)
 */
export async function getCachedPlaceData(
  googlePlaceId: string
): Promise<PlaceCache | null> {
  const now = new Date().toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/place_cache?google_place_id=eq.${googlePlaceId}&expires_at=gt.${now}&limit=1`,
    { headers: HEADERS }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data[0] || null;
}

/**
 * Cache Google place data (2-hour TTL)
 */
export async function cacheGooglePlaceData(
  cache: Omit<PlaceCache, "cached_at" | "expires_at">
): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/place_cache`, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      ...cache,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    }),
  });
}
