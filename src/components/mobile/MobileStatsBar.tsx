import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type MobileStatTone = "blue" | "green" | "orange" | "purple" | "rose";
export type MobileStatItem = {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
  tone?: MobileStatTone;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

const palettes = {
  blue: { background: "#EAF3FF", border: "#BFDBFE", value: "#1D4ED8", label: "#1E40AF", icon: "#2563EB" },
  green: { background: "#EAFBF2", border: "#BBF7D0", value: "#047857", label: "#166534", icon: "#059669" },
  orange: { background: "#FFF7E8", border: "#FDE68A", value: "#B45309", label: "#92400E", icon: "#D97706" },
  purple: { background: "#F4EEFF", border: "#DDD6FE", value: "#6D28D9", label: "#5B21B6", icon: "#7C3AED" },
  rose: { background: "#FFF0F3", border: "#FECDD3", value: "#BE123C", label: "#9F1239", icon: "#E11D48" },
} as const;

const tones: MobileStatTone[] = ["blue", "green", "orange", "purple", "rose"];
const icons: (keyof typeof MaterialIcons.glyphMap)[] = [
  "analytics",
  "payments",
  "schedule",
  "verified",
  "trending-up",
];

export default function MobileStatsBar({ items }: { items: MobileStatItem[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item, index) => {
        const palette = palettes[item.tone ?? tones[index % tones.length]];
        const icon = item.icon ?? icons[index % icons.length];

        return (
          <View
            key={`${item.label}-${index}`}
            style={[
              styles.card,
              item.wide && styles.wideCard,
              { backgroundColor: palette.background, borderColor: palette.border },
            ]}
          >
            <View style={styles.topRow}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(255,255,255,0.72)" }]}>
                <MaterialIcons name={icon} size={15} color={palette.icon} />
              </View>
              <Text style={[styles.value, { color: palette.value }]} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
            <Text style={[styles.label, { color: palette.label }]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 8, paddingRight: 4 },
  card: {
    minWidth: 96,
    height: 66,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    justifyContent: "center",
    borderWidth: 1,
  },
  wideCard: { minWidth: 136 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  iconCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { flexShrink: 1, fontSize: 14, fontWeight: "900" },
  label: { marginTop: 4, fontSize: 11, fontWeight: "700" },
});
