import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCrowdness } from "../../context/CrowdnessContext";
import { CrowdnessLevel } from "../../lib/supabase";

const CROWDNESS_OPTIONS: {
  value: CrowdnessLevel;
  label: string;
  color: string;
}[] = [
  { value: "lots", label: "Lots of seats", color: "#4caf50" },
  { value: "limited", label: "Limited seats", color: "#ff9800" },
  { value: "none", label: "No seats", color: "#f44336" },
];

export default function SpaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spaces, crowdnessMap, setCrowdness } = useCrowdness();
  const space = spaces.find((s) => s.id === id);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!space) {
    return (
      <View style={styles.notFound}>
        <Text>Space not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#333", marginTop: 12 }}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const crowdness = crowdnessMap[space.id] ?? "lots";
  const currentOption = CROWDNESS_OPTIONS.find((o) => o.value === crowdness)!;

  const handleSetCrowdness = async (value: CrowdnessLevel) => {
    setSaving(true);
    await setCrowdness(space.id, value);
    setSaving(false);
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{space.name}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoRow}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.photoPlaceholder}>
              <Ionicons name="image-outline" size={32} color="#bbb" />
              <Text style={styles.photoLabel}>Photo {i}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color="#555"
              style={styles.infoIcon}
            />
            <View>
              <Text style={styles.infoLabel}>Opening Hours</Text>
              <Text style={styles.infoValue}>{space.opening_hrs}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#555"
              style={styles.infoIcon}
            />
            <View>
              <Text style={styles.infoLabel}>Safety Level</Text>
              <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.safetyDot,
                      {
                        backgroundColor:
                          i < space.safety_level ? "#f5a623" : "#ddd",
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name="list-outline"
              size={18}
              color="#555"
              style={styles.infoIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Features</Text>
              <View style={styles.featureChips}>
                {space.features.map((f, i) => (
                  <View key={i} style={styles.featureChip}>
                    <Text style={styles.featureChipText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name="people-outline"
              size={18}
              color="#555"
              style={styles.infoIcon}
            />
            <View>
              <Text style={styles.infoLabel}>Crowdness</Text>
              <View
                style={[
                  styles.crowdnessBadge,
                  { backgroundColor: currentOption.color + "22" },
                ]}
              >
                <View
                  style={[
                    styles.crowdnessDot,
                    { backgroundColor: currentOption.color },
                  ]}
                />
                <Text
                  style={[styles.crowdnessText, { color: currentOption.color }]}
                >
                  {currentOption.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="people"
            size={18}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.reviewButtonText}>Review Crowdness</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !saving && setShowModal(false)}
        >
          <View
            style={styles.modalSheet}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>How crowded is it?</Text>
            <Text style={styles.modalSubtitle}>
              Help others by sharing the current situation
            </Text>

            {CROWDNESS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.crowdnessOption,
                  crowdness === option.value && {
                    borderColor: option.color,
                    backgroundColor: option.color + "11",
                  },
                ]}
                onPress={() => handleSetCrowdness(option.value)}
                disabled={saving}
              >
                <View
                  style={[styles.optionDot, { backgroundColor: option.color }]}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    crowdness === option.value && {
                      color: option.color,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {crowdness === option.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={option.color}
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </TouchableOpacity>
            ))}

            {saving && (
              <Text style={styles.savingText}>Saving to database...</Text>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingBottom: 120 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  photoRow: { paddingLeft: 16, marginBottom: 20 },
  photoPlaceholder: {
    width: 200,
    height: 140,
    backgroundColor: "#e8e8e8",
    borderRadius: 12,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  photoLabel: { fontSize: 13, color: "#aaa" },
  infoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  infoIcon: { marginRight: 14, marginTop: 2 },
  infoLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  infoValue: { fontSize: 15, color: "#222", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#f0f0f0" },
  safetyDot: { width: 14, height: 14, borderRadius: 7 },
  featureChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  featureChip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  featureChipText: { fontSize: 12, color: "#444" },
  crowdnessBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  crowdnessDot: { width: 8, height: 8, borderRadius: 4 },
  crowdnessText: { fontSize: 13, fontWeight: "600" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 16,
  },
  reviewButton: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  modalSubtitle: { fontSize: 14, color: "#888", marginBottom: 20 },
  crowdnessOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  optionDot: { width: 14, height: 14, borderRadius: 7 },
  optionLabel: { fontSize: 16, color: "#333" },
  savingText: {
    textAlign: "center",
    color: "#888",
    fontSize: 13,
    marginBottom: 8,
  },
  cancelButton: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  cancelText: { fontSize: 15, color: "#888" },
});
