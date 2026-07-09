// components/archives/ArchiveCard.tsx
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FileText, Upload } from "lucide-react-native";

import { ArchivedDocument } from "@/types/archives";
import ArchiveStatusBadge from "./ArchiveStatusBadge";
import ArchiveTypeBadge from "./ArchiveTypeBadge";

function formatAmount(amount?: number, currency?: string) {
  if (amount == null) return "-";
  return `${amount.toLocaleString("fr-FR")} ${currency ?? "USD"}`;
}

export default function ArchiveCard({
  document,
  onUploadPdf,
}: {
  document: ArchivedDocument;
  onUploadPdf?: (document: ArchivedDocument) => void;
}) {
  const hasPdf = Boolean(document.pdfUrl);

  const handlePdfPress = () => {
    if (hasPdf && document.pdfUrl) {
      Linking.openURL(document.pdfUrl);
      return;
    }

    onUploadPdf?.(document);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badges}>
          <ArchiveTypeBadge type={document.type} />
          <ArchiveStatusBadge status={document.clientMatchStatus} />
        </View>

        <TouchableOpacity
          style={[styles.pdfButton, !hasPdf && styles.uploadButton]}
          onPress={handlePdfPress}
        >
          {hasPdf ? (
            <>
              <FileText size={16} color="#FFFFFF" />
              <Text style={styles.pdfText}>PDF</Text>
            </>
          ) : (
            <>
              <Upload size={16} color="#FFFFFF" />
              <Text style={styles.pdfText}>Upload</Text>
            </>
          )}
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
        <Text style={styles.designation}>{document.designation}</Text>
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
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  badges: {
    flexDirection: "row",
    gap: 6,
    flexShrink: 1,
  },

  pdfButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  uploadButton: {
    backgroundColor: "#EA580C",
  },

  pdfText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },

  number: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  client: {
    marginTop: 6,
    fontWeight: "700",
    fontSize: 15,
    color: "#111827",
  },

  historical: {
    color: "#6B7280",
    marginTop: 2,
    fontSize: 13,
  },

  designation: {
    marginTop: 8,
    color: "#374151",
    fontSize: 13,
  },

  row: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  label: {
    color: "#6B7280",
    fontSize: 13,
  },

  value: {
    fontWeight: "600",
    fontSize: 13,
    color: "#111827",
  },

  amount: {
    fontWeight: "700",
    fontSize: 13,
    color: "#0F766E",
  },
});