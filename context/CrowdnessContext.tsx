import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchAllCrowdness, updateCrowdness, CrowdnessLevel } from "../lib/supabase";

interface CrowdnessContextType {
  crowdnessMap: Record<string, CrowdnessLevel>;
  setCrowdness: (id: string, level: CrowdnessLevel) => Promise<void>;
  loading: boolean;
}

const CrowdnessContext = createContext<CrowdnessContextType>({
  crowdnessMap: {},
  setCrowdness: async () => {},
  loading: true,
});

export function CrowdnessProvider({ children }: { children: React.ReactNode }) {
  const [crowdnessMap, setCrowdnessMap] = useState<Record<string, CrowdnessLevel>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllCrowdness()
      .then((map) => setCrowdnessMap(map))
      .finally(() => setLoading(false));
  }, []);

  const setCrowdness = async (id: string, level: CrowdnessLevel) => {
    // Optimistic update — update UI immediately
    setCrowdnessMap((prev) => ({ ...prev, [id]: level }));
    // Then persist to Supabase
    await updateCrowdness(id, level);
  };

  return (
    <CrowdnessContext.Provider value={{ crowdnessMap, setCrowdness, loading }}>
      {children}
    </CrowdnessContext.Provider>
  );
}

export function useCrowdness() {
  return useContext(CrowdnessContext);
}

export type { CrowdnessLevel };
