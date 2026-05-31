import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import SpaceCard from "../components/SpaceCard";
import { CrowdnessPrediction, useCrowdness } from "../context/CrowdnessContext";

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

  const {
    spaces,
    crowdnessMap,
    predictionsMap,
    getPredictionForSpace,
    loading: contextLoading,
  } = useCrowdness();

  const activeFilters = params.filters
    ? params.filters.split(",").filter(Boolean)
    : [];
  const groupSize = parseInt(params.groupSize ?? "1", 10);

  const [viewMode, setViewMode] = useState<ViewMode>("List");
  const [sortBy, setSortBy] = useState<SortOption>("Relevance");
  const [loadingPredictions, setLoadingPredictions] = useState(true);

  // Calculate distance from first space as reference (hardcoded for demo)
  const referencePoint = { lat: 51.498, lng: -0.184 };

  const calculateDistance = (lat: number, lng: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat - referencePoint.lat) * Math.PI) / 180;
    const dLng = ((lng - referencePoint.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((referencePoint.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Filter and sort spaces
  const filteredSpaces = spaces.filter((space) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.some((f) => space.tags.includes(f));
  });

  const sortedSpaces = [...filteredSpaces]
    .map((space) => ({
      ...space,
      distance: calculateDistance(space.latitude, space.longitude),
    }))
    .sort((a, b) => (sortBy === "Distance" ? a.distance - b.distance : 0));

  // Load predictions for all visible spaces
  useEffect(() => {
    async function loadPredictions() {
      try {
        setLoadingPredictions(true);
        for (const space of sortedSpaces) {
          if (!predictionsMap[space.id]) {
            await getPredictionForSpace(space.id);
          }
        }
      } catch (err) {
        console.error("Error loading predictions:", err);
      } finally {
        setLoadingPredictions(false);
      }
    }

    if (sortedSpaces.length > 0) {
      loadPredictions();
    }
  }, [sortedSpaces]);

  const getCrowdnessColor = (prediction: CrowdnessPrediction | undefined) => {
    if (!prediction) return "#9e9e9e"; // Gray for loading
    switch (prediction.level) {
      case "none":
        return "#4caf50"; // Green
      case "limited":
        return "#ff9800"; // Orange
      case "lots":
        return "#f44336"; // Red
      default:
        return "#9e9e9e";
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "google_live":
        return "🔴 Live (Google)";
      case "google_cache":
        return "📊 Cached (Google)";
      case "user_reports":
        return "👥 User Reports";
      case "not_enough_data":
        return "❓ No Data";
      default:
        return source;
    }
  };

  const loading = contextLoading || loadingPredictions;

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
            <Text style={styles.summaryText}>
              🔍 &quot;{params.query}&quot;
            </Text>
          ) : null}
          <Text style={styles.summaryText}>
            👥 Group: {groupSize} · 🕐 {params.startTime} — {params.endTime}
          </Text>
          {activeFilters.length > 0 && (
            <Text style={styles.summaryText}>
              🏷️ {activeFilters.join(", ")}
            </Text>
          )}
        </View>
      )}

      <View style={styles.toggleRow}>
        {(["List", "Map"] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.toggleBtn,
              viewMode === mode && styles.toggleBtnActive,
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === mode && styles.toggleTextActive,
              ]}
            >
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by :</Text>
        <TouchableOpacity
          onPress={() =>
            setSortBy((prev) =>
              prev === "Distance" ? "Relevance" : "Distance",
            )
          }
        >
          <Text style={styles.sortValue}>{sortBy} ▾</Text>
        </TouchableOpacity>
        <Text style={styles.resultCount}>
          {sortedSpaces.length} space{sortedSpaces.length !== 1 ? "s" : ""}{" "}
          found
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
            latitude: 51.498,
            longitude: -0.184,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {sortedSpaces.map((space) => {
            const prediction = predictionsMap[space.id];
            return (
              <Marker
                key={space.id}
                coordinate={{
                  latitude: space.latitude,
                  longitude: space.longitude,
                }}
                pinColor={getCrowdnessColor(prediction)}
              >
                <Callout
                  onPress={() =>
                    router.push({
                      pathname: "/space/[id]",
                      params: { id: space.id },
                    })
                  }
                >
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{space.name}</Text>
                    <Text style={styles.calloutSub}>{space.address}</Text>
                    <Text style={styles.calloutHrs}>{space.opening_hrs}</Text>
                    {prediction && (
                      <>
                        <Text style={styles.calloutPrediction}>
                          {prediction.level.toUpperCase()} (
                          {prediction.confidence}%)
                        </Text>
                        <Text style={styles.calloutSource}>
                          {getSourceBadge(prediction.source)}
                        </Text>
                      </>
                    )}
                    <Text style={styles.calloutLink}>
                      Tap to view details →
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {sortedSpaces.length > 0 ? (
            sortedSpaces.map((space) => {
              const prediction = predictionsMap[space.id];
              return (
                <TouchableOpacity
                  key={space.id}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: "/space/[id]",
                      params: { id: space.id },
                    })
                  }
                >
                  <View style={styles.spaceCardWrapper}>
                    <SpaceCard
                      id={space.id}
                      name={space.name}
                      address={space.address}
                      openingHrs={space.opening_hrs}
                      safetyLevel={space.safety_level}
                      features={space.features}
                      tags={space.tags}
                      distance={space.distance}
                      latitude={space.latitude}
                      longitude={space.longitude}
                      crowdness={prediction?.level || "limited"}
                    />
                    {prediction && (
                      <View style={styles.predictionOverlay}>
                        <View
                          style={[
                            styles.predictionBadge,
                            {
                              backgroundColor: getCrowdnessColor(prediction),
                            },
                          ]}
                        >
                          <Text style={styles.predictionText}>
                            {prediction.level.toUpperCase()}
                          </Text>
                          <Text style={styles.confidenceText}>
                            {prediction.confidence}% confidence
                          </Text>
                          <Text style={styles.sourceText}>
                            {getSourceBadge(prediction.source)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No spaces found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or search query
              </Text>
              <TouchableOpacity
                style={styles.backToSearchBtn}
                onPress={() => router.back()}
              >
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 4,
  },
  summaryText: { fontSize: 13, color: "#555" },
  toggleRow: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "#555",
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 16,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 28,
    backgroundColor: "#fff",
  },
  toggleBtnActive: { backgroundColor: "#333" },
  toggleText: { fontSize: 14, color: "#333", fontWeight: "600" },
  toggleTextActive: { color: "#fff" },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  sortLabel: { fontSize: 14, color: "#444" },
  sortValue: { fontSize: 14, fontWeight: "700", color: "#111" },
  resultCount: { marginLeft: "auto", fontSize: 13, color: "#888" },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#888" },
  map: { flex: 1, borderRadius: 12, overflow: "hidden" },
  callout: { width: 220, padding: 10 },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  calloutSub: { fontSize: 12, color: "#666", marginBottom: 2 },
  calloutHrs: { fontSize: 12, color: "#888", marginBottom: 4 },
  calloutPrediction: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 2,
  },
  calloutSource: { fontSize: 11, color: "#666", marginBottom: 4 },
  calloutLink: { fontSize: 12, color: "#007AFF", fontWeight: "600" },
  list: { paddingBottom: 40 },
  spaceCardWrapper: { marginBottom: 12, position: "relative" },
  predictionOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  predictionBadge: {
    borderRadius: 8,
    padding: 8,
    alignItems: "flex-end",
  },
  predictionText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  confidenceText: { fontSize: 10, color: "#fff", marginTop: 2 },
  sourceText: { fontSize: 9, color: "#fff", marginTop: 2 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  emptySubtitle: { fontSize: 14, color: "#888", textAlign: "center" },
  backToSearchBtn: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: "#333",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  backToSearchText: { fontSize: 14, fontWeight: "600", color: "#333" },
});
