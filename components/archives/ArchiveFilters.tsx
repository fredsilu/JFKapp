import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export type ArchiveFilterType =
  | "all"
  | "invoice"
  | "proforma"
  | "mapped"
  | "new_historical_client"
  | "unmapped";

interface Props {
  value: ArchiveFilterType;
  onChange: (value: ArchiveFilterType) => void;
}

const filters: {
  label: string;
  value: ArchiveFilterType;
}[] = [
  { label: "Tous", value: "all" },
  { label: "Factures", value: "invoice" },
  { label: "Proformas", value: "proforma" },
  { label: "Reliées", value: "mapped" },
  { label: "Nouveaux clients", value: "new_historical_client" },
  { label: "À vérifier", value: "unmapped" },
];

export default function ArchiveFilters({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {filters.map((filter) => {
        const active = value === filter.value;

        return (
          <TouchableOpacity
            key={filter.value}
            style={[styles.button, active && styles.buttonActive]}
            onPress={() => onChange(filter.value)}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 42,
    marginBottom: 8,
  },

  container: {
    gap: 8,
    alignItems: "center",
  },

  button: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },

  buttonActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#38BDF8",
  },

  text: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  textActive: {
    color: "#0369A1",
  },
});