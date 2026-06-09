// app/(traiteur)/invoices/replace/[id].tsx
import React, { useCallback, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { CateringInvoice } from "@/types/catering";

import {
  getCateringInvoiceById,
  createReplacementDraftInvoice,
} from "@/src/services/cateringInvoice.service";

export default function ReplaceInvoiceScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [invoice, setInvoice] = useState<CateringInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");

  const cleanReason = reason.trim();
  const canSubmit = !!id && !!invoice && cleanReason.length >= 3 && !saving;

  function goBack() {
    if (!id) {
      router.replace("/(traiteur)/invoices");
      return;
    }

    router.replace({
      pathname: "/(traiteur)/invoices/[id]",
      params: { id },
    });
  }

  const loadInvoice = useCallback(async () => {
    if (!id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      goBack();
      return;
    }

    try {
      setLoading(true);

      const data = await getCateringInvoiceById(id);

      if (!data) {
        Alert.alert("Erreur", "Facture introuvable");
        goBack();
        return;
      }

      setInvoice({
        ...data,
        id: data.id ?? id,
      });
    } catch (error) {
      console.error("❌ load invoice replace error:", error);
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

  function confirmCreateDraft(confirmMessage: string) {
    return new Promise<boolean>((resolve) => {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        resolve(window.confirm(confirmMessage));
        return;
      }

      Alert.alert("Créer un brouillon de remplacement", confirmMessage, [
        {
          text: "Annuler",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ]);
    });
  }

  async function handleCreateReplacementDraft() {
    if (saving) return;

    if (!id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      return;
    }

    if (!invoice) {
      Alert.alert("Erreur", "Facture introuvable");
      return;
    }

    if (cleanReason.length < 3) {
      Alert.alert(
        "Raison obligatoire",
        "Indique la raison de l’annule et remplace."
      );
      return;
    }

    const originalInvoiceNumber = invoice.number || "—";

    const confirmMessage =
      `Cette action va créer un brouillon de remplacement pour la facture ${originalInvoiceNumber}. ` +
      "La facture initiale ne sera pas encore remplacée. Elle le sera seulement quand le nouveau brouillon sera émis.";

    const confirmed = await confirmCreateDraft(confirmMessage);

    if (!confirmed) return;

    try {
      setSaving(true);

      const draftInvoice = await createReplacementDraftInvoice(
        id,
        cleanReason
      );

      if (!draftInvoice?.id) {
        throw new Error(
          "Le brouillon de remplacement a été créé mais son identifiant est introuvable."
        );
      }

      const draftInvoiceId = String(draftInvoice.id);
      const draftInvoiceNumber = draftInvoice.number || "—";

      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(
          `Brouillon créé : ${draftInvoiceNumber}. Vous pouvez maintenant le modifier.`
        );

        router.replace({
          pathname: "/(traiteur)/invoices/edit-v2/[id]",
          params: { id: draftInvoiceId },
        });

        return;
      }

      Alert.alert(
        "Brouillon créé",
        `Brouillon créé : ${draftInvoiceNumber}. Vous pouvez maintenant le modifier.`,
        [
          {
            text: "OK",
            onPress: () => {
              router.replace({
                pathname: "/(traiteur)/invoices/edit-v2/[id]",
                params: { id: draftInvoiceId },
              });
            },
          },
        ]
      );
    } catch (error: unknown) {
      console.error("❌ create replacement draft error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Impossible de créer le brouillon de remplacement";

      Alert.alert("Erreur", message);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Annulation et remplacement</Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Nouvelle règle</Text>

        <Text style={styles.noticeText}>
          Cette action crée un brouillon de remplacement. La facture initiale
          restera émise tant que le nouveau brouillon n’est pas validé et émis.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Facture initiale</Text>
        <Text style={styles.value}>{invoice.number || "—"}</Text>

        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>
          {invoice.client?.name || "Client non défini"}
        </Text>
      </View>

      <Text style={styles.inputLabel}>Motif du remplacement</Text>

      <TextInput
        value={reason}
        onChangeText={setReason}
        editable={!saving}
        placeholder="Ex : erreur client, correction montant, correction libellé..."
        placeholderTextColor="#9CA3AF"
        style={styles.textArea}
        keyboardType="default"
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.replaceButton, !canSubmit && styles.disabledButton]}
        onPress={handleCreateReplacementDraft}
        disabled={!canSubmit}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.replaceButtonText}>
            Préparer la facture de remplacement
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={goBack}
        disabled={saving}
        activeOpacity={0.85}
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
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },

  noticeTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#3730A3",
    marginBottom: 6,
  },

  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#312E81",
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

  inputLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
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

  disabledButton: {
    opacity: 0.7,
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