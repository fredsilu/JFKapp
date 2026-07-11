// app/(traiteur)/documents/credit-notes.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import {
  fetchArchivedCreditNotes,
  normalizeArchivedCreditNote,
} from "@/src/services/archivedDocument.service";
import { documentListStyles as styles } from "@/src/styles/documentList.styles";

import { useCreditNotes } from "@/src/hooks/useFirestore";
import DocumentPageHeader from "@/src/components/DocumentPageHeader";

type CreditNoteStatusFilter =
  | "all"
  | "draft"
  | "issued"
  | "cancelled"
  | "historical";

type SortField =
  | "number"
  | "invoiceNumber"
  | "type"
  | "reason"
  | "amount"
  | "issuedAt"
  | "createdAt";

type SortDirection = "asc" | "desc";

const statusFilters: {
  label: string;
  value: CreditNoteStatusFilter;
}[] = [
    { label: "Tous", value: "all" },
    { label: "Brouillons", value: "draft" },
    { label: "Émis", value: "issued" },
    { label: "Annulés", value: "cancelled" },
    { label: "Archives", value: "historical" },
  ];

function formatAmount(value?: number) {
  if (!value) return "0,00 $";

  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} $`;
}
async function openPdf(item: any) {
  if (!item?.pdfUrl) {
    console.log("PDF indisponible", item?.id);
    return;
  }

  console.log("Ouverture PDF :", item.pdfUrl);

  if (typeof window !== "undefined") {
    window.open(item.pdfUrl, "_blank");
    return;
  }

  await Linking.openURL(item.pdfUrl);
}

function formatDate(value?: any) {
  if (!value) return "-";

  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("fr-FR");
}

function getDateTimestamp(value?: any): number {
  if (!value) return 0;

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  }

  if (typeof value === "string") {
    const frenchDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (frenchDate) {
      const [, day, month, year] = frenchDate;
      return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getCreditNoteAmount(note: any) {
  return note?.amount ?? 0;
}

function getInvoiceNumber(note: any) {
  return note?.invoiceNumber ?? "-";
}

function getReason(note: any) {
  return note?.reason ?? "-";
}

function getCreditType(note: any) {
  if (note?.type === "full") return "Total";
  if (note?.type === "partial") return "Partiel";

  return "-";
}

function hasPdf(item: any) {
  return Boolean(item?.pdfUrl);
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "issued":
      return "Émis";
    case "cancelled":
      return "Annulé";
    case "historical":
      return "Archive";
    default:
      return status || "-";
  }
}

function getStatusColors(status?: string) {
  switch (status) {
    case "draft":
      return { background: "#FEF3C7", text: "#92400E" };
    case "issued":
      return { background: "#DCFCE7", text: "#166534" };
    case "cancelled":
      return { background: "#FEE2E2", text: "#B91C1C" };
    case "historical":
      return {
        background: "#E5E7EB",
        text: "#374151",
      };
    default:
      return { background: "#F3F4F6", text: "#374151" };
  }
}

export default function DocumentCreditNotesScreen() {
  const router = useRouter();
  const { data: appCreditNotes, loading, error } = useCreditNotes();
  const [archivedCreditNotes, setArchivedCreditNotes] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CreditNoteStatusFilter>("all");

  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const tableHeight = Math.max(320, Math.min(700, height - 360));

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  useEffect(() => {
    fetchArchivedCreditNotes().then(setArchivedCreditNotes);
  }, []);

  const creditNotes = useMemo(() => {
    const normalizedArchives =
      archivedCreditNotes.map(normalizeArchivedCreditNote);

    return [...(appCreditNotes || []), ...normalizedArchives];
  }, [appCreditNotes, archivedCreditNotes]);

  const filteredCreditNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...(creditNotes || [])]
      .sort((a: any, b: any) => {
        let valueA: string | number;
        let valueB: string | number;

        switch (sortField) {
          case "number":
            valueA = a?.number || "";
            valueB = b?.number || "";
            break;

          case "invoiceNumber":
            valueA = getInvoiceNumber(a);
            valueB = getInvoiceNumber(b);
            break;

          case "type":
            valueA = getCreditType(a);
            valueB = getCreditType(b);
            break;

          case "reason":
            valueA = getReason(a);
            valueB = getReason(b);
            break;

          case "amount":
            valueA = getCreditNoteAmount(a);
            valueB = getCreditNoteAmount(b);
            break;

          case "issuedAt":
            valueA = getDateTimestamp(a?.issuedAt);
            valueB = getDateTimestamp(b?.issuedAt);
            break;

          case "createdAt":
          default:
            valueA = getDateTimestamp(a?.createdAt ?? a?.issuedAt);
            valueB = getDateTimestamp(b?.createdAt ?? b?.issuedAt);
            break;
        }

        if (typeof valueA === "string" && typeof valueB === "string") {
          const result = valueA.localeCompare(valueB, "fr", {
            numeric: true,
            sensitivity: "base",
          });

          return sortDirection === "asc" ? result : -result;
        }

        const numericA = Number(valueA) || 0;
        const numericB = Number(valueB) || 0;

        return sortDirection === "asc"
          ? numericA - numericB
          : numericB - numericA;
      })
      .filter((note: any) => {
        const matchesStatus =
          statusFilter === "all" || note?.status === statusFilter;

        if (!matchesStatus) return false;
        if (!query) return true;

        const target = [
          note?.number,
          note?.invoiceNumber,
          note?.reason,
          note?.type,
          note?.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return target.includes(query);
      });
  }, [
    creditNotes,
    search,
    statusFilter,
    sortField,
    sortDirection,
  ]);

  const creditNoteStats = useMemo(() => {
    const totalCreditNotes = filteredCreditNotes.length;

    const totalAmount = filteredCreditNotes.reduce(
      (sum: number, note: any) => sum + getCreditNoteAmount(note),
      0
    );

    const issuedAmount = filteredCreditNotes
      .filter((note: any) => note?.status === "issued")
      .reduce((sum: number, note: any) => sum + getCreditNoteAmount(note), 0);

    const draftAmount = filteredCreditNotes
      .filter((note: any) => note?.status === "draft")
      .reduce((sum: number, note: any) => sum + getCreditNoteAmount(note), 0);

    return {
      totalCreditNotes,
      totalAmount,
      issuedAmount,
      draftAmount,
    };
  }, [filteredCreditNotes]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  }

  function renderSortableHeader(
    label: string,
    field: SortField,
    columnStyle: any
  ) {
    const active = sortField === field;

    return (
      <TouchableOpacity
        style={[styles.sortableHeader, columnStyle]}
        onPress={() => toggleSort(field)}
        activeOpacity={0.8}
      >
        <Text style={styles.th}>{label}</Text>

        <MaterialIcons
          name={
            active
              ? sortDirection === "asc"
                ? "arrow-upward"
                : "arrow-downward"
              : "unfold-more"
          }
          size={15}
          color={active ? "#FFFFFF" : "#D1FAE5"}
        />
      </TouchableOpacity>
    );
  }

  function openCreditNote(creditNote: any) {
    if (creditNote?.isHistorical) {
      router.push(
        `/(traiteur)/documents/history/${creditNote.id}` as never
      );
      return;
    }

    router.push(
      `/(traiteur)/credit-notes/${creditNote.id}` as never
    );
  }

  function renderStatusBadge(status?: string) {
    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColors(status).background },
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            { color: getStatusColors(status).text },
          ]}
        >
          {getStatusLabel(status)}
        </Text>
      </View>
    );
  }

  function renderStats() {
    return (
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total avoirs</Text>
          <Text style={styles.statValue}>
            {creditNoteStats.totalCreditNotes}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Montant total</Text>
          <Text style={styles.statValue}>
            {formatAmount(creditNoteStats.totalAmount)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Émis</Text>
          <Text style={styles.statValue}>
            {formatAmount(creditNoteStats.issuedAmount)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Brouillons</Text>
          <Text style={styles.statValue}>
            {formatAmount(creditNoteStats.draftAmount)}
          </Text>
        </View>
      </View>
    );
  }

  function renderFilters() {
    return (
      <View style={styles.filterBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {statusFilters.map((filter) => {
            const active = statusFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(filter.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement des avoirs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur de chargement des avoirs.</Text>
      </View>
    );
  }

  if (isMobile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.breadcrumb}>Documents / Archives</Text>
          <Text style={styles.title}>Avoirs</Text>
          <Text style={styles.subtitle}>
            Consultez tous les avoirs créés.
          </Text>
        </View>

        {renderStats()}

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#6B7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher avoir, facture, motif..."
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {renderFilters()}



        <FlatList
          data={filteredCreditNotes}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.mobileList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun avoir trouvé.</Text>
          }
          renderItem={({ item }: any) => (
            <View style={styles.mobileCard}>
              <View style={styles.mobileCardHeader}>
                <Text style={styles.mobileDocumentNumber}>
                  {item?.number || "-"}
                </Text>

                {renderStatusBadge(item?.status)}
              </View>

              <Text style={styles.mobileClient}>
                Facture : {getInvoiceNumber(item)}
              </Text>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Type</Text>
                <Text style={styles.mobileValue}>{getCreditType(item)}</Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Motif</Text>
                <Text style={styles.mobileValue}>{getReason(item)}</Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Date émission</Text>
                <Text style={styles.mobileValue}>
                  {formatDate(item?.issuedAt)}
                </Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Date création</Text>
                <Text style={styles.mobileValue}>
                  {formatDate(item?.createdAt)}
                </Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Montant</Text>
                <Text style={styles.mobileAmount}>
                  {formatAmount(getCreditNoteAmount(item))}
                </Text>
              </View>

              <View style={styles.mobileActions}>
                <TouchableOpacity
                  style={styles.mobileButton}
                  onPress={() => openCreditNote(item)}
                >
                  <MaterialIcons name="visibility" size={18} color="#065F46" />
                  <Text style={styles.mobileButtonText}>Voir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.mobileButton,
                    !hasPdf(item) && styles.actionButtonDisabled,
                  ]}
                  onPress={() => openPdf(item)}
                  disabled={!hasPdf(item)}
                >
                  <MaterialIcons
                    name="picture-as-pdf"
                    size={18}
                    color={hasPdf(item) ? "#065F46" : "#9CA3AF"}
                  />

                  <Text
                    style={[
                      styles.mobileButtonText,
                      !hasPdf(item) && localStyles.mobileButtonTextDisabled,
                    ]}
                  >
                    PDF
                  </Text>
                </TouchableOpacity>
              </View>
              {item?.isHistorical && !hasPdf(item) && (
                <View style={localStyles.mobileNoPdfRow}>
                  <View style={localStyles.noPdfBadge}>
                    <Text style={localStyles.noPdfBadgeText}>
                      Sans PDF
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DocumentPageHeader
        title="Avoirs"
        subtitle="Consultez tous les avoirs créés et leurs informations principales."
        stats={[
          {
            label: "Total avoirs",
            value: creditNoteStats.totalCreditNotes,
          },
          {
            label: "Montant total",
            value: formatAmount(creditNoteStats.totalAmount),
          },
          {
            label: "Émis",
            value: formatAmount(creditNoteStats.issuedAmount),
          },
          {
            label: "Brouillons",
            value: formatAmount(creditNoteStats.draftAmount),
          },
        ]}
      />

      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#6B7280" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par avoir, facture, motif..."
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {renderFilters()}



      <View style={localStyles.tableViewport}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator
          style={localStyles.horizontalScroll}
          contentContainerStyle={localStyles.horizontalScrollContent}
        >
          <View style={[localStyles.table, { height: tableHeight }]}>
            <View style={styles.tableHeader}>
              {renderSortableHeader(
                "N° Avoir",
                "number",
                localStyles.colInvoice
              )}
              {renderSortableHeader(
                "Facture",
                "invoiceNumber",
                localStyles.colDate
              )}
              {renderSortableHeader("Type", "type", localStyles.colType)}
              {renderSortableHeader("Motif", "reason", localStyles.colReason)}
              {renderSortableHeader(
                "Montant",
                "amount",
                localStyles.colAmount
              )}
              {renderSortableHeader(
                "Date émission",
                "issuedAt",
                localStyles.colDate
              )}
              {renderSortableHeader(
                "Date création",
                "createdAt",
                localStyles.colDate
              )}
              <Text style={[styles.th, localStyles.colStatus]}>Statut</Text>
              <Text style={[styles.th, localStyles.colActions]}>Actions</Text>
            </View>

            <FlatList
              data={filteredCreditNotes}
              style={localStyles.desktopList}
              contentContainerStyle={localStyles.desktopListContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item: any) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Aucun avoir trouvé.</Text>
                </View>
              }
              renderItem={({ item }: any) => (
                <View style={styles.tableRow}>
                  <View style={localStyles.creditNoteNumberCell}>
                    <Text
                      style={localStyles.creditNoteNumberText}
                      numberOfLines={2}
                    >
                      {item?.number || "-"}
                    </Text>

                    {item?.isHistorical && !hasPdf(item) && (
                      <View style={localStyles.noPdfBadge}>
                        <Text style={localStyles.noPdfBadgeText}>
                          Sans PDF
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.td, localStyles.colDate]}>
                    {getInvoiceNumber(item)}
                  </Text>

                  <Text style={[styles.td, localStyles.colType]}>
                    {getCreditType(item)}
                  </Text>

                  <Text style={[styles.td, localStyles.colReason]}>
                    {getReason(item)}
                  </Text>

                  <Text style={[styles.td, localStyles.colAmount]}>
                    {formatAmount(getCreditNoteAmount(item))}
                  </Text>

                  <Text style={[styles.td, localStyles.colDate]}>
                    {formatDate(item?.issuedAt)}
                  </Text>

                  <Text style={[styles.td, localStyles.colDate]}>
                    {formatDate(item?.createdAt)}
                  </Text>

                  <View style={localStyles.colStatus}>
                    {renderStatusBadge(item?.status)}
                  </View>

                  <View style={[styles.actions, localStyles.colActions]}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openCreditNote(item)}
                    >
                      <MaterialIcons name="visibility" size={18} color="#065F46" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        !hasPdf(item) && styles.actionButtonDisabled,
                      ]}
                      onPress={() => openPdf(item)}
                      disabled={!hasPdf(item)}
                    >
                      <MaterialIcons
                        name="picture-as-pdf"
                        size={18}
                        color={hasPdf(item) ? "#065F46" : "#9CA3AF"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
const localStyles = StyleSheet.create({
  tableViewport: {
    flex: 1,
    minHeight: 0,
  },

  horizontalScroll: {
    flex: 1,
    minHeight: 0,
  },

  horizontalScrollContent: {
    alignItems: "stretch",
  },

  table: {
    minWidth: 1300,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  desktopList: {
    flex: 1,
    minHeight: 0,
  },

  desktopListContent: {
    flexGrow: 1,
  },

  colInvoice: {
    width: 200,
  },

  colDate: {
    width: 130,
  },

  colType: {
    width: 110,
  },

  colReason: {
    width: 260,
  },

  colAmount: {
    width: 140,
    textAlign: "right",
  },

  colStatus: {
    width: 110,
    justifyContent: "center",
  },

  colActions: {
    width: 110,
  },

  creditNoteNumberCell: {
    width: 200,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  creditNoteNumberText: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },

  mobileButtonTextDisabled: {
    color: "#9CA3AF",
  },

  noPdfBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  noPdfBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400E",
  },

  mobileNoPdfRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
});