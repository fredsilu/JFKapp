import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Props = { value: string; onChangeText: (value: string) => void; placeholder: string };

export default function MobileSearchBar({ value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.box}>
      <MaterialIcons name="search" size={19} color="#64748B" />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94A3B8" style={styles.input} />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={8}>
          <MaterialIcons name="close" size={18} color="#64748B" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 42, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, marginBottom: 8, borderRadius: 11, borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF" },
  input: { flex: 1, paddingVertical: 0, color: "#0F172A", fontSize: 14 },
});
