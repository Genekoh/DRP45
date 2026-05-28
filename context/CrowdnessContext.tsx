import React, { createContext, useContext, useState } from "react";

export type CrowdnessLevel = "lots" | "limited" | "none";

interface CrowdnessContextType {
  crowdnessMap: Record<string, CrowdnessLevel>;
  setCrowdness: (id: string, level: CrowdnessLevel) => void;
}

const CrowdnessContext = createContext<CrowdnessContextType>({
  crowdnessMap: {},
  setCrowdness: () => {},
});

export function CrowdnessProvider({ children }: { children: React.ReactNode }) {
  const [crowdnessMap, setCrowdnessMap] = useState<Record<string, CrowdnessLevel>>({
    "1": "lots",
    "2": "lots",
    "3": "lots",
  });

  const setCrowdness = (id: string, level: CrowdnessLevel) => {
    setCrowdnessMap((prev) => ({ ...prev, [id]: level }));
  };

  return (
    <CrowdnessContext.Provider value={{ crowdnessMap, setCrowdness }}>
      {children}
    </CrowdnessContext.Provider>
  );
}

export function useCrowdness() {
  return useContext(CrowdnessContext);
}
