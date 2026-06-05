// app/(traiteur)/invoices/credit-note/[id].tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { CateringInvoice } from "@/types/catering";
import { getCateringInvoiceById } from "@/src/services/cateringInvoice.service";
import { createDraftCreditNote } from "@/src/services/creditNote.service";
import { formatCurrency } from "@/src/utils/costs";

export default function CreateCreditNoteScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [invoice, setInvoice] = useState<CateringInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const loadInvoice = useCallback(async () => {
    if (!id) {
      Alert.alert("Erreur", "Identifiant introuvable");
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
    } catch (error) {
      console.error("❌ load invoice credit-note error:", error);
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

  const invoiceTotal = Number(invoice?.totals?.total ?? 0);

  const alreadyCredited = Number(
    invoice?.creditNoteSummary?.totalCredited ?? 0
  );

  const remainingCreditableAmount = Number(
    invoice?.creditNoteSummary?.remainingCreditableAmount ??
    Math.max(invoiceTotal - alreadyCredited, 0)
  );

  const cleanReason = reason.trim();
  const cleanAmount = Number(amount.replace(",", ".").trim());

  const canSubmit =
    !saving &&
    Number.isFinite(cleanAmount) &&
    cleanAmount > 0 &&
    cleanAmount <= remainingCreditableAmount &&
    cleanReason.length >= 3;

  async function handleCreateCreditNote() {
    if (!invoice?.id) return;

    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      Alert.alert("Erreur", "Montant invalide");
      return;
    }

    if (cleanAmount > remainingCreditableAmount) {
      Alert.alert(
        "Erreur",
        `Le montant dépasse le solde créditable : ${formatCurrency(
          remainingCreditableAmount
        )}`
      );
      return;
    }

    if (cleanReason.length < 3) {
      Alert.alert("Erreur", "Motif obligatoire");
      return;
    }

    try {
      setSaving(true);

      const creditNote = await createDraftCreditNote(
        invoice.id,
        cleanAmount,
        cleanReason
      );

      Alert.alert(
        "Avoir créé",
        `Avoir ${creditNote.number} créé avec succès`
      );

      router.replace({
        pathname: "/(traiteur)/invoices/credit-note/edit/[id]",
        params: { id: String(creditNote.id) },
      });
    } catch (error: any) {
      console.error("❌ create credit note error:", error);
      Alert.alert(
        "Erreur",
        error?.message || "Impossible de créer l’avoir"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement...</Text>
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

  const isFullyCredited =
    invoice.creditNoteSummary?.isFullyCredited ||
    remainingCreditableAmount <= 0;

  const isBlockedInvoice =
    invoice.status === "cancelled" ||
    invoice.status === "replaced" ||
    (invoice as any).documentType === "CREDIT_NOTE";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un avoir</Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Règle comptable</Text>
        <Text style={styles.noticeText}>
          Un avoir ne supprime pas la facture initiale. Il crée une pièce
          comptable liée à la facture et réduit le montant net facturable.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Facture concernée</Text>
        <Text style={styles.value}>{invoice.number}</Text>

        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>
          {invoice.client?.name || "Client non défini"}
        </Text>

        <View style={styles.separator} />

        <Text style={styles.label}>Total facture</Text>
        <Text style={styles.value}>{formatCurrency(invoiceTotal)}</Text>

        <Text style={styles.label}>Déjà crédité</Text>
        <Text style={styles.creditValue}>
          - {formatCurrency(alreadyCredited)}
        </Text>

        <Text style={styles.label}>Solde créditable</Text>
        <Text style={styles.remainingValue}>
          {formatCurrency(remainingCreditableAmount)}
        </Text>
      </View>

      {isFullyCredited || isBlockedInvoice ? (
        <View style={styles.blockedCard}>
          <Text style={styles.blockedText}>
            {isBlockedInvoice
              ? "Cette facture ne peut pas recevoir d’avoir."
              : "Cette facture est déjà totalement couverte par un avoir."}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.inputLabel}>Montant de l’avoir</Text>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Ex : 150"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Motif de l’avoir</Text>

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Ex : correction montant, remise commerciale..."
            placeholderTextColor="#9CA3AF"
            style={styles.textArea}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.createButton, !canSubmit && styles.disabledButton]}
            disabled={!canSubmit}
            onPress={handleCreateCreditNote}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Créer le brouillon d’avoir</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (!invoice?.id) {
            router.replace("/(traiteur)/invoices");
            return;
          }

          router.replace({
            pathname: "/(traiteur)/invoices/[id]",
            params: { id: String(invoice.id) },
          });
        }}
        disabled={saving}
      >
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>
    </View>
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
    fontWeight: "900",
    color: "#111827",
    marginBottom: 16,
  },
  notice: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#92400E",
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#78350F",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    marginTop: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },
  creditValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#D97706",
    marginTop: 2,
  },
  remainingValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#065F46",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    marginBottom: 14,
  },
  textArea: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    minHeight: 120,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    marginBottom: 14,
  },
  createButton: {
    backgroundColor: "#D97706",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  blockedCard: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  blockedText: {
    color: "#991B1B",
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 19,
  },
  backButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 14,
  },
});