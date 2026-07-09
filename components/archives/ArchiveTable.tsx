// components/archives/ArchiveTable.tsx
import { useMemo, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FileText, Upload } from "lucide-react-native";

import { ArchivedDocument } from "@/types/archives";
import ArchiveStatusBadge from "./ArchiveStatusBadge";
import ArchiveTypeBadge from "./ArchiveTypeBadge";

type SortField = "number" | "client" | "date" | "amount";
type SortDirection = "asc" | "desc";

function formatAmount(amount?: number, currency?: string) {
  if (amount == null) return "-";
  return `${amount.toLocaleString("fr-FR")} ${currency ?? "USD"}`;
}

interface Props {
  documents: ArchivedDocument[];
  onUploadPdf?: (document: ArchivedDocument) => void;
}

export default function ArchiveTable({ documents, onUploadPdf }: Props) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [direction, setDirection] = useState<SortDirection>("desc");

  function changeSort(field: SortField) {
    if (field === sortField) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setDirection("asc");
  }

  function sortIndicator(field: SortField) {
    if (field !== sortField) return "";
    return direction === "asc" ? " ▲" : " ▼";
  }

  function handlePdfPress(doc: ArchivedDocument) {
    if (doc.pdfUrl) {
      Linking.openURL(doc.pdfUrl);
      return;
    }

    onUploadPdf?.(doc);
  }

  const sortedDocuments = useMemo(() => {
    const copy = [...documents];

    copy.sort((a, b) => {
      switch (sortField) {
        case "number":
          return direction === "asc"
            ? a.number.localeCompare(b.number)
            : b.number.localeCompare(a.number);

        case "client":
          return direction === "asc"
            ? a.clientName.localeCompare(b.clientName)
            : b.clientName.localeCompare(a.clientName);

        case "date": {
          const da = a.documentDate ?? a.invoiceDate ?? a.eventDate ?? "";
          const db = b.documentDate ?? b.invoiceDate ?? b.eventDate ?? "";

          return direction === "asc" ? da.localeCompare(db) : db.localeCompare(da);
        }

        case "amount":
          return direction === "asc"
            ? (a.amount ?? 0) - (b.amount ?? 0)
            : (b.amount ?? 0) - (a.amount ?? 0);
      }
    });

    return copy;
  }, [documents, sortField, direction]);

  return (
    <View style={styles.container}>
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.cell, styles.type, styles.headerText]}>Type</Text>

        <Pressable style={[styles.cell, styles.number]} onPress={() => changeSort("number")}>
          <Text style={styles.headerText}>Numéro{sortIndicator("number")}</Text>
        </Pressable>

        <Pressable style={[styles.cell, styles.client]} onPress={() => changeSort("client")}>
          <Text style={styles.headerText}>Client{sortIndicator("client")}</Text>
        </Pressable>

        <Text style={[styles.cell, styles.designation, styles.headerText]}>Désignation</Text>

        <Pressable style={[styles.cell, styles.date]} onPress={() => changeSort("date")}>
          <Text style={styles.headerText}>Date document{sortIndicator("date")}</Text>
        </Pressable>

        <Pressable style={[styles.cell, styles.amount]} onPress={() => changeSort("amount")}>
          <Text style={[styles.headerText, styles.textRight]}>
            Montant{sortIndicator("amount")}
          </Text>
        </Pressable>

        <Text style={[styles.cell, styles.status, styles.headerText]}>Statut</Text>
        <Text style={[styles.cell, styles.pdf, styles.headerText]}>PDF</Text>
      </View>

      <ScrollView style={styles.body}>
        {sortedDocuments.map((doc) => {
          const hasPdf = Boolean(doc.pdfUrl);

          return (
            <Pressable
              key={doc.id || doc.storagePath || doc.number}
              onPress={() => undefined}
              style={({ hovered }) => [
                styles.row,
                Platform.OS === "web" && hovered ? styles.rowHover : null,
              ]}
            >
              <View style={[styles.cell, styles.type]}>
                <ArchiveTypeBadge type={doc.type} />
              </View>

              <Text style={[styles.cell, styles.number]} numberOfLines={1}>
                {doc.number}
              </Text>

              <Text style={[styles.cell, styles.client]} numberOfLines={1}>
                {doc.clientName || doc.historicalClientName || "-"}
              </Text>

              <Text style={[styles.cell, styles.designation]} numberOfLines={1}>
                {doc.designation || "-"}
              </Text>

              <Text style={[styles.cell, styles.date]} numberOfLines={1}>
                {doc.documentDate ?? doc.invoiceDate ?? doc.eventDate ?? "-"}
              </Text>

              <Text style={[styles.cell, styles.amount]} numberOfLines={1}>
                {formatAmount(doc.amount, doc.currency)}
              </Text>

              <View style={[styles.cell, styles.status]}>
                <ArchiveStatusBadge status={doc.clientMatchStatus} />
              </View>

              <Pressable
                style={[styles.cell, styles.pdf]}
                onPress={() => handlePdfPress(doc)}
              >
                {hasPdf ? (
                  <FileText size={20} color="#DC2626" />
                ) : (
                  <Upload size={20} color="#EA580C" />
                )}
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  body: {
    flex: 1,
  },

  header: {
    backgroundColor: "#F3F4F6",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    minHeight: 46,
    paddingHorizontal: 10,
    cursor: Platform.OS === "web" ? "pointer" : undefined,
  },

  rowHover: {
    backgroundColor: "#EFF6FF",
  },

  cell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },

  headerText: {
    fontWeight: "700",
    color: "#374151",
    fontSize: 12,
  },

  type: {
    flex: 1,
  },

  number: {
    flex: 2,
    fontWeight: "700",
  },

  client: {
    flex: 2,
  },

  designation: {
    flex: 3,
  },

  date: {
    flex: 1.3,
  },

  amount: {
    flex: 1.3,
    textAlign: "right",
  },

  status: {
    flex: 1.6,
  },

  pdf: {
    width: 48,
    alignItems: "center",
  },

  textRight: {
    textAlign: "right",
  },
});