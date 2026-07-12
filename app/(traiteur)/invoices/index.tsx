// app/(traiteur)/invoices/index.tsx

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import MobileListHeader from "@/src/components/mobile/MobileListHeader";
import MobileStatsBar from "@/src/components/mobile/MobileStatsBar";
import MobileSearchBar from "@/src/components/mobile/MobileSearchBar";
import MobileFilterBar from "@/src/components/mobile/MobileFilterBar";


import { formatShortDocumentDate } from "@/src/utils/dateFormat";
import { CateringInvoice } from "@/types/catering";

import {
  cancelCateringInvoice,
  getCateringInvoices,
} from "@/src/services/cateringInvoice.service";

import { formatCurrency } from "@/src/utils/costs";

type InvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "cancelled"
  | "partial"
  | "replaced";

function getInvoiceDate(invoice: any) {
  return (
    invoice?.issuedAt ??
    invoice?.invoiceDate ??
    invoice?.dateFacture ??
    invoice?.createdAt ??
    null
  );
}

function getDateMillis(value: any): number {
  if (!value) return 0;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export default function InvoicesScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [invoices, setInvoices] = useState<CateringInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<CateringInvoice | null>(null);

  const [cancelReason, setCancelReason] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | InvoiceStatus>("all");

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getCateringInvoices();

      const sorted = [...data].sort((a, b) => {
        const aTime = getDateMillis(getInvoiceDate(a));
        const bTime = getDateMillis(getInvoiceDate(b));
        return bTime - aTime;
      });

      setInvoices(sorted);
    } catch (e) {
      console.error("❌ load invoices error:", e);
      Alert.alert("Erreur", "Impossible de charger les factures");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices])
  );

  const activeInvoices = useMemo(() => {
    return invoices.filter(
      (invoice) =>
        invoice.status !== "cancelled" && invoice.status !== "replaced"
    );
  }, [invoices]);

  const issuedInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status === "issued");
  }, [invoices]);

  const paidInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status === "paid");
  }, [invoices]);

  const partialInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status === "partial");
  }, [invoices]);

  const totalAmount = useMemo(() => {
    return activeInvoices.reduce((sum, invoice) => {
      return sum + (invoice.totals?.total ?? 0);
    }, 0);
  }, [activeInvoices]);

  const paidAmount = useMemo(() => {
    return paidInvoices.reduce((sum, invoice) => {
      return sum + (invoice.totals?.total ?? 0);
    }, 0);
  }, [paidInvoices]);

  const pendingAmount = useMemo(() => {
    return [...issuedInvoices, ...partialInvoices].reduce((sum, invoice) => {
      return sum + (invoice.totals?.total ?? 0);
    }, 0);
  }, [issuedInvoices, partialInvoices]);

  const displayedInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;

      const searchable = [
        invoice.number,
        invoice.client?.name,
        invoice.orderNumber,
        invoice.proformaNumber,
        invoice.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || searchable.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [invoices, search, statusFilter]);

  function getStatusLabel(status?: string) {
    switch (status) {
      case "draft":
        return "Brouillon";
      case "issued":
        return "Émise";
      case "paid":
        return "Payée";
      case "cancelled":
        return "Annulée";
      case "partial":
        return "Partiellement payée";
      case "replaced":
        return "Annulée et remplacée";
      default:
        return status || "Émise";
    }
  }

  function getStatusColors(status?: string) {
    switch (status as InvoiceStatus) {
      case "draft":
        return {
          backgroundColor: "#E5E7EB",
          color: "#374151",
        };

      case "issued":
        return {
          backgroundColor: "#DBEAFE",
          color: "#1D4ED8",
        };

      case "paid":
        return {
          backgroundColor: "#D1FAE5",
          color: "#065F46",
        };

      case "partial":
        return {
          backgroundColor: "#FEF3C7",
          color: "#92400E",
        };

      case "cancelled":
        return {
          backgroundColor: "#FEE2E2",
          color: "#991B1B",
        };

      case "replaced":
        return {
          backgroundColor: "#F3E8FF",
          color: "#6B21A8",
        };

      default:
        return {
          backgroundColor: "#E5E7EB",
          color: "#374151",
        };
    }
  }

  function canCancel(invoice: CateringInvoice) {
    return invoice.status === "issued";
  }

  function canCredit(invoice: CateringInvoice) {
    return invoice.status === "issued";
  }

  function openCancelModal(invoice: CateringInvoice) {
    setSelectedInvoice(invoice);
    setCancelReason("");
    setCancelModalVisible(true);
  }

  function openInvoice(invoice: CateringInvoice) {
    if (!invoice.id) return;

    if (invoice.status === "draft") {
      if ((invoice as any).documentType === "CREDIT_NOTE") {
        router.push({
          pathname: "/(traiteur)/invoices/credit-note/edit/[id]",
          params: { id: String(invoice.id) },
        });
        return;
      }

      router.push({
        pathname: "/(traiteur)/invoices/edit-v2/[id]",
        params: { id: String(invoice.id) },
      });
      return;
    }

    router.push({
      pathname: "/(traiteur)/invoices/[id]",
      params: { id: String(invoice.id) },
    });
  }



  function createCreditNote(invoice: CateringInvoice) {
    if (!invoice.id) return;

    router.push({
      pathname: "/(traiteur)/invoices/credit-note/[id]",
      params: { id: String(invoice.id) },
    });
  }

  async function handleCancelInvoice() {
    try {
      if (!selectedInvoice?.id) return;

      if (!cancelReason || cancelReason.trim().length < 3) {
        Alert.alert("Erreur", "Veuillez saisir un motif valide");
        return;
      }

      await cancelCateringInvoice(selectedInvoice.id, cancelReason.trim());

      setCancelModalVisible(false);
      setSelectedInvoice(null);
      setCancelReason("");

      Alert.alert("Succès", "Facture annulée");

      loadInvoices();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Erreur lors de l’annulation");
    }
  }

  function renderStatusBadge(invoice: CateringInvoice) {
    const statusColors = getStatusColors(invoice.status);

    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusColors.backgroundColor },
        ]}
      >
        <Text style={[styles.statusText, { color: statusColors.color }]}>
          {getStatusLabel(invoice.status)}
        </Text>
      </View>
    );
  }

  const filterItems: { label: string; value: "all" | InvoiceStatus }[] = [
    { label: "Toutes", value: "all" },
    { label: "Brouillons", value: "draft" },
    { label: "Émises", value: "issued" },
    { label: "Payées", value: "paid" },
    { label: "Partielles", value: "partial" },
    { label: "Annulées", value: "cancelled" },
    { label: "Remplacées", value: "replaced" },
  ];
const RootContainer: any = isDesktop ? ScrollView : View;
  if (loading) {
    

  return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement des factures...</Text>
      </View>
    );
  }

  return (
    <>
      <RootContainer
        style={styles.container}
        {...(isDesktop
          ? { contentContainerStyle: [styles.content, styles.desktopContent] }
          : {})}
      >
        <View style={!isDesktop ? styles.mobileStickyControls : undefined}>
        {isDesktop ? (
          <>
            <TouchableOpacity
              onPress={() => router.replace("/(traiteur)/sales")}
              style={styles.backPill}
              activeOpacity={0.75}
            >
              <Icon name="arrow-back" size={18} color="#0F4C81" />
              <Text style={styles.backPillText}>Retour aux ventes</Text>
            </TouchableOpacity>

            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Factures</Text>
                <Text style={styles.subtitle}>
                  Suivez les factures émises, payées, annulées et remplacées.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <MobileListHeader
            title="Factures"
            total={invoices.length}
            onBack={() => router.replace("/(traiteur)/sales")}
          />
        )}

        {isDesktop ? (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="receipt-long" size={24} color="#007AFF" />
              <View>
                <Text style={styles.statLabel}>Total factures</Text>
                <Text style={styles.statValue}>{invoices.length}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Icon name="verified" size={24} color="#065F46" />
              <View>
                <Text style={styles.statLabel}>Factures actives</Text>
                <Text style={styles.statValue}>{activeInvoices.length}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Icon name="attach-money" size={24} color="#16A34A" />
              <View>
                <Text style={styles.statLabel}>CA facturé actif</Text>
                <Text style={styles.statValue}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Icon name="payments" size={24} color="#1D4ED8" />
              <View>
                <Text style={styles.statLabel}>Payées</Text>
                <Text style={styles.statValue}>{formatCurrency(paidAmount)}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Icon name="schedule" size={24} color="#D97706" />
              <View>
                <Text style={styles.statLabel}>En attente</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(pendingAmount)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <MobileStatsBar
            items={[
              { label: "Total", value: invoices.length },
              { label: "Actives", value: activeInvoices.length },
              { label: "CA actif", value: formatCurrency(totalAmount), wide: true },
              { label: "Payées", value: formatCurrency(paidAmount), wide: true },
              { label: "En attente", value: formatCurrency(pendingAmount), wide: true },
            ]}
          />
        )}

        {isDesktop ? (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par client, numéro, statut..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
            <View style={styles.filterRow}>
              {filterItems.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.filterChip, statusFilter === item.value && styles.activeFilterChip]}
                  onPress={() => setStatusFilter(item.value)}
                >
                  <Text style={[styles.filterChipText, statusFilter === item.value && styles.activeFilterChipText]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <MobileSearchBar value={search} onChangeText={setSearch} placeholder="Rechercher une facture..." />
            <MobileFilterBar items={filterItems} value={statusFilter} onChange={setStatusFilter} />
          </>
        )}

        </View>

        <ScrollView
          style={!isDesktop ? styles.mobileListScroll : undefined}
          contentContainerStyle={!isDesktop ? styles.mobileListContent : undefined}
          nestedScrollEnabled
          scrollEnabled={!isDesktop}
          showsVerticalScrollIndicator={false}
        >
        {displayedInvoices.length === 0 ? (
          <Text style={styles.empty}>Aucune facture créée</Text>
        ) : isDesktop ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.horizontalTableContent}
          >
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.colNumber]}>N° Facture</Text>
                <Text style={[styles.th, styles.colClient]}>Client</Text>
                <Text style={[styles.th, styles.colDate]}>Date</Text>
                <Text style={[styles.th, styles.colAmount]}>Montant</Text>
                <Text style={[styles.th, styles.colStatus]}>Statut</Text>
                <Text style={[styles.th, styles.colRef]}>Proforma</Text>
                <Text style={[styles.th, styles.colRef]}>Commande</Text>
                <Text style={[styles.th, styles.colActions]}>Actions</Text>
              </View>

              {displayedInvoices.map((invoice) => (
                <View key={invoice.id || invoice.number} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNumber]} numberOfLines={1}>
                    {invoice.number || "—"}
                  </Text>

                  <Text style={[styles.td, styles.colClient]} numberOfLines={1}>
                    {invoice.client?.name || "Client non défini"}
                  </Text>

                  <Text style={[styles.td, styles.colDate]}>
                    {formatShortDocumentDate(getInvoiceDate(invoice))}
                  </Text>

                  <Text style={[styles.td, styles.colAmount]}>
                    {formatCurrency(invoice.totals?.total ?? 0)}
                  </Text>

                  <View style={styles.colStatus}>
                    {renderStatusBadge(invoice)}
                  </View>

                  <Text style={[styles.td, styles.colRef]} numberOfLines={1}>
                    {invoice.proformaNumber || "—"}
                  </Text>

                  <Text style={[styles.td, styles.colRef]} numberOfLines={1}>
                    {invoice.orderNumber || "—"}
                  </Text>

                  <View style={[styles.rowActions, styles.colActions]}>
                    <TouchableOpacity
                      style={styles.smallActionButton}
                      onPress={() => openInvoice(invoice)}
                    >
                      <Icon
                        name={invoice.status === "draft" ? "edit" : "visibility"}
                        size={16}
                        color="#007AFF"
                      />
                      <Text style={styles.smallActionText}>
                        {invoice.status === "draft" ? "Modifier" : "Voir"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pdfActionButton}
                      onPress={() =>
                        router.push({
                          pathname: "/(traiteur)/invoices/[id]",
                          params: { id: String(invoice.id) },
                        })
                      }
                    >
                      <Icon name="picture-as-pdf" size={16} color="#059669" />
                      <Text style={styles.pdfActionButtonText}>Voir PDF</Text>
                    </TouchableOpacity>
                    {canCancel(invoice) ? (
                      <TouchableOpacity
                        style={styles.cancelActionButton}
                        onPress={() => openCancelModal(invoice)}
                      >
                        <Icon name="close" size={16} color="#DC2626" />
                        <Text style={styles.cancelActionButtonText}>Annuler</Text>
                      </TouchableOpacity>
                    ) : null}

                    {canCredit(invoice) ? (
                      <TouchableOpacity
                        style={styles.creditActionButton}
                        onPress={() => createCreditNote(invoice)}
                      >
                        <Icon name="keyboard-return" size={16} color="#D97706" />
                        <Text style={styles.creditActionButtonText}>Avoir</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          displayedInvoices.map((invoice) => (
            <View key={invoice.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {invoice.number || "Facture sans numéro"}
                  </Text>

                  <Text style={styles.client}>
                    {invoice.client?.name || "Client non défini"}
                  </Text>
                </View>

                {renderStatusBadge(invoice)}
              </View>

              {invoice.status === "draft" ? (
                <Text style={styles.line}>
                  Créée le : {formatShortDocumentDate(invoice.createdAt)}
                </Text>
              ) : (
                <Text style={styles.line}>
                  Date facture :{" "}
                  {formatShortDocumentDate(getInvoiceDate(invoice))}
                </Text>
              )}

              {invoice.orderNumber ? (
                <Text style={styles.line}>Commande : {invoice.orderNumber}</Text>
              ) : null}

              {invoice.proformaNumber ? (
                <Text style={styles.line}>
                  Proforma : {invoice.proformaNumber}
                </Text>
              ) : null}

              <Text style={styles.amount}>
                Total : {formatCurrency(invoice.totals?.total ?? 0)}
              </Text>

              {invoice.status === "cancelled" ? (
                <Text style={styles.auditWarning}>
                  Facture annulée — exclue du chiffre d’affaires actif.
                </Text>
              ) : null}

              {invoice.status === "replaced" ? (
                <Text style={styles.auditWarning}>
                  Facture remplacée — exclue du chiffre d’affaires actif.
                </Text>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => openInvoice(invoice)}
                >
                  <Text style={styles.primaryActionText}>
                    {invoice.status === "draft" ? "Modifier" : "Voir"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pdfAction}
                  onPress={() =>
                    router.push({
                      pathname: "/(traiteur)/invoices/[id]",
                      params: { id: String(invoice.id) },
                    })
                  }
                >
                  <Text style={styles.pdfActionText}>
                    Voir PDF
                  </Text>
                </TouchableOpacity>

                {canCancel(invoice) ? (
                  <TouchableOpacity
                    style={styles.cancelAction}
                    onPress={() => openCancelModal(invoice)}
                  >
                    <Text style={styles.cancelActionText}>Annuler</Text>
                  </TouchableOpacity>
                ) : null}

                {canCredit(invoice) ? (
                  <TouchableOpacity
                    style={styles.creditAction}
                    onPress={() => createCreditNote(invoice)}
                  >
                    <Text style={styles.creditActionText}>Avoir</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))
        )}

        </ScrollView>
        {isDesktop ? <View style={{ height: 40 }} /> : null}
      </RootContainer>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              isDesktop && styles.desktopModalCard,
            ]}
          >
            <Text style={styles.modalTitle}>Annuler la facture</Text>

            <Text style={styles.modalText}>
              Motif obligatoire de l’annulation
            </Text>

            <TextInput
              style={styles.input}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Ex : erreur de montant, facture remplacée..."
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryModalButton}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.secondaryModalButtonText}>Fermer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerModalButton}
                onPress={handleCancelInvoice}
              >
                <Text style={styles.primaryModalButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },

  content: {
    flexGrow: 1,
    paddingBottom: 0,
  },

  desktopContent: {
    paddingBottom: 30,
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
  },

  center: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  loadingText: {
    marginTop: 10,
    color: "#4B5563",
  },


  mobileHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  mobileBackButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#EEF6FF",
  },

  mobileTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  mobileHeaderSpacer: { width: 40 },

  mobileStatsRow: {
    gap: 8,
    paddingBottom: 10,
  },

  mobileStatCard: {
    minWidth: 78,
    height: 58,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#065F46",
    alignItems: "center",
    justifyContent: "center",
  },

  mobileStatCardWide: {
    minWidth: 118,
    height: 58,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#065F46",
    alignItems: "center",
    justifyContent: "center",
  },

  mobileStatValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  mobileStatAmount: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  mobileStatLabel: {
    color: "#D1FAE5",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },

  backPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 20,
  },

  backPillText: {
    color: "#0F4C81",
    fontSize: 14,
    fontWeight: "700",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    minHeight: 96,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  summaryCard: {
    width: "48%",
    backgroundColor: "#065F46",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },

  summaryLabel: {
    color: "#D1FAE5",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },

  summarySubLabel: {
    color: "#D1FAE5",
    fontSize: 11,
    marginTop: 2,
  },

  summaryValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  summaryAmount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  summaryHint: {
    display: "none",
  },

  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    marginBottom: 10,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  filterChip: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  activeFilterChip: {
    backgroundColor: "#111827",
  },

  filterChipText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "800",
  },

  activeFilterChipText: {
    color: "#fff",
  },

  empty: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 40,
    marginBottom: 20,
  },

  table: {
    minWidth: 1500,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  tableHeader: {
    flexDirection: "row",
    minHeight: 44,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 66,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  th: {
    fontSize: 13,
    fontWeight: "800",
    color: "#374151",
    paddingHorizontal: 12,
  },

  td: {
    fontSize: 13,
    color: "#111827",
    paddingHorizontal: 12,
  },

  colNumber: {
    width: 150,
  },

  colClient: {
    width: 190,
  },

  colDate: {
    width: 130,
  },

  colAmount: {
    width: 140,
    textAlign: "right",
  },

  colStatus: {
    width: 160,
    justifyContent: "center",
  },

  colRef: {
    width: 130,
  },

  colActions: {
    width: 420,
  },

  rowActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  smallActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  smallActionText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "700",
  },

  cancelActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  cancelActionButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },

  creditActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FED7AA",
    backgroundColor: "#FFF7ED",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  creditActionButtonText: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  client: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  line: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },

  amount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginTop: 6,
  },

  auditWarning: {
    marginTop: 6,
    fontSize: 12,
    color: "#991B1B",
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    marginTop: 14,
  },

  primaryAction: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },

  primaryActionText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  cancelAction: {
    flex: 1,
    backgroundColor: "#DC2626",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },

  cancelActionText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  creditAction: {
    flex: 1,
    backgroundColor: "#D97706",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },

  creditActionText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },

  desktopModalCard: {
    maxWidth: 520,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },

  modalText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 10,
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },

  modalActions: {
    flexDirection: "row",
    marginTop: 16,
  },

  secondaryModalButton: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
  },

  secondaryModalButtonText: {
    color: "#111827",
    fontWeight: "800",
  },

  dangerModalButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  primaryModalButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  pdfActionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  pdfActionButtonText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
  },

  pdfAction: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },

  pdfActionText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  horizontalTableContent: {
    paddingBottom: 12,
  },

  mobileStickyControls: {
    backgroundColor: "#F4F6F8",
    paddingTop: 2,
    paddingBottom: 6,
    zIndex: 1,
  },
  mobileListScroll: {
    flex: 1,
    overflow: "hidden",
  },
  mobileListContent: {
    paddingTop: 8,
    paddingBottom: 30,
  },
});