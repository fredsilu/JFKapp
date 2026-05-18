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
  replaceInvoice,
} from "@/src/services/cateringInvoice.service";

export default function ReplaceInvoiceScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [invoice, setInvoice] = useState<CateringInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reason, setReason] = useState("");

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

  async function handleReplaceInvoice() {
    if (!invoice?.id) return;

    const cleanReason = reason.trim();

    if (cleanReason.length < 3) {
      Alert.alert(
        "Raison obligatoire",
        "Indique la raison de l’annule et remplace."
      );
      return;
    }

    const confirmMessage =
      `Cette action va remplacer la facture ${invoice.number} par une nouvelle facture avec un nouveau numéro. ` +
      "La facture initiale restera conservée dans l’historique.";

    if (Platform.OS === "web") {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    }

    try {
      setSaving(true);

      const newInvoice = await replaceInvoice(invoice.id, {
        comment: `Annule et remplace la facture ${invoice.number}. Motif : ${cleanReason}`,
      });

      Alert.alert(
        "Facture remplacée",
        `Nouvelle facture créée : ${newInvoice.number}`
      );

      router.replace({
        pathname: "/(traiteur)/invoices/[id]",
        params: { id: newInvoice.id },
      });
    } catch (error: any) {
      console.error("❌ replace invoice error:", error);
      Alert.alert(
        "Erreur",
        error?.message || "Impossible de remplacer la facture"
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Annule et remplace</Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Règle comptable</Text>
        <Text style={styles.noticeText}>
          Cette action ne modifie pas la facture initiale. Elle la marque comme
          remplacée et crée une nouvelle facture avec un nouveau numéro
          chronologique.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Facture initiale</Text>
        <Text style={styles.value}>{invoice.number}</Text>

        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>
          {invoice.client?.name || "Client non défini"}
        </Text>
      </View>

      <Text style={styles.inputLabel}>Motif du remplacement</Text>

      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="Ex : erreur client, correction montant, correction libellé..."
        style={styles.textArea}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.replaceButton, saving && styles.disabledButton]}
        onPress={handleReplaceInvoice}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.replaceButtonText}>
            Créer la facture annule et remplace
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
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
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F0C36A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#7A4E00",
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#5C4300",
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


});