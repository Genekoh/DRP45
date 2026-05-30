import axios from "axios";

const GOOGLE_GEOCODING_API_KEY = "AIzaSyCiRWefTmlKVfyy8ql98nAgk_ldEN55fTk";

interface GeocodeResult {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Reverse geocode coordinates to get Google Place ID
 * This helps us find the Place ID for study spaces using their lat/long
 */
export async function reverseGeocodeToPlaceId(
  latitude: number,
  longitude: number
): Promise<GeocodeResult | null> {
  try {
    const res = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_GEOCODING_API_KEY,
        },
      }
    );

    if (res.data.results.length === 0) {
      return null;
    }

    const result = res.data.results[0];
    const placeId = result.place_id;
    const name = result.formatted_address;
    const [lat, lng] = [result.geometry.location.lat, result.geometry.location.lng];

    return {
      placeId,
      name,
      latitude: lat,
      longitude: lng,
      address: name,
    };
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return null;
  }
}

/**
 * Find nearby places by name and coordinates
 * More accurate for finding specific venues like "Starbucks South Kensington"
 */
export async function findNearbyPlaceByName(
  latitude: number,
  longitude: number,
  name: string,
  radius: number = 500 // Search within 500m
): Promise<GeocodeResult | null> {
  try {
    const res = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${latitude},${longitude}`,
          radius,
          keyword: name,
          key: GOOGLE_GEOCODING_API_KEY,
        },
      }
    );

    if (res.data.results.length === 0) {
      return null;
    }

    // Sort by relevance (closest match first)
    const result = res.data.results[0];

    return {
      placeId: result.place_id,
      name: result.name,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      address: result.vicinity || result.formatted_address || "",
    };
  } catch (error) {
    console.error("Error finding nearby place:", error);
    return null;
  }
}

/**
 * Text search for a place
 * Useful for finding places by exact name
 */
export async function textSearchPlace(
  query: string
): Promise<GeocodeResult | null> {
  try {
    const res = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json`,
      {
        params: {
          query,
          key: GOOGLE_GEOCODING_API_KEY,
        },
      }
    );

    if (res.data.results.length === 0) {
      return null;
    }

    const result = res.data.results[0];

    return {
      placeId: result.place_id,
      name: result.name,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      address: result.formatted_address || "",
    };
  } catch (error) {
    console.error("Error in text search:", error);
    return null;
  }
}
