import React, { createContext, useContext, useState, useEffect } from "react";
import {
  fetchAllCrowdness,
  updateCrowdness,
  CrowdnessLevel,
  logCrowdnessHistory,
  fetchAllSpaces,
  Space,
  getCachedPlaceData,
  cacheGooglePlaceData,
} from "../lib/supabase";
import {
  getGooglePlaceDetails,
  popularityToCrowdness,
} from "../lib/googleMapsHelper";

export interface CrowdnessPrediction {
  level: CrowdnessLevel;
  popularity: number | null; // 0-100 from Google, null if not available
  confidence: number; // 0-100
  source: "google_live" | "google_cache" | "user_reports" | "not_enough_data";
  reasoning: string;
}

interface CrowdnessContextType {
  spaces: Space[];
  crowdnessMap: Record<string, CrowdnessLevel>;
  predictionsMap: Record<string, CrowdnessPrediction>;
  setCrowdness: (id: string, level: CrowdnessLevel) => Promise<void>;
  getPredictionForSpace: (spaceId: string) => Promise<CrowdnessPrediction>;
  loading: boolean;
  error: string | null;
}

const CrowdnessContext = createContext<CrowdnessContextType>({
  spaces: [],
  crowdnessMap: {},
  predictionsMap: {},
  setCrowdness: async () => {},
  getPredictionForSpace: async () => ({
    level: "limited",
    popularity: null,
    confidence: 0,
    source: "not_enough_data",
    reasoning: "Not enough data",
  }),
  loading: true,
  error: null,
});

export function CrowdnessProvider({ children }: { children: React.ReactNode }) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [crowdnessMap, setCrowdnessMap] = useState<Record<string, CrowdnessLevel>>(
    {}
  );
  const [predictionsMap, setPredictionsMap] = useState<
    Record<string, CrowdnessPrediction>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize: fetch spaces and crowdness on mount
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all spaces from Supabase
        const allSpaces = await fetchAllSpaces();
        setSpaces(allSpaces);

        // Fetch current crowdness reports
        const crowdness = await fetchAllCrowdness();
        setCrowdnessMap(crowdness);
      } catch (err) {
        console.error("Error initializing crowdness context:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize context"
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  const setCrowdness = async (spaceId: string, level: CrowdnessLevel) => {
    // Optimistic update
    setCrowdnessMap((prev) => ({ ...prev, [spaceId]: level }));
    
    try {
      // Persist to Supabase
      await updateCrowdness(spaceId, level);
      await logCrowdnessHistory(spaceId, level);
      
      // Clear prediction cache for this space so it's refreshed
      setPredictionsMap((prev) => {
        const newMap = { ...prev };
        delete newMap[spaceId];
        return newMap;
      });
    } catch (err) {
      console.error("Error updating crowdness:", err);
      // Revert optimistic update on error
      setCrowdnessMap((prev) => {
        const newMap = { ...prev };
        delete newMap[spaceId];
        return newMap;
      });
    }
  };

  const getPredictionForSpace = async (
    spaceId: string
  ): Promise<CrowdnessPrediction> => {
    // Return cached prediction if available
    if (predictionsMap[spaceId]) {
      return predictionsMap[spaceId];
    }

    try {
      const space = spaces.find((s) => s.id === spaceId);
      if (!space) {
        throw new Error(`Space not found: ${spaceId}`);
      }

      if (!space.google_place_id) {
        // No Google Place ID - fall back to user reports
        const userReport = crowdnessMap[spaceId];
        if (userReport) {
          const prediction: CrowdnessPrediction = {
            level: userReport,
            popularity: null,
            confidence: 50,
            source: "user_reports",
            reasoning: "Based on user reports",
          };
          setPredictionsMap((prev) => ({ ...prev, [spaceId]: prediction }));
          return prediction;
        }

        // No data available
        const noPrediction: CrowdnessPrediction = {
          level: "limited",
          popularity: null,
          confidence: 0,
          source: "not_enough_data",
          reasoning: "No Google Place ID or user reports available",
        };
        setPredictionsMap((prev) => ({ ...prev, [spaceId]: noPrediction }));
        return noPrediction;
      }

      // Try to get cached data first
      let cachedData = await getCachedPlaceData(space.google_place_id);

      if (cachedData) {
        // Cache hit!
        const prediction: CrowdnessPrediction = {
          level: popularityToCrowdness(cachedData.current_popularity),
          popularity: cachedData.current_popularity,
          confidence: 85, // Cache is recent (< 2 hours)
          source: "google_cache",
          reasoning: `Current popularity: ${cachedData.current_popularity}% (cached 2 hours)`,
        };
        setPredictionsMap((prev) => ({ ...prev, [spaceId]: prediction }));
        return prediction;
      }

      // Cache miss - fetch from Google
      const googlePlace = await getGooglePlaceDetails(space.google_place_id);

      // Since Google Places API doesn't directly provide current_popularity via details endpoint,
      // we'll use a placeholder here. In production, you'd need to use nearby search or other methods.
      // For now, we'll estimate based on opening status
      const estimatedPopularity = googlePlace.openNow ? 50 : null; // Placeholder

      // Cache the result
      if (estimatedPopularity !== null) {
        await cacheGooglePlaceData({
          google_place_id: space.google_place_id,
          current_popularity: estimatedPopularity,
          place_name: googlePlace.name,
          rating: googlePlace.rating,
          user_ratings_total: googlePlace.userRatings,
        });
      }

      const prediction: CrowdnessPrediction = {
        level: popularityToCrowdness(estimatedPopularity),
        popularity: estimatedPopularity,
        confidence: 65, // Live data
        source: "google_live",
        reasoning: estimatedPopularity
          ? `Current popularity: ${estimatedPopularity}%`
          : `Place is ${googlePlace.openNow ? "open" : "closed"}`,
      };

      setPredictionsMap((prev) => ({ ...prev, [spaceId]: prediction }));
      return prediction;
    } catch (err) {
      console.error(`Error getting prediction for space ${spaceId}:`, err);

      // Fallback to user reports if available
      const userReport = crowdnessMap[spaceId];
      if (userReport) {
        const prediction: CrowdnessPrediction = {
          level: userReport,
          popularity: null,
          confidence: 40,
          source: "user_reports",
          reasoning: "Based on user reports (Google data unavailable)",
        };
        setPredictionsMap((prev) => ({ ...prev, [spaceId]: prediction }));
        return prediction;
      }

      // Total fallback
      const errorPrediction: CrowdnessPrediction = {
        level: "limited",
        popularity: null,
        confidence: 0,
        source: "not_enough_data",
        reasoning: "Unable to fetch prediction data",
      };
      setPredictionsMap((prev) => ({ ...prev, [spaceId]: errorPrediction }));
      return errorPrediction;
    }
  };

  return (
    <CrowdnessContext.Provider
      value={{
        spaces,
        crowdnessMap,
        predictionsMap,
        setCrowdness,
        getPredictionForSpace,
        loading,
        error,
      }}
    >
      {children}
    </CrowdnessContext.Provider>
  );
}

export function useCrowdness() {
  return useContext(CrowdnessContext);
}

export type { CrowdnessLevel, CrowdnessPrediction };
