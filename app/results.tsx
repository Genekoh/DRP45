import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import SpaceCard from "../components/SpaceCard";
import { useCrowdness } from "../context/CrowdnessContext";

export const ALL_SPACES = [
  {
    id: "1",
    name: "Starbucks",
    address: "South Kensington, SW7 4PL",
    openingHrs: "6:30 - 21:00",
    safetyLevel: 3,
    features: ["Free WiFi", "Charging ports", "Food available"],
    tags: ["charging", "free", "food available"],
    distance: 0.3,
    latitude: 51.4941,
    longitude: -0.1738,
  },
  {
    id: "2",
    name: "Kensington Central Library",
    address: "Phillimore Walk, W8 7RX",
    openingHrs: "9:00 - 20:00",
    safetyLevel: 5,
    features: ["Quiet zone", "Free", "Laptop friendly"],
    tags: ["quiet", "free", "laptop"],
    distance: 0.8,
    latitude: 51.5012,
    longitude: -0.1932,
  },
  {
    id: "3",
    name: "Paris Baguette",
    address: "Kensington High St, W8 6SU",
    openingHrs: "7:30 - 21:00",
    safetyLevel: 3,
    features: ["Food available", "AC", "Laptop friendly"],
    tags: ["food available", "AC", "laptop"],
    distance: 1.0,
    latitude: 51.5008,
    longitude: -0.1918,
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

  const { crowdnessMap, loading } = useCrowdness();

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

  const CROWDNESS_COLOR: Record<string, string> = {
    lots: "#4caf50",
    limited: "#ff9800",
    none: "#f44336",
  };

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

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Fetching live data...</Text>
        </View>
      ) : viewMode === "Map" ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 51.4980,
            longitude: -0.1840,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {sortedSpaces.map((space) => (
            <Marker
              key={space.id}
              coordinate={{ latitude: space.latitude, longitude: space.longitude }}
              pinColor={CROWDNESS_COLOR[crowdnessMap[space.id] ?? "lots"]}
            >
              <Callout onPress={() => router.push({ pathname: "/space/[id]", params: { id: space.id } })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{space.name}</Text>
                  <Text style={styles.calloutSub}>{space.address}</Text>
                  <Text style={styles.calloutHrs}>{space.openingHrs}</Text>
                  <Text style={styles.calloutLink}>Tap to view details →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {sortedSpaces.length > 0 ? (
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
          )}
        </ScrollView>
      )}
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
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#888" },
  map: { flex: 1, borderRadius: 12, overflow: "hidden" },
  callout: { width: 200, padding: 8 },
  calloutTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 2 },
  calloutSub: { fontSize: 12, color: "#666", marginBottom: 2 },
  calloutHrs: { fontSize: 12, color: "#888", marginBottom: 4 },
  calloutLink: { fontSize: 12, color: "#007AFF", fontWeight: "600" },
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
});
