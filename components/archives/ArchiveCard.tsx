import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ArchivedDocument } from "@/types/archives";

import ArchiveStatusBadge from "./ArchiveStatusBadge";
import ArchiveTypeBadge from "./ArchiveTypeBadge";

function formatAmount(amount?: number, currency?: string) {
  if (amount == null) return "-";
  return `${amount.toLocaleString("fr-FR")} ${currency ?? "USD"}`;
}

export default function ArchiveCard({
  document,
}: {
  document: ArchivedDocument;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badges}>
          <ArchiveTypeBadge type={document.type} />
          <ArchiveStatusBadge status={document.clientMatchStatus} />
        </View>

        <TouchableOpacity
          style={styles.pdfButton}
          onPress={() => Linking.openURL(document.pdfUrl)}
        >
          <Text style={styles.pdfText}>PDF</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.number}>{document.number}</Text>

      <Text style={styles.client}>{document.clientName}</Text>

      {!!document.historicalClientName &&
        document.historicalClientName !== document.clientName && (
          <Text style={styles.historical}>
            Ancien nom : {document.historicalClientName}
          </Text>
        )}

      {!!document.designation && (
        <Text style={styles.designation}>
          {document.designation}
        </Text>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Date</Text>

        <Text style={styles.value}>
          {document.documentDate ??
            document.invoiceDate ??
            document.eventDate ??
            "-"}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Montant</Text>

        <Text style={styles.amount}>
          {formatAmount(document.amount, document.currency)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  badges: {
    flexDirection: "row",
    gap: 6,
  },

  pdfButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  pdfText: {
    color: "#FFF",
    fontWeight: "700",
  },

  number: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
  },

  client: {
    marginTop: 8,
    fontWeight: "700",
    fontSize: 16,
  },

  historical: {
    color: "#6B7280",
    marginTop: 3,
  },

  designation: {
    marginTop: 10,
    color: "#374151",
  },

  row: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  label: {
    color: "#6B7280",
  },

  value: {
    fontWeight: "600",
  },

  amount: {
    fontWeight: "700",
    color: "#0F766E",
  },
});