const SUPABASE_URL = "https://nsbunkmqwfslqvyikxgq.supabase.co";
const SUPABASE_KEY = "sb_publishable_xLSFuqCDX7xj0UUWiILtww_KKlH4FkZ";

const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

export type CrowdnessLevel = "lots" | "limited" | "none";

// Fetch crowdness for all spaces
export async function fetchAllCrowdness(): Promise<Record<string, CrowdnessLevel>> {
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

// Update crowdness for a specific space (upsert)
export async function updateCrowdness(spaceId: string, level: CrowdnessLevel): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/crowdness`, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify({ space_id: spaceId, level, updated_at: new Date().toISOString() }),
  });
}
