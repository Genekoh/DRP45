import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export default function FilterChip({
  label,
  selected = false,
  onPress,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1.5,
    borderColor: "#555",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  chipText: {
    fontSize: 14,
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
  },
});
