// app/(traiteur)/documents/proformas.tsx

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useProformas } from "@/src/hooks/useFirestore";

type ProformaStatusFilter =
  | "all"
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "converted"
  | "invoiced"
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
];

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

function getStatusLabel(status?: string) {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "sent":
      return "Envoyée";
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
    case "cancelled":
      return { background: "#FEE2E2", text: "#B91C1C" };
    default:
      return { background: "#F3F4F6", text: "#374151" };
  }
}

export default function DocumentProformasScreen() {
  const router = useRouter();
  const { data: proformas, loading, error } = useProformas();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ProformaStatusFilter>("all");

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const filteredProformas = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...(proformas || [])]
      .sort((a: any, b: any) => {
        const dateA =
          a?.createdAt?.toDate?.() ??
          new Date(a?.createdAt || a?.issueDate || 0);

        const dateB =
          b?.createdAt?.toDate?.() ??
          new Date(b?.createdAt || b?.issueDate || 0);

        return dateB.getTime() - dateA.getTime();
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
  }, [proformas, search, statusFilter]);

  const proformaStats = useMemo(() => {
    const totalProformas = filteredProformas.length;

    const totalAmount = filteredProformas.reduce(
      (sum: number, proforma: any) => sum + getProformaAmount(proforma),
      0
    );

    const invoicedAmount = filteredProformas
      .filter((proforma: any) => proforma?.status === "invoiced")
      .reduce(
        (sum: number, proforma: any) => sum + getProformaAmount(proforma),
        0
      );

    const pendingAmount = filteredProformas
      .filter((proforma: any) =>
        ["draft", "sent", "approved", "converted"].includes(proforma?.status)
      )
      .reduce(
        (sum: number, proforma: any) => sum + getProformaAmount(proforma),
        0
      );

    return {
      totalProformas,
      totalAmount,
      invoicedAmount,
      pendingAmount,
    };
  }, [filteredProformas]);

  function openProforma(proformaId: string) {
    router.push(`/(traiteur)/proformas/${proformaId}` as never);
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
        <Text style={styles.errorText}>Erreur de chargement des proformas.</Text>
      </View>
    );
  }

  if (isMobile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.breadcrumb}>Documents / Archives</Text>
          <Text style={styles.title}>Proformas</Text>
          <Text style={styles.subtitle}>
            Consultez toutes les proformas créées.
          </Text>
        </View>

        {renderStats()}

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#6B7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher proforma, client..."
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {renderFilters()}

        <Text style={styles.resultCount}>
          {filteredProformas.length} proforma(s)
        </Text>

        <FlatList
          data={filteredProformas}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.mobileList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune proforma trouvée.</Text>
          }
          renderItem={({ item }: any) => (
            <View style={styles.mobileCard}>
              <View style={styles.mobileCardHeader}>
                <Text style={styles.mobileInvoiceNumber}>
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
                  onPress={() => openProforma(item.id)}
                >
                  <MaterialIcons name="visibility" size={18} color="#065F46" />
                  <Text style={styles.mobileButtonText}>Voir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mobileButton}
                  onPress={() => console.log("PDF proforma", item.id)}
                >
                  <MaterialIcons
                    name="picture-as-pdf"
                    size={18}
                    color="#065F46"
                  />
                  <Text style={styles.mobileButtonText}>PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.breadcrumb}>Documents / Archives</Text>
        <Text style={styles.title}>Proformas</Text>
        <Text style={styles.subtitle}>
          Consultez toutes les proformas créées et leurs informations principales.
        </Text>
      </View>

      {renderStats()}

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

      <Text style={styles.resultCount}>
        {filteredProformas.length} proforma(s)
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colInvoice]}>N° Proforma</Text>
            <Text style={[styles.th, styles.colClient]}>Client</Text>
            <Text style={[styles.th, styles.colEvent]}>Événement</Text>
            <Text style={[styles.th, styles.colDate]}>Date événement</Text>
            <Text style={[styles.th, styles.colDate]}>Date création</Text>
            <Text style={[styles.th, styles.colDate]}>Validité</Text>
            <Text style={[styles.th, styles.colAmount]}>Montant</Text>
            <Text style={[styles.th, styles.colStatus]}>Statut</Text>
            <Text style={[styles.th, styles.colDate]}>Commande</Text>
            <Text style={[styles.th, styles.colDate]}>Facture</Text>
            <Text style={[styles.th, styles.colActions]}>Actions</Text>
          </View>

          <FlatList
            data={filteredProformas}
            keyExtractor={(item: any) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Aucune proforma trouvée.</Text>
              </View>
            }
            renderItem={({ item }: any) => (
              <View style={styles.tableRow}>
                <Text style={[styles.td, styles.colInvoice]}>
                  {item?.number || "-"}
                </Text>

                <Text style={[styles.td, styles.colClient]}>
                  {getClientName(item)}
                </Text>

                <Text style={[styles.td, styles.colEvent]}>
                  {getEventName(item)}
                </Text>

                <Text style={[styles.td, styles.colDate]}>
                  {formatDate(getEventDate(item))}
                </Text>

                <Text style={[styles.td, styles.colDate]}>
                  {formatDate(item?.createdAt)}
                </Text>

                <Text style={[styles.td, styles.colDate]}>
                  {formatDate(getValidityDate(item))}
                </Text>

                <Text style={[styles.td, styles.colAmount]}>
                  {formatAmount(getProformaAmount(item))}
                </Text>

                <View style={styles.colStatus}>
                  {renderStatusBadge(item?.status)}
                </View>

                <Text style={[styles.td, styles.colDate]}>
                  {item?.orderNumber || "-"}
                </Text>

                <Text style={[styles.td, styles.colDate]}>
                  {item?.invoiceNumber || "-"}
                </Text>

                <View style={[styles.actions, styles.colActions]}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openProforma(item.id)}
                  >
                    <MaterialIcons name="visibility" size={18} color="#065F46" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => console.log("PDF proforma", item.id)}
                  >
                    <MaterialIcons
                      name="picture-as-pdf"
                      size={18}
                      color="#065F46"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  breadcrumb: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#064E3B",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  searchBox: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  table: {
    minWidth: 1510,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2F6B4F",
    minHeight: 44,
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 54,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  th: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 10,
  },
  td: {
    color: "#111827",
    fontSize: 13,
    paddingHorizontal: 10,
  },
  colInvoice: {
    width: 130,
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
  actions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    padding: 24,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 8,
    color: "#6B7280",
  },
  errorText: {
    color: "#DC2626",
    fontWeight: "600",
  },
  mobileList: {
    gap: 12,
    paddingBottom: 24,
  },
  mobileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mobileInvoiceNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: "#064E3B",
  },
  mobileClient: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  mobileInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 5,
  },
  mobileLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  mobileValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    color: "#111827",
  },
  mobileAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  mobileActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  mobileButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  mobileButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065F46",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    maxWidth: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#064E3B",
  },
  filterBarWrapper: {
    marginBottom: 14,
  },
  filterBar: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: "#065F46",
    borderColor: "#065F46",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    lineHeight: 16,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  resultCount: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
});