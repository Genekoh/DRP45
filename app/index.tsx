import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FilterChip from "../components/FilterChip";

const FILTER_OPTIONS = [
  ["quiet", "charging", "laptop"],
  ["AC", "free", "food available"],
];

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [groupSize, setGroupSize] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");
  const [location, setLocation] = useState<string>("Current Location");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customLocation, setCustomLocation] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const [address] = await Location.reverseGeocodeAsync(loc.coords);
        setLocation(address?.city || address?.district || "Current Location");
      }
    } catch (e) {
      setLocation("Current Location");
    }
    setLoadingLocation(false);
  };

  const handleUseCurrentLocation = async () => {
    setShowLocationModal(false);
    await fetchCurrentLocation();
  };

  const handleUseCustomLocation = () => {
    if (customLocation.trim()) {
      setLocation(customLocation.trim());
      setCustomLocation("");
      setShowLocationModal(false);
    }
  };

  const toggleFilter = (label: string) => {
    setSelectedFilters((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label],
    );
  };

  const handleApply = () => {
    router.push({
      pathname: "/results",
      params: {
        query,
        groupSize: String(groupSize),
        filters: selectedFilters.join(","),
        startTime,
        endTime,
        location,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Bar + Location Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color="#888"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="input your requirement"
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.7}
        >
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#555" />
          ) : (
            <Ionicons name="location-sharp" size={20} color="#555" />
          )}
        </TouchableOpacity>
      </View>

      {/* Show selected location */}
      {location !== "Current Location" || !loadingLocation ? (
        <TouchableOpacity onPress={() => setShowLocationModal(true)}>
          <Text style={styles.locationLabel}>
            <Ionicons name="location-outline" size={13} color="#888" /> {location}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Choose Location</Text>

            {/* Use Current Location */}
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleUseCurrentLocation}
            >
              <Ionicons name="locate" size={20} color="#333" style={{ marginRight: 12 }} />
              <Text style={styles.modalOptionText}>Use current location</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Enter Custom Location */}
            <Text style={styles.modalSubLabel}>Or enter a location:</Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                placeholder="e.g. Central Library, London"
                placeholderTextColor="#aaa"
                value={customLocation}
                onChangeText={setCustomLocation}
                returnKeyType="done"
                onSubmitEditing={handleUseCustomLocation}
              />
              <TouchableOpacity
                style={styles.customInputButton}
                onPress={handleUseCustomLocation}
              >
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Group Size Slider */}
      <Text style={styles.sectionLabel}>Group size</Text>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={groupSize}
        onValueChange={setGroupSize}
        minimumTrackTintColor="#333"
        maximumTrackTintColor="#ccc"
        thumbTintColor="#333"
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>1</Text>
        <Text style={styles.sliderLabelText}>
          {groupSize > 1 ? `Selected: ${groupSize}` : ""}
        </Text>
        <Text style={styles.sliderLabelText}>10+</Text>
      </View>

      {/* Filter Chips */}
      {FILTER_OPTIONS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.chipRow}>
          {row.map((chip) => (
            <FilterChip
              key={chip}
              label={chip}
              selected={selectedFilters.includes(chip)}
              onPress={() => toggleFilter(chip)}
            />
          ))}
        </View>
      ))}

      {/* Time Range */}
      <Text style={styles.timeQuestion}>
        What is the time range that you want to use the space for?
      </Text>
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>S:</Text>
        <View style={styles.timeBox}>
          <TextInput
            style={styles.timeInput}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="00:00"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <Text style={styles.timeDash}>—</Text>
        <View style={styles.timeBox}>
          <TextInput
            style={styles.timeInput}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="00:00"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      {/* Apply Button */}
      <TouchableOpacity
        style={styles.applyButton}
        onPress={handleApply}
        activeOpacity={0.8}
      >
        <Text style={styles.applyText}>Apply →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  locationButton: {
    width: 48,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  locationLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 20,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  modalSubLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  customInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  customInputButton: {
    width: 44,
    height: 44,
    backgroundColor: "#333",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 15,
    color: "#888",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: -8,
  },
  sliderLabelText: {
    fontSize: 12,
    color: "#666",
  },
  chipRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  timeQuestion: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 40,
  },
  timeLabel: {
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
  },
  timeBox: {
    borderWidth: 1.5,
    borderColor: "#555",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  timeInput: {
    fontSize: 16,
    color: "#333",
    minWidth: 60,
    maxWidth: 80,
    textAlign: "center",
  },
  timeDash: {
    fontSize: 18,
    color: "#555",
  },
  applyButton: {
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: "#333",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: "#fff",
  },
  applyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
