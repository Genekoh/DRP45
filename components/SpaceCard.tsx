import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SpaceCardProps {
  name: string;
  openingHrs: string;
  safetyLevel: number;
  features: string[];
}

export default function SpaceCard({
  name,
  openingHrs,
  safetyLevel,
  features,
}: SpaceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>Opening hrs: {openingHrs}</Text>
        <Text style={styles.detail}>
          Safety level:{" "}
          {Array.from({ length: 5 }).map((_, i) => (
            <Text
              key={i}
              style={{ color: i < safetyLevel ? "#f5a623" : "#ccc" }}
            >
              ●
            </Text>
          ))}
        </Text>
        {features.map((f, i) => (
          <Text key={i} style={styles.feature}>
            • {f}
          </Text>
        ))}
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
