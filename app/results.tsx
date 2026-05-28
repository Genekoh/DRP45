import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SpaceCard from "../components/SpaceCard";
import { useCrowdness } from "../context/CrowdnessContext";

export const ALL_SPACES = [
  {
    id: "1",
    name: "Space 1",
    openingHrs: "7:00 - 22:00",
    safetyLevel: 4,
    features: ["Quiet zone", "Free WiFi", "Charging ports"],
    tags: ["quiet", "charging", "free"],
    distance: 0.3,
  },
  {
    id: "2",
    name: "Space 2",
    openingHrs: "8:00 - 20:00",
    safetyLevel: 3,
    features: ["AC", "Food available", "Laptop friendly"],
    tags: ["AC", "food available", "laptop"],
    distance: 0.8,
  },
  {
    id: "3",
    name: "Space 3",
    openingHrs: "9:00 - 18:00",
    safetyLevel: 5,
    features: ["Laptop friendly", "Free", "Quiet"],
    tags: ["laptop", "free", "quiet"],
    distance: 1.2,
  },
];

type SortOption = "Relevance" | "Distance";
type ViewMode = "List" | "Map";

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    query: string;
    groupSize: string;
    filters: string;
    startTime: string;
    endTime: string;
  }>();

  const { crowdnessMap } = useCrowdness();

  const activeFilters = params.filters
    ? params.filters.split(",").filter(Boolean)
    : [];
  const groupSize = parseInt(params.groupSize ?? "1", 10);

  const [viewMode, setViewMode] = useState<ViewMode>("List");
  const [sortBy, setSortBy] = useState<SortOption>("Relevance");

  const filteredSpaces = ALL_SPACES.filter((space) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.some((f) => space.tags.includes(f));
  });

  const sortedSpaces = [...filteredSpaces].sort((a, b) =>
    sortBy === "Distance" ? a.distance - b.distance : 0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
      </View>

      {(activeFilters.length > 0 || params.query) && (
        <View style={styles.summaryBox}>
          {params.query ? (
            <Text style={styles.summaryText}>🔍 &quot;{params.query}&quot;</Text>
          ) : null}
          <Text style={styles.summaryText}>
            👥 Group: {groupSize} · 🕐 {params.startTime} — {params.endTime}
          </Text>
          {activeFilters.length > 0 && (
            <Text style={styles.summaryText}>🏷️ {activeFilters.join(", ")}</Text>
          )}
        </View>
      )}

      <View style={styles.toggleRow}>
        {(["List", "Map"] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by :</Text>
        <TouchableOpacity
          onPress={() =>
            setSortBy((prev) => (prev === "Distance" ? "Relevance" : "Distance"))
          }
        >
          <Text style={styles.sortValue}>{sortBy} ▾</Text>
        </TouchableOpacity>
        <Text style={styles.resultCount}>
          {sortedSpaces.length} space{sortedSpaces.length !== 1 ? "s" : ""} found
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {viewMode === "List" ? (
          sortedSpaces.length > 0 ? (
            sortedSpaces.map((space) => (
              <TouchableOpacity
                key={space.id}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({ pathname: "/space/[id]", params: { id: space.id } })
                }
              >
                <SpaceCard
                  {...space}
                  crowdness={crowdnessMap[space.id] ?? "lots"}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No spaces found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or search query
              </Text>
              <TouchableOpacity style={styles.backToSearchBtn} onPress={() => router.back()}>
                <Text style={styles.backToSearchText}>← Back to Search</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>🗺️ Map View</Text>
            <Text style={styles.mapSubText}>Showing {sortedSpaces.length} spaces nearby</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 60, paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  summaryBox: {
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    marginBottom: 14, borderWidth: 1, borderColor: "#e0e0e0", gap: 4,
  },
  summaryText: { fontSize: 13, color: "#555" },
  toggleRow: {
    flexDirection: "row", borderWidth: 1.5, borderColor: "#555",
    borderRadius: 10, overflow: "hidden", alignSelf: "center", marginBottom: 16,
  },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 28, backgroundColor: "#fff" },
  toggleBtnActive: { backgroundColor: "#333" },
  toggleText: { fontSize: 14, color: "#333", fontWeight: "600" },
  toggleTextActive: { color: "#fff" },
  sortRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 6 },
  sortLabel: { fontSize: 14, color: "#444" },
  sortValue: { fontSize: 14, fontWeight: "700", color: "#111" },
  resultCount: { marginLeft: "auto", fontSize: 13, color: "#888" },
  list: { paddingBottom: 40 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  emptySubtitle: { fontSize: 14, color: "#888", textAlign: "center" },
  backToSearchBtn: {
    marginTop: 16, borderWidth: 1.5, borderColor: "#333",
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24,
  },
  backToSearchText: { fontSize: 14, fontWeight: "600", color: "#333" },
  mapPlaceholder: {
    height: 400, justifyContent: "center", alignItems: "center",
    backgroundColor: "#e0e0e0", borderRadius: 12, gap: 8,
  },
  mapText: { fontSize: 20, fontWeight: "700", color: "#555" },
  mapSubText: { fontSize: 14, color: "#777" },
});
