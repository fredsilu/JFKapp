// app/(traiteur)/invoices/[id].tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import InvoiceAccountingNotice from "@/src/components/invoices/InvoiceAccountingNotice";

import { CateringInvoice } from "@/types/catering";
import { getCateringInvoiceById } from "@/src/services/cateringInvoice.service";

import { formatCurrency } from "@/src/utils/costs";
import { generateInvoicePDF } from "@/src/services/invoicePdf.service";
import { downloadHtmlAsPdfWeb } from "@/src/utils/downloadHtmlAsPdfWeb";
import { buildInvoiceHTML } from "@/src/utils/invoiceHtml";

type InvoiceItem = CateringInvoice["items"][number];

function toIsoDate(value: any): string {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (value?.toDate) {
    return value.toDate().toISOString();
  }

  return "";
}

function formatDate(value?: any) {
  const iso = toIsoDate(value);

  if (!iso) return "—";

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return iso;
  }

  return d.toLocaleDateString("fr-FR");
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "issued":
      return "Émise";
    case "partial":
      return "Partiellement payée";
    case "paid":
      return "Payée";
    case "replaced":
      return "Annule et remplacée";
    case "cancelled":
      return "Annulée";
    default:
      return status || "Émise";
  }
}

function getItemDays(item: InvoiceItem): number {
  return Number((item as any).numberOfDays ?? (item as any).days ?? 1);
}

function getItemTotal(item: InvoiceItem): number {
  return Number((item as any).total ?? (item as any).totalPrice ?? 0);
}

export default function InvoiceDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [invoice, setInvoice] = useState<CateringInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadInvoice = useCallback(async () => {
    if (!id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      router.back();
      return;
    }

    try {
      setLoading(true);

      const data = await getCateringInvoiceById(id);

      if (!data) {
        Alert.alert("Erreur", "Facture introuvable");
        router.back();
        return;
      }

      setInvoice(data);
    } catch (error) {
      console.error("❌ load invoice detail error:", error);
      Alert.alert("Erreur", "Impossible de charger la facture");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadInvoice();
    }, [loadInvoice])
  );

  async function handleGeneratePDF() {
    if (!invoice) return;

    const printWindow =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.open("", "_blank")
        : null;

    try {
      setPdfLoading(true);

      const totals: any = invoice.totals ?? {};

      const invoicePdfData: any = {
        ...invoice,

        invoiceNumber: invoice.number ?? "",
        date: toIsoDate(invoice.issuedAt),

        clientName: invoice.client?.name ?? "",
        clientRccm: invoice.client?.rccm ?? "",
        clientIdnat: invoice.client?.idNat ?? "",
        clientAddress: invoice.client?.address ?? "",
        clientCity: invoice.client?.cityCountry ?? "Kinshasa / RDC",

        subtotal: Number(totals.subtotal ?? 0),
        total: Number(totals.total ?? 0),

        discount: Number(totals.discount ?? 0),
        discountAmount: Number(
          totals.discountAmount ?? totals.discount ?? 0
        ),
        totalAfterDiscount: Number(
          totals.totalAfterDiscount ?? totals.total ?? 0
        ),

        status: invoice.status ?? "issued",

        items:
          invoice.items?.map((item: InvoiceItem) => ({
            label: item.label ?? "",
            quantity: Number(item.quantity ?? 0),
            unitPrice: Number((item as any).unitPrice ?? 0),
            days: getItemDays(item),
            numberOfDays: getItemDays(item),
            totalPrice: getItemTotal(item),
            total: getItemTotal(item),
          })) ?? [],
      };

      const filename = `Facture-${invoice.number || invoice.id || "client"}.pdf`;

      if (Platform.OS === "web") {
        const html = buildInvoiceHTML(invoicePdfData);
        downloadHtmlAsPdfWeb(html, filename, printWindow);
        return;
      }

      await generateInvoicePDF(invoicePdfData);
    } catch (error) {
      console.error("❌ PDF error:", error);
      Alert.alert("Erreur", "Impossible de générer le PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  function goToCancelInvoice() {
    if (!invoice?.id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      return;
    }

    router.push({
      pathname: "/(traiteur)/invoices/cancel/[id]",
      params: { id: invoice.id },
    });
  }

  function goToCreditNote() {
    if (!invoice?.id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      return;
    }

    router.push({
      pathname: "/(traiteur)/invoices/credit-note/[id]",
      params: { id: invoice.id },
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement de la facture...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text>Facture introuvable</Text>
      </View>
    );
  }

  const totals: any = invoice.totals ?? {};
  const discountAmount = Number(totals.discountAmount ?? totals.discount ?? 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Détail facture</Text>

      <InvoiceAccountingNotice status={invoice.status} />

      <View style={styles.headerCard}>
        <Text style={styles.number}>{invoice.number || "—"}</Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{getStatusLabel(invoice.status)}</Text>
        </View>

        <Text style={styles.client}>
          {invoice.client?.name || "Client non défini"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations client</Text>

        <Text style={styles.line}>RCCM : {invoice.client?.rccm || "—"}</Text>
        <Text style={styles.line}>IDNAT : {invoice.client?.idNat || "—"}</Text>
        <Text style={styles.line}>
          Adresse : {invoice.client?.address || "—"}
        </Text>
        <Text style={styles.line}>
          Ville : {invoice.client?.cityCountry || "Kinshasa / RDC"}
        </Text>
        <Text style={styles.line}>
          Date facture : {formatDate(invoice.issuedAt)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lignes facture</Text>

        {invoice.items?.length ? (
          invoice.items.map((item: InvoiceItem, index: number) => (
            <View
              key={`${item.label || "item"}-${index}`}
              style={styles.itemRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemLabel}>{item.label || "—"}</Text>

                <Text style={styles.itemSub}>
                  Jrs : {getItemDays(item)} × Qté : {item.quantity ?? 0} ×{" "}
                  {formatCurrency(Number((item as any).unitPrice ?? 0))}
                </Text>
              </View>

              <Text style={styles.itemTotal}>
                {formatCurrency(getItemTotal(item))}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Aucune ligne</Text>
        )}
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Sous-total</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(Number(totals.subtotal ?? 0))}
          </Text>
        </View>

        {discountAmount > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.discountLabel}>Remise</Text>
            <Text style={styles.discountValue}>
              - {formatCurrency(discountAmount)}
            </Text>
          </View>
        ) : null}

        <View style={styles.totalRow}>
          <Text style={styles.grandTotalLabel}>Total facture</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(Number(totals.total ?? 0))}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.pdfButton, pdfLoading && styles.disabledButton]}
        onPress={handleGeneratePDF}
        disabled={pdfLoading}
      >
        {pdfLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.pdfButtonText}>Générer PDF facture</Text>
        )}
      </TouchableOpacity>

      {invoice.status === "issued" ? (
        <>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={goToCancelInvoice}
          >
            <Text style={styles.cancelButtonText}>Annuler facture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.creditButton}
            onPress={goToCreditNote}
          >
            <Text style={styles.creditButtonText}>Créer un avoir</Text>
          </TouchableOpacity>
        </>
      ) : null}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/(traiteur)/invoices/index")}
      >
        <Text style={styles.backButtonText}>Retour aux factures</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F8", padding: 16 },
  center: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: { marginTop: 10, color: "#4B5563" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  headerCard: {
    backgroundColor: "#065F46",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  number: { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 8 },
  client: { color: "#D1FAE5", fontSize: 15, marginTop: 8 },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: { color: "#065F46", fontSize: 12, fontWeight: "800" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  line: { fontSize: 14, color: "#4B5563", marginBottom: 5 },
  empty: { color: "#6B7280", fontSize: 14 },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 10,
  },
  itemLabel: { fontSize: 14, fontWeight: "700", color: "#111827" },
  itemSub: { fontSize: 13, color: "#6B7280", marginTop: 3 },
  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginLeft: 10,
  },
  totalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: { fontSize: 14, color: "#4B5563" },
  totalValue: { fontSize: 14, fontWeight: "700", color: "#111827" },
  grandTotalLabel: { fontSize: 16, fontWeight: "900", color: "#111827" },
  grandTotalValue: { fontSize: 16, fontWeight: "900", color: "#111827" },
  pdfButton: {
    backgroundColor: "#286aa7",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  pdfButtonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  disabledButton: { opacity: 0.7 },
  backButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: { color: "#111827", fontWeight: "800", fontSize: 14 },
  discountLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
  discountValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#DC2626",
  },
  cancelButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  creditButton: {
    backgroundColor: "#D97706",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  creditButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
});