// app/(traiteur)/invoices/index.tsx

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { formatShortDocumentDate } from "@/src/utils/dateFormat";
import { CateringInvoice } from "@/types/catering";

import {
  getCateringInvoices,
  cancelCateringInvoice,
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

  const totalAmount = useMemo(() => {
    return activeInvoices.reduce((sum, invoice) => {
      return sum + (invoice.totals?.total ?? 0);
    }, 0);
  }, [activeInvoices]);

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
      <ScrollView style={styles.container}>
        <TouchableOpacity
          onPress={() => router.replace("/(traiteur)/sales")}
          style={styles.backPill}
          activeOpacity={0.75}
        >
          <Text style={styles.backPillIcon}>←</Text>
          <Text style={styles.backPillText}>Retour aux ventes</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Factures</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Nombre total de factures</Text>
          <Text style={styles.summaryValue}>{invoices.length}</Text>

          <Text style={styles.summaryLabel}>Factures actives</Text>
          <Text style={styles.summaryValue}>{activeInvoices.length}</Text>

          <Text style={styles.summaryLabel}>
            Chiffre d’affaires facturé actif
          </Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>

          <Text style={styles.summaryHint}>
            Les factures annulées ou remplacées ne sont pas incluses.
          </Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par client, numéro, statut..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          {[
            { label: "Toutes", value: "all" },
            { label: "Émises", value: "issued" },
            { label: "Payées", value: "paid" },
            { label: "Partielles", value: "partial" },
            { label: "Annulées", value: "cancelled" },
            { label: "Remplacées", value: "replaced" },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterChip,
                statusFilter === item.value && styles.activeFilterChip,
              ]}
              onPress={() => setStatusFilter(item.value as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === item.value && styles.activeFilterChipText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {displayedInvoices.length === 0 ? (
          <Text style={styles.empty}>Aucune facture créée</Text>
        ) : (
          displayedInvoices.map((invoice) => {
            const statusColors = getStatusColors(invoice.status);

            return (
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

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColors.backgroundColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColors.color },
                      ]}
                    >
                      {getStatusLabel(invoice.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.line}>
                  Date facture : {formatShortDocumentDate(getInvoiceDate(invoice))}
                </Text>

                <Text style={styles.line}>
                  Créée le : {formatShortDocumentDate(invoice.createdAt)}
                </Text>

                {invoice.orderNumber ? (
                  <Text style={styles.line}>
                    Commande : {invoice.orderNumber}
                  </Text>
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
                    onPress={() => {
                      if (!invoice.id) return;

                      if (invoice.status === "draft") {
                        if ((invoice as any).documentType === "CREDIT_NOTE") {
                          router.push({
                            pathname:
                              "/(traiteur)/invoices/credit-note/edit/[id]",
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
                    }}
                  >
                    <Text style={styles.primaryActionText}>
                      {invoice.status === "draft" ? "Modifier" : "Voir"}
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
                      onPress={() => {
                        if (!invoice.id) return;

                        router.push({
                          pathname: "/(traiteur)/invoices/credit-note/[id]",
                          params: { id: String(invoice.id) },
                        });
                      }}
                    >
                      <Text style={styles.creditActionText}>Avoir</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
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
    padding: 16,
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    color: "#111827",
  },
  summaryCard: {
    backgroundColor: "#065F46",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    color: "#D1FAE5",
    fontSize: 13,
    marginBottom: 2,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  summaryAmount: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  summaryHint: {
    color: "#D1FAE5",
    fontSize: 12,
    marginTop: 8,
  },
  empty: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 40,
    marginBottom: 20,
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
    marginBottom: 12,
  },
  backPillIcon: {
    color: "#0F4C81",
    fontSize: 18,
    fontWeight: "800",
  },
  backPillText: {
    color: "#0F4C81",
    fontSize: 14,
    fontWeight: "700",
  },
});