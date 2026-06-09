// app/(traiteur)/invoices/[id].tsx
import React, { useCallback, useState } from "react";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
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
import {
  CreditNote,
  getCreditNotesByInvoiceId,
} from "@/src/services/creditNote.service";
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
      return "Annulée et remplacée";
    case "cancelled":
      return "Annulée";
    default:
      return status || "Émise";
  }
}

function getItemDays(item: InvoiceItem): number {
  const days = Number((item as any).numberOfDays ?? (item as any).days ?? 1);
  return Number.isFinite(days) && days > 0 ? days : 1;
}

function getItemTotal(item: InvoiceItem): number {
  const total = Number((item as any).total ?? (item as any).totalPrice ?? 0);
  return Number.isFinite(total) ? total : 0;
}

export default function InvoiceDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);

  const [invoice, setInvoice] = useState<CateringInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadInvoice = useCallback(async () => {
    if (!id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      router.replace("/(traiteur)/invoices");
      return;
    }

    try {
      setLoading(true);

      const data = await getCateringInvoiceById(id);

      if (!data) {
        Alert.alert("Erreur", "Facture introuvable");
        router.replace("/(traiteur)/invoices");
        return;
      }

      setInvoice(data);
      const notes = await getCreditNotesByInvoiceId(data.id ?? id);
      setCreditNotes(notes);
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


  const isFullyCredited =
    invoice?.creditNoteSummary?.isFullyCredited === true;

  const canCancel =
    invoice?.status === "issued" && !isFullyCredited;

  const hasDraftCreditNote =
    creditNotes.some((n) => n.status === "draft");

  const canCreateCreditNote =
    invoice?.status === "issued" &&
    !isFullyCredited &&
    !hasDraftCreditNote;

  const canReplace =
    invoice?.status === "issued" && !isFullyCredited;
  function getInvoicePdfFileName(invoice: CateringInvoice) {
    const documentType = (invoice as any)?.documentType;
    const status = invoice?.status;

    const number = invoice?.number || invoice?.id || 'document';
    const eventName =
      (invoice as any).eventName ||
      invoice.designation ||
      invoice.client?.name ||
      'Evenement';

    if (documentType === 'CREDIT_NOTE') {
      return `AVOIR_${number}.pdf`;
    }

    if (status === 'cancelled') {
      return `FACTURE_ANNULEE_${number}.pdf`;
    }

    if (status === 'replaced') {
      return `FACTURE_REMPLACEE_${number}.pdf`;
    }

    return `FACTURE_${number}.pdf`;
  }
  async function getImageSource(moduleId: number): Promise<string> {
    const asset = Asset.fromModule(moduleId);

    await asset.downloadAsync();

    const uri = asset.localUri || asset.uri;

    if (Platform.OS === "web") {
      return uri;
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    return `data:image/png;base64,${base64}`;
  }

  async function handleGeneratePDF() {
    if (!invoice) return;

    const printWindow =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.open("", "_blank")
        : null;

    try {
      setPdfLoading(true);

      const logoBase64 = await getImageSource(
        require("@/assets/images/crepolia-logo.png")
      );

      let stampBase64 = "";
      let signatureBase64 = "";

      try {
        stampBase64 = await getImageSource(
          require("@/assets/images/crepolia-stamp.png")
        );
      } catch { }

      try {
        signatureBase64 = await getImageSource(
          require("@/assets/images/crepolia-signature.png")
        );
      } catch { }

      const totals: any = invoice.totals ?? {};
      const client: any = invoice.client ?? {};

      const invoicePdfData: any = {
        ...invoice,

        invoiceNumber: invoice.number ?? "",
        date:
          toIsoDate(invoice.issuedAt) ||
          toIsoDate(invoice.createdAt) ||
          new Date().toISOString(),

        documentType: invoice.documentType,
        status: invoice.status ?? "issued",

        clientName: client.name ?? "",
        clientRccm: client.rccm ?? client.RCCM ?? "",
        clientIdNat: client.idNat ?? client.idnat ?? client.idNAT ?? "",
        clientNif: client.nif ?? client.NIF ?? "",
        clientAddress: client.address ?? "",
        clientCity: client.city ?? "Kinshasa / RDC",

        subtotal: Number(totals.subtotal ?? totals.totalHT ?? 0),
        discount: Number(totals.discount ?? 0),
        discountAmount: Number(totals.discountAmount ?? totals.discount ?? 0),
        totalAfterDiscount: Number(
          totals.totalAfterDiscount ?? totals.total ?? totals.subtotal ?? 0
        ),
        total: Number(totals.total ?? totals.totalAfterDiscount ?? 0),

        items:
          invoice.items?.map((item: InvoiceItem) => {
            const days = getItemDays(item);
            const quantity = Number(item.quantity ?? 0);
            const unitPrice = Number((item as any).unitPrice ?? 0);
            const total = getItemTotal(item);

            return {
              label: item.label ?? (item as any).name ?? "",
              quantity,
              unitPrice,
              days,
              numberOfDays: days,
              totalPrice: total,
              total,
            };
          }) ?? [],
      };

      invoicePdfData.logoBase64 = logoBase64;
      invoicePdfData.stampBase64 = stampBase64;
      invoicePdfData.signatureBase64 = signatureBase64;

      const filename = getInvoicePdfFileName(invoice);

      if (Platform.OS === "web") {
        const html = buildInvoiceHTML(invoicePdfData, {
          logoBase64,
          stampBase64,
          signatureBase64,
        });
        downloadHtmlAsPdfWeb(html, filename, printWindow ?? undefined);
        return;
      }

      await generateInvoicePDF(invoicePdfData, filename);
    } catch (error) {
      console.error("❌ PDF error:", error);
      Alert.alert("Erreur", "Impossible de générer le PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  function goToReplaceInvoice() {
    if (!invoice?.id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      return;
    }

    router.push({
      pathname: "/(traiteur)/invoices/replace/[id]",
      params: { id: invoice.id },
    });
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

  function goToInvoiceHistory() {
    if (!invoice?.id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      return;
    }

    router.push({
      pathname: "/(traiteur)/invoices/history/[id]",
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

      {invoice.correction?.replacesInvoiceNumber ? (
        <View style={styles.relationCard}>
          <Text style={styles.relationLabel}>
            Facture remplacée
          </Text>

          <Text style={styles.relationValue}>
            Cette facture annule et remplace :
          </Text>

          <Text style={styles.relationNumber}>
            {invoice.correction.replacesInvoiceNumber}
          </Text>
        </View>
      ) : null}

      {invoice.correction?.replacedByInvoiceNumber ? (
        <View style={styles.relationCard}>
          <Text style={styles.relationLabel}>
            Facture remplacée
          </Text>

          <Text style={styles.relationValue}>
            Cette facture a été remplacée par :
          </Text>

          <Text style={styles.relationNumber}>
            {invoice.correction.replacedByInvoiceNumber}
          </Text>
        </View>
      ) : null}


      {invoice.cancellation ? (
        <View style={styles.auditCard}>
          <Text style={styles.auditTitle}>
            Informations d’annulation
          </Text>

          <Text style={styles.line}>
            Motif : {invoice.cancellation.reason || "—"}
          </Text>

          <Text style={styles.line}>
            Date :
            {" "}
            {formatDate(invoice.cancellation.cancelledAt)}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations client</Text>

        <Text style={styles.line}>RCCM : {invoice.client?.rccm || "—"}</Text>
        <Text style={styles.line}>idNat : {invoice.client?.idNat || "—"}</Text>
        <Text style={styles.line}>
          NIF : {invoice.client?.nif || "—"}
        </Text>

        <Text style={styles.line}>
          Adresse : {invoice.client?.address || "—"}
        </Text>
        <Text style={styles.line}>
          Ville : {invoice.client?.city || "Kinshasa / RDC"}
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

      {invoice.creditNoteSummary ? (
        <View style={styles.creditSummaryCard}>
          <Text style={styles.sectionTitle}>Avoirs</Text>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total des avoirs</Text>
            <Text style={styles.creditSummaryValue}>
              - {formatCurrency(invoice.creditNoteSummary.totalCredited ?? 0)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Solde créditable</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.creditNoteSummary.remainingCreditableAmount ?? 0)}
            </Text>
          </View>

          {invoice.creditNoteSummary.lastCreditNoteNumber ? (
            <Text style={styles.line}>
              Dernier avoir : {invoice.creditNoteSummary.lastCreditNoteNumber}
            </Text>
          ) : null}

          {invoice.creditNoteSummary.isFullyCredited ? (
            <Text style={styles.auditWarning}>
              Cette facture est totalement couverte par un avoir.
            </Text>
          ) : null}
        </View>
      ) : null}

      {creditNotes.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Liste des avoirs</Text>

          {creditNotes.map((note) => (
            <View key={note.id} style={styles.creditNoteRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.creditNoteNumber}>{note.number}</Text>

                <Text style={styles.creditNoteReason}>
                  {note.reason || "Avoir"}
                </Text>

                <Text style={styles.creditNoteType}>
                  {note.type === "full" ? "Avoir total" : "Avoir partiel"}
                </Text>

                {note.id ? (
                  <TouchableOpacity
                    style={styles.editCreditNoteButton}
                    onPress={() =>
                      router.push({
                        pathname:
                          note.status === "draft"
                            ? "/(traiteur)/invoices/credit-note/edit/[id]"
                            : "/(traiteur)/invoices/credit-note/view/[id]",
                        params: { id: String(note.id) },
                      })
                    }
                  >
                    <Text style={styles.editCreditNoteButtonText}>
                      {note.status === "draft" ? "Modifier" : "Voir"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.creditNoteAmount}>
                - {formatCurrency(Number(note.amount ?? 0))}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

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

      {canCancel ? (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={goToCancelInvoice}
        >
          <Text style={styles.cancelButtonText}>
            Annuler facture
          </Text>
        </TouchableOpacity>
      ) : null}

      {canReplace ? (
        <TouchableOpacity
          style={styles.replaceButton}
          onPress={goToReplaceInvoice}
        >
          <Text style={styles.replaceButtonText}>
            Annule et remplace
          </Text>
        </TouchableOpacity>
      ) : null}

      {canCreateCreditNote ? (
        <TouchableOpacity
          style={styles.creditButton}
          onPress={goToCreditNote}
        >
          <Text style={styles.creditButtonText}>
            Créer un avoir
          </Text>
        </TouchableOpacity>
      ) : null}


      <TouchableOpacity
        style={styles.historyButton}
        onPress={goToInvoiceHistory}
      >
        <Text style={styles.historyButtonText}>Voir historique</Text>
      </TouchableOpacity>


      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/(traiteur)/invoices")}
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
  relationCard: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },

  relationLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#4338CA",
    marginBottom: 4,
    textTransform: "uppercase",
  },

  relationValue: {
    fontSize: 14,
    color: "#312E81",
  },

  relationNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginTop: 6,
  },
  historyButton: {
    backgroundColor: "#374151",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  historyButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  creditSummaryCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },

  creditSummaryValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#D97706",
  },
  auditWarning: {
    marginTop: 8,
    fontSize: 12,
    color: "#92400E",
    fontWeight: "800",
    lineHeight: 18,
  },
  creditNoteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 10,
  },

  creditNoteNumber: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  creditNoteReason: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 3,
  },

  creditNoteType: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "800",
    marginTop: 3,
  },

  creditNoteAmount: {
    fontSize: 14,
    fontWeight: "900",
    color: "#D97706",
    marginLeft: 10,
  },
  replaceButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  replaceButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  auditCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },

  auditTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#991B1B",
    marginBottom: 8,
  },
  editCreditNoteButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },

  editCreditNoteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

});