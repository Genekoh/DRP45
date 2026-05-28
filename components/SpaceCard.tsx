import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type CrowdnessLevel = "lots" | "limited" | "none";

interface SpaceCardProps {
  name: string;
  openingHrs: string;
  safetyLevel: number;
  features: string[];
  crowdness: CrowdnessLevel;
}

const CROWDNESS_LABEL: Record<CrowdnessLevel, string> = {
  lots: "Lots of seats",
  limited: "Limited seats",
  none: "No seats",
};

const CROWDNESS_COLOR: Record<CrowdnessLevel, string> = {
  lots: "#4caf50",
  limited: "#ff9800",
  none: "#f44336",
};

export default function SpaceCard({
  name,
  openingHrs,
  safetyLevel,
  features,
  crowdness,
}: SpaceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>Opening hrs: {openingHrs}</Text>
        <Text style={styles.detail}>
          Safety level:{" "}
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={{ color: i < safetyLevel ? "#f5a623" : "#ccc" }}>
              ●
            </Text>
          ))}
        </Text>
        {features.map((f, i) => (
          <Text key={i} style={styles.feature}>
            • {f}
          </Text>
        ))}
        <View style={[styles.crowdnessBadge, { backgroundColor: CROWDNESS_COLOR[crowdness] + "22" }]}>
          <View style={[styles.crowdnessDot, { backgroundColor: CROWDNESS_COLOR[crowdness] }]} />
          <Text style={[styles.crowdnessText, { color: CROWDNESS_COLOR[crowdness] }]}>
            {CROWDNESS_LABEL[crowdness]}
          </Text>
        </View>
      </View>

      {/* Placeholder image area */}
      <View style={styles.imagePlaceholder}>
        <Text style={styles.picsLabel}>pics</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  info: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111",
  },
  detail: {
    fontSize: 12,
    color: "#444",
    marginBottom: 2,
  },
  feature: {
    fontSize: 12,
    color: "#555",
  },
  crowdnessBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  crowdnessDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  crowdnessText: {
    fontSize: 12,
    fontWeight: "600",
  },
  imagePlaceholder: {
    width: 80,
    backgroundColor: "#e8e8e8",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  picsLabel: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
});
