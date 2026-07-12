import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

type Item<T extends string> = { label: string; value: T };
type Props<T extends string> = { items: Item<T>[]; value: T; onChange: (value: T) => void };

export default function MobileFilterBar<T extends string>({ items, value, onChange }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const active = value === item.value;
        return (
          <TouchableOpacity key={item.value} style={[styles.chip, active && styles.activeChip]} onPress={() => onChange(item.value)} activeOpacity={0.8}>
            <Text style={[styles.text, active && styles.activeText]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 7, paddingBottom: 10, paddingRight: 4 },
  chip: { height: 34, justifyContent: "center", paddingHorizontal: 13, borderRadius: 17, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF" },
  activeChip: { borderColor: "#0F4C81", backgroundColor: "#0F4C81" },
  text: { color: "#475569", fontSize: 12, fontWeight: "600" },
  activeText: { color: "#FFFFFF" },
});
