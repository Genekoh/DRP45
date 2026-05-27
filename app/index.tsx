import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { useState } from "react";
import {
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

  const toggleFilter = (label: string) => {
    setSelectedFilters((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label],
    );
  };

  const handleApply = () => {
    // Pass all filter state to results screen as route params
    router.push({
      pathname: "/results",
      params: {
        query,
        groupSize: String(groupSize),
        filters: selectedFilters.join(","), // array → comma-separated string
        startTime,
        endTime,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Bar */}
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ccc",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
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
