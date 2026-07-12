import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Props = {
  title: string;
  onBack?: () => void;
  onAdd?: () => void;
  total?: number;
};

export default function MobileListHeader({ title, onBack, onAdd, total }: Props) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.75}>
          <MaterialIcons name="arrow-back" size={21} color="#0F4C81" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {typeof total === "number" ? (
          <View style={styles.totalBadge}><Text style={styles.totalText}>{total}</Text></View>
        ) : null}
      </View>

      {onAdd ? (
        <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.8}>
          <MaterialIcons name="add" size={23} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    paddingTop: 30,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F1F8",
    borderWidth: 1,
    borderColor: "#D5E5F1",
  },
  iconPlaceholder: { width: 38, height: 38 },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: { color: "#0F172A", fontSize: 20, fontWeight: "800", flexShrink: 1 },
  totalBadge: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  totalText: { color: "#166534", fontSize: 12, fontWeight: "800" },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F4C81",
    elevation: 2,
  },
});
