// app/(traiteur)/documents/proformas.tsx

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
import { documentListStyles as styles } from "@/src/styles/documentList.styles";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import MobileListHeader from "@/src/components/mobile/MobileListHeader";
import MobileStatsBar from "@/src/components/mobile/MobileStatsBar";
import MobileSearchBar from "@/src/components/mobile/MobileSearchBar";
import MobileFilterBar from "@/src/components/mobile/MobileFilterBar";


import { useProformas } from "@/src/hooks/useFirestore";
import {
  fetchArchivedProformas,
  normalizeArchivedProforma,
} from "@/src/services/archivedDocument.service";
import DocumentPageHeader from "@/src/components/DocumentPageHeader";

type SortField =
  "number" | "client" | "eventDate" | "createdAt" | "validityDate" | "amount";

type SortDirection = "asc" | "desc";

type ProformaStatusFilter =
  | "all"
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "converted"
  | "invoiced"
  | "historical"
  | "cancelled";

const statusFilters: { label: string; value: ProformaStatusFilter }[] = [
  { label: "Toutes", value: "all" },
  { label: "Brouillons", value: "draft" },
  { label: "Envoyées", value: "sent" },
  { label: "Approuvées", value: "approved" },
  { label: "Refusées", value: "rejected" },
  { label: "Converties", value: "converted" },
  { label: "Facturées", value: "invoiced" },
  { label: "Annulées", value: "cancelled" },
  { label: "Archives", value: "historical" },
];
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

function formatAmount(value?: number) {
  if (!value) return "0,00 $";

  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} $`;
}

function formatDate(value?: any) {
  if (!value) return "-";

  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("fr-FR");
}

function getProformaAmount(proforma: any) {
  return proforma?.totals?.total ?? 0;
}

function getClientName(proforma: any) {
  return proforma?.clientName ?? "-";
}

function getEventName(proforma: any) {
  return proforma?.eventName || proforma?.service || "-";
}

function getEventDate(proforma: any) {
  return proforma?.eventDate ?? null;
}

function getValidityDate(proforma: any) {
  return proforma?.validityDate ?? null;
}

function getDateTimestamp(value?: any): number {
  if (!value) return 0;

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const frenchDateMatch = value.match(
      /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/,
    );

    if (frenchDateMatch) {
      const [, day, month, year] = frenchDateMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function hasPdf(item: any) {
  return Boolean(item?.pdfUrl);
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "sent":
      return "Envoyée";
    case "historical":
      return "Archive";
    case "approved":
      return "Approuvée";
    case "rejected":
      return "Refusée";
    case "converted":
      return "Convertie";
    case "invoiced":
      return "Facturée";
    case "cancelled":
      return "Annulée";
    default:
      return status || "-";
  }
}

function getStatusColors(status?: string) {
  switch (status) {
    case "draft":
      return { background: "#FEF3C7", text: "#92400E" };
    case "sent":
      return { background: "#DBEAFE", text: "#1D4ED8" };
    case "approved":
      return { background: "#DCFCE7", text: "#166534" };
    case "rejected":
      return { background: "#FEE2E2", text: "#B91C1C" };
    case "converted":
      return { background: "#E0E7FF", text: "#3730A3" };
    case "invoiced":
      return { background: "#ECFDF5", text: "#047857" };
    case "historical":
      return {
        background: "#E5E7EB",
        text: "#374151",
      };
    case "cancelled":
      return { background: "#FEE2E2", text: "#B91C1C" };
    default:
      return { background: "#F3F4F6", text: "#374151" };
  }
}

export default function DocumentProformasScreen() {
  const router = useRouter();
  const { data: appProformas, loading, error } = useProformas();

  const [archivedProformas, setArchivedProformas] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProformaStatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    fetchArchivedProformas().then(setArchivedProformas);
  }, []);

  const proformas = useMemo(() => {
    const normalizedArchives = archivedProformas.map(normalizeArchivedProforma);

    return [...(appProformas || []), ...normalizedArchives];
  }, [appProformas, archivedProformas]);

  const filteredProformas = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...(proformas || [])]
      .sort((a: any, b: any) => {
        let valueA: string | number;
        let valueB: string | number;

        switch (sortField) {
          case "number":
            valueA = a?.number || "";
            valueB = b?.number || "";
            break;

          case "client":
            valueA = getClientName(a);
            valueB = getClientName(b);
            break;

          case "eventDate":
            valueA = getDateTimestamp(getEventDate(a));
            valueB = getDateTimestamp(getEventDate(b));
            break;

          case "validityDate":
            valueA = getDateTimestamp(getValidityDate(a));
            valueB = getDateTimestamp(getValidityDate(b));
            break;

          case "amount":
            valueA = getProformaAmount(a);
            valueB = getProformaAmount(b);
            break;

          case "createdAt":
          default:
            valueA = getDateTimestamp(a?.createdAt ?? a?.issueDate);
            valueB = getDateTimestamp(b?.createdAt ?? b?.issueDate);
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
      .filter((proforma: any) => {
        const matchesStatus =
          statusFilter === "all" || proforma?.status === statusFilter;

        if (!matchesStatus) return false;

        if (!query) return true;

        const target = [
          proforma?.number,
          getClientName(proforma),
          getEventName(proforma),
          proforma?.orderNumber,
          proforma?.invoiceNumber,
          proforma?.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return target.includes(query);
      });
  }, [proformas, search, statusFilter, sortField, sortDirection]);

  const proformaStats = useMemo(() => {
    const totalProformas = filteredProformas.length;

    const totalAmount = filteredProformas.reduce(
      (sum: number, proforma: any) => sum + getProformaAmount(proforma),
      0,
    );

    const invoicedAmount = filteredProformas
      .filter((proforma: any) => proforma?.status === "invoiced")
      .reduce(
        (sum: number, proforma: any) => sum + getProformaAmount(proforma),
        0,
      );

    const pendingAmount = filteredProformas
      .filter((proforma: any) =>
        ["draft", "sent", "approved", "converted"].includes(proforma?.status),
      )
      .reduce(
        (sum: number, proforma: any) => sum + getProformaAmount(proforma),
        0,
      );

    return {
      totalProformas,
      totalAmount,
      invoicedAmount,
      pendingAmount,
    };
  }, [filteredProformas]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  }

  function renderSortableHeader(
    label: string,
    field: SortField,
    columnStyle: any,
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

  function openProforma(proforma: any) {
    if (proforma?.isHistorical) {
      router.push(`/(traiteur)/documents/history/${proforma.id}` as never);
      return;
    }

    router.push(`/(traiteur)/proformas/${proforma.id}` as never);
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
          <Text style={styles.statLabel}>Total proformas</Text>
          <Text style={styles.statValue}>{proformaStats.totalProformas}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Montant total</Text>
          <Text style={styles.statValue}>
            {formatAmount(proformaStats.totalAmount)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Facturées</Text>
          <Text style={styles.statValue}>
            {formatAmount(proformaStats.invoicedAmount)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>En attente</Text>
          <Text style={styles.statValue}>
            {formatAmount(proformaStats.pendingAmount)}
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
        <Text style={styles.loadingText}>Chargement des proformas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Erreur de chargement des proformas.
        </Text>
      </View>
    );
  }

  if (isMobile) {
    return (
      <View style={styles.container}>
        <View style={localStyles.mobileControls}>
        <MobileListHeader
          title="Proformas"
          total={proformaStats.totalProformas}
          onBack={() => router.replace("/(traiteur)/documents" as never)}
        />

        <MobileStatsBar
          items={[
              { label: "Montant total", value: formatAmount(proformaStats.totalAmount), wide: true },
              { label: "Facturées", value: formatAmount(proformaStats.invoicedAmount), wide: true },
              { label: "En attente", value: formatAmount(proformaStats.pendingAmount), wide: true }
          ]}
        />

        <MobileSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une proforma..."
        />

        <MobileFilterBar
          items={statusFilters}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        </View>

        <FlatList
          style={localStyles.mobileListFlex}
          data={filteredProformas}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.mobileList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune proforma trouvée.</Text>
          }
          renderItem={({ item }: any) => (
            <View style={styles.mobileCard}>
              <View style={styles.mobileCardHeader}>
                <Text style={styles.mobileDocumentNumber}>
                  {item?.number || "-"}
                </Text>

                {renderStatusBadge(item?.status)}
              </View>

              <Text style={styles.mobileClient}>{getClientName(item)}</Text>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Événement</Text>
                <Text style={styles.mobileValue}>{getEventName(item)}</Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Date événement</Text>
                <Text style={styles.mobileValue}>
                  {formatDate(getEventDate(item))}
                </Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Date création</Text>
                <Text style={styles.mobileValue}>
                  {formatDate(item?.createdAt)}
                </Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Validité</Text>
                <Text style={styles.mobileValue}>
                  {formatDate(getValidityDate(item))}
                </Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Commande</Text>
                <Text style={styles.mobileValue}>
                  {item?.orderNumber || "-"}
                </Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Facture</Text>
                <Text style={styles.mobileValue}>
                  {item?.invoiceNumber || "-"}
                </Text>
              </View>

              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Montant</Text>
                <Text style={styles.mobileAmount}>
                  {formatAmount(getProformaAmount(item))}
                </Text>
              </View>

              <View style={styles.mobileActions}>
                <TouchableOpacity
                  style={styles.mobileButton}
                  onPress={() => openProforma(item)}
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
                    <Text style={localStyles.noPdfBadgeText}>Sans PDF</Text>
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
        title="Proformas"
        subtitle="Consultez toutes les proformas créées et leurs informations principales."
        stats={[
          {
            label: "Total proformas",
            value: proformaStats.totalProformas,
          },
          {
            label: "Montant total",
            value: formatAmount(proformaStats.totalAmount),
          },
          {
            label: "Facturées",
            value: formatAmount(proformaStats.invoicedAmount),
          },
          {
            label: "En attente",
            value: formatAmount(proformaStats.pendingAmount),
          },
        ]}
      />

      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#6B7280" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par proforma, client, événement..."
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {renderFilters()}

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {renderSortableHeader("N° Proforma", "number", localStyles.colInvoice)}
            {renderSortableHeader("Client", "client", localStyles.colClient)}
            <Text style={[styles.th, localStyles.colEvent]}>Événement</Text>
            {renderSortableHeader(
              "Date événement",
              "eventDate",
              localStyles.colDate,
            )}
            {renderSortableHeader("Date création", "createdAt", localStyles.colDate)}
            {renderSortableHeader("Validité", "validityDate", localStyles.colDate)}
            {renderSortableHeader("Montant", "amount", localStyles.colAmount)}
            <Text style={[styles.th, localStyles.colStatus]}>Statut</Text>
            <Text style={[styles.th, localStyles.colDate]}>Commande</Text>
            <Text style={[styles.th, localStyles.colDate]}>Facture</Text>
            <Text style={[styles.th, localStyles.colActions]}>Actions</Text>
          </View>

          <FlatList
            data={filteredProformas}
            style={{
              flex: 1,
              minHeight: 0,
            }}
            keyExtractor={(item: any) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Aucune proforma trouvée.</Text>
              </View>
            }
            renderItem={({ item }: any) => (
              <View style={styles.tableRow}>
                <View style={localStyles.proformaNumberCell}>
                  <Text style={localStyles.proformaNumberText} numberOfLines={2}>
                    {item?.number || "-"}
                  </Text>

                  {item?.isHistorical && !hasPdf(item) && (
                    <View style={localStyles.noPdfBadge}>
                      <Text style={localStyles.noPdfBadgeText}>Sans PDF</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.td, localStyles.colClient]}>
                  {getClientName(item)}
                </Text>

                <Text style={[styles.td, localStyles.colEvent]}>
                  {getEventName(item)}
                </Text>

                <Text style={[styles.td, localStyles.colDate]}>
                  {formatDate(getEventDate(item))}
                </Text>

                <Text style={[styles.td, localStyles.colDate]}>
                  {formatDate(item?.createdAt)}
                </Text>

                <Text style={[styles.td, localStyles.colDate]}>
                  {formatDate(getValidityDate(item))}
                </Text>

                <Text style={[styles.td, localStyles.colAmount]}>
                  {formatAmount(getProformaAmount(item))}
                </Text>

                <View style={localStyles.colStatus}>
                  {renderStatusBadge(item?.status)}
                </View>

                <Text style={[styles.td, localStyles.colDate]}>
                  {item?.orderNumber || "-"}
                </Text>

                <Text style={[styles.td, localStyles.colDate]}>
                  {item?.invoiceNumber || "-"}
                </Text>

                <View style={[styles.actions, localStyles.colActions]}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openProforma(item)}
                  >
                    <MaterialIcons
                      name="visibility"
                      size={18}
                      color="#065F46"
                    />
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
  );
}

const localStyles = StyleSheet.create({
  mobileControls: {
    paddingTop: 2,
    paddingBottom: 6,
    backgroundColor: "#F4F6F8",
  },
  mobileListFlex: {
    flex: 1,
  },

  colInvoice: {
    width: 210,
  },

  colClient: {
    width: 160,
  },

  colDate: {
    width: 130,
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

  colEvent: {
    width: 220,
  },

  proformaNumberCell: {
    width: 210,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  proformaNumberText: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
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

  mobileButtonTextDisabled: {
    color: "#9CA3AF",
  },
});