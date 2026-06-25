import { View, Text, StyleSheet } from "react-native";

export default function ArchiveTypeBadge({
  type,
}: {
  type: "invoice" | "proforma";
}) {
  const invoice = type === "invoice";

  return (
    <View
      style={[
        styles.badge,
        invoice ? styles.invoice : styles.proforma,
      ]}
    >
      <Text style={styles.text}>
        {invoice ? "FACTURE" : "PROFORMA"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  invoice: {
    backgroundColor: "#DBEAFE",
  },

  proforma: {
    backgroundColor: "#DCFCE7",
  },

  text: {
    fontWeight: "700",
    fontSize: 11,
  },
});