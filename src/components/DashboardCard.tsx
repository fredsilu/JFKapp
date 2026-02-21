import { View, Text, StyleSheet } from "react-native";

interface Props {
  title: string;
  value: number;
  color?: string;
}

export default function DashboardCard({ title, value, color }: Props) {
  return (
    <View style={[styles.card, { borderLeftColor: color || "#007AFF" }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>
        {value.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 6,
  },
});