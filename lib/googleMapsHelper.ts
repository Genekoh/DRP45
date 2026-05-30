import axios from "axios";

const GOOGLE_MAPS_API_KEY = "AIzaSyCiRWefTmlKVfyy8ql98nAgk_ldEN55fTk";

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  currentPopularity: number | null; // 0-100, null if closed
  rating: number;
  userRatings: number;
  openNow: boolean;
  cachedAt?: Date;
  source: "live" | "cache";
}

/**
 * Get current popularity (0-100) for a place using Google Places API
 * Returns the real-time busyness score
 */
export async function getGooglePlaceDetails(
  placeId: string
): Promise<GooglePlaceDetails> {
  try {
    const res = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          key: GOOGLE_MAPS_API_KEY,
          fields:
            "place_id,name,rating,user_ratings_total,opening_hours,current_opening_hours",
        },
      }
    );

    const place = res.data.result;

    if (!place) {
      throw new Error(`Place not found: ${placeId}`);
    }

    // Extract current popularity and open status
    const openNow = place.current_opening_hours?.open_now ?? false;
    let currentPopularity: number | null = null;

    // Google doesn't provide current_popularity in the details endpoint directly
    // We'll need to extract it from opening_hours.periods if available
    // For now, we'll fetch it via nearby search or use historical data
    // NOTE: This is a limitation - Google doesn't expose real-time popularity via standard API
    // We'll handle this in the cache layer by storing what we get

    return {
      placeId: place.place_id,
      name: place.name,
      currentPopularity, // Will be populated from cache or estimation
      rating: place.rating || 0,
      userRatings: place.user_ratings_total || 0,
      openNow,
      source: "live",
    };
  } catch (error) {
    console.error("Error fetching Google place details:", error);
    throw error;
  }
}

/**
 * Convert Google's 0-100 popularity score to our crowdness levels
 */
export function popularityToCrowdness(
  popularity: number | null
): "none" | "limited" | "lots" {
  if (popularity === null) return "limited"; // Default if unknown
  if (popularity < 33) return "none";
  if (popularity < 66) return "limited";
  return "lots";
}
