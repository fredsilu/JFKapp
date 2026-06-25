import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { ArchivedDocument } from "@/types/archives";
import { fetchArchivedDocuments } from "@/src/services/archivedDocument.service";

type FilterType = "all" | "invoice" | "proforma";

function formatAmount(amount?: number, currency?: string) {
  if (amount === undefined || Number.isNaN(amount)) return "-";
  return `${amount.toLocaleString("fr-FR")} ${currency || "USD"}`;
}

function formatType(type: ArchivedDocument["type"]) {
  return type === "invoice" ? "Facture" : "Proforma";
}

function extractSortKey(doc: ArchivedDocument) {
  const text = `${doc.number || ""} ${doc.fileName || ""}`;

  const yearMatch = text.match(/20\d{2}/);
  const year = yearMatch ? Number(yearMatch[0]) : 0;

  const allNumbers = text.match(/\d+/g) || [];
  const lastNumber = allNumbers.length > 0 ? Number(allNumbers[allNumbers.length - 1]) : 0;

  return {
    year,
    sequence: Number.isFinite(lastNumber) ? lastNumber : 0,
  };
}

function sortArchivedDocuments(a: ArchivedDocument, b: ArchivedDocument) {
  const ka = extractSortKey(a);
  const kb = extractSortKey(b);

  if (kb.year !== ka.year) return kb.year - ka.year;
  if (kb.sequence !== ka.sequence) return kb.sequence - ka.sequence;

  return (b.documentDate || b.invoiceDate || b.eventDate || "").localeCompare(
    a.documentDate || a.invoiceDate || a.eventDate || ""
  );
}

function buildStats(docs: ArchivedDocument[]) {
  const invoices = docs.filter((d) => d.type === "invoice");
  const proformas = docs.filter((d) => d.type === "proforma");

  const totalInvoices = invoices.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalProformas = proformas.reduce((sum, d) => sum + (d.amount || 0), 0);

  const clients = new Set(
    docs
      .map((d) => d.clientId || d.clientName || d.historicalClientName)
      .filter(Boolean)
  );

  const mapped = docs.filter((d) => d.clientMatchStatus === "mapped").length;
  const newHistorical = docs.filter(
    (d) => d.clientMatchStatus === "new_historical_client"
  ).length;
  const unmapped = docs.filter((d) => d.clientMatchStatus === "unmapped").length;

  return {
    total: docs.length,
    invoices: invoices.length,
    proformas: proformas.length,
    totalInvoices,
    totalProformas,
    clients: clients.size,
    mapped,
    newHistorical,
    unmapped,
  };
}

export default function ArchivedDocumentsScreen() {
  const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchArchivedDocuments();
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return documents
      .filter((doc) => {
        const matchesType = filterType === "all" || doc.type === filterType;

        const searchable = [
          doc.number,
          doc.clientName,
          doc.historicalClientName,
          doc.designation,
          doc.fileName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return matchesType && (!q || searchable.includes(q));
      })
      .sort(sortArchivedDocuments);
  }, [documents, filterType, search]);

  const stats = useMemo(() => buildStats(filteredDocuments), [filteredDocuments]);

  async function openPdf(url?: string) {
    if (!url) return;
    await Linking.openURL(url);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement des archives...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Archives historiques</Text>
      <Text style={styles.subtitle}>
        Anciennes factures et proformas importées avec PDF stocké.
      </Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher client, numéro, désignation..."
        style={styles.searchInput}
      />

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === "all" && styles.filterActive]}
          onPress={() => setFilterType("all")}
        >
          <Text style={styles.filterText}>Tous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterType === "invoice" && styles.filterActive]}
          onPress={() => setFilterType("invoice")}
        >
          <Text style={styles.filterText}>Factures</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterType === "proforma" && styles.filterActive]}
          onPress={() => setFilterType("proforma")}
        >
          <Text style={styles.filterText}>Proformas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Archives" value={stats.total} />
        <StatCard label="Factures" value={stats.invoices} />
        <StatCard label="Proformas" value={stats.proformas} />
        <StatCard label="Clients" value={stats.clients} />
        <StatCard label="Montant factures" value={formatAmount(stats.totalInvoices)} small />
        <StatCard label="Montant proformas" value={formatAmount(stats.totalProformas)} small />
        <StatCard label="Mapped" value={stats.mapped} />
        <StatCard label="Nouveaux" value={stats.newHistorical} />
        <StatCard label="Unmapped" value={stats.unmapped} />
      </View>

      <Text style={styles.count}>{filteredDocuments.length} document(s)</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredDocuments.map((doc) => (
          <View key={doc.id || doc.storagePath} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.type}>{formatType(doc.type)}</Text>
                <Text style={styles.number}>{doc.number}</Text>
              </View>

              <TouchableOpacity
                style={styles.pdfButton}
                onPress={() => openPdf(doc.pdfUrl)}
              >
                <Text style={styles.pdfButtonText}>PDF</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.client}>{doc.clientName}</Text>

            {!!doc.historicalClientName &&
              doc.historicalClientName !== doc.clientName && (
                <Text style={styles.historicalClient}>
                  Nom historique : {doc.historicalClientName}
                </Text>
              )}

            {!!doc.designation && (
              <Text style={styles.designation}>{doc.designation}</Text>
            )}

            {doc.type === "proforma" && (
              <>
                <Text style={styles.meta}>
                  Date proforma : {doc.documentDate || "-"}
                </Text>
                <Text style={styles.meta}>
                  Date événement : {doc.eventDate || "-"}
                </Text>
                <Text style={styles.meta}>
                  Num facture : {doc.linkedInvoiceNumber || "-"}
                </Text>
              </>
            )}

            {doc.type === "invoice" && (
              <>
                <Text style={styles.meta}>
                  Date événement : {doc.eventDate || "-"}
                </Text>
                <Text style={styles.meta}>
                  Date facture : {doc.invoiceDate || doc.documentDate || "-"}
                </Text>
                <Text style={styles.meta}>
                  Date paiement : {doc.paymentDate || "-"}
                </Text>
              </>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                Date : {doc.documentDate || doc.invoiceDate || doc.eventDate || "-"}
              </Text>
              <Text style={styles.meta}>
                Montant : {formatAmount(doc.amount, doc.currency)}
              </Text>
            </View>
          </View>
        ))}

        {filteredDocuments.length === 0 && (
          <Text style={styles.emptyText}>Aucune archive trouvée.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, small && styles.statValueSmall]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#6B7280",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 14,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  filterActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#38BDF8",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 105,
    flexGrow: 1,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  statValueSmall: {
    fontSize: 13,
  },
  count: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  type: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  number: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  client: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  historicalClient: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },
  designation: {
    marginTop: 8,
    fontSize: 13,
    color: "#374151",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  meta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  pdfButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  pdfButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 40,
  },
});