// app/(traiteur)/invoices/history/[id].tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import {
  getCateringInvoiceById,
  getInvoiceHistory,
} from "@/src/services/cateringInvoice.service";

import { CateringInvoice } from "@/types/catering";

type HistoryItem = {
  id: string;
  type?: string;
  message?: string;
  createdAt?: any;
  createdBy?: string | null;
  snapshot?: any;
};

function formatDate(value?: any) {
  if (!value) return "—";

  const date =
    value?.toDate?.() ??
    (typeof value === "string" ? new Date(value) : null);

  if (!date || Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("fr-FR");
}

function getHistoryLabel(type?: string) {
  switch (type) {
    case "CREATED":
      return "Création";
    case "ISSUED":
      return "Émission";
    case "CANCELLED":
      return "Annulation";
    case "REPLACED":
      return "Annule et remplace";
    case "CREDIT_NOTE_CREATED":
      return "Avoir créé";
    case "PAYMENT_ADDED":
      return "Paiement ajouté";
    case "PDF_GENERATED":
      return "PDF généré";
    case "SENT_TO_CLIENT":
      return "Envoyée au client";
    default:
      return type || "Action";
  }
}

export default function InvoiceHistoryScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [invoice, setInvoice] = useState<CateringInvoice | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      router.back();
      return;
    }

    try {
      setLoading(true);

      const invoiceData = await getCateringInvoiceById(id);
      if (!invoiceData) {
        Alert.alert("Erreur", "Facture introuvable");
        router.back();
        return;
      }

      const historyData = await getInvoiceHistory(id);

      setInvoice(invoiceData);
      setHistory(historyData as HistoryItem[]);
    } catch (error) {
      console.error("❌ load invoice history error:", error);
      Alert.alert("Erreur", "Impossible de charger l’historique");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement de l’historique...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Historique facture</Text>

      <View style={styles.headerCard}>
        <Text style={styles.invoiceNumber}>{invoice?.number || "—"}</Text>
        <Text style={styles.client}>
          {invoice?.client?.name || "Client non défini"}
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun historique trouvé.</Text>
        </View>
      ) : (
        history.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <Text style={styles.historyType}>
              {getHistoryLabel(item.type)}
            </Text>

            <Text style={styles.historyMessage}>
              {item.message || "Action enregistrée"}
            </Text>

            <Text style={styles.historyDate}>
              {formatDate(item.createdAt)}
            </Text>

            {item.snapshot ? (
              <View style={styles.snapshotBox}>
                <Text style={styles.snapshotTitle}>Détails</Text>
                <Text style={styles.snapshotText}>
                  {JSON.stringify(item.snapshot, null, 2)}
                </Text>
              </View>
            ) : null}
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  headerCard: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  invoiceNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  client: {
    color: "#D1D5DB",
    marginTop: 6,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  emptyText: {
    color: "#6B7280",
    textAlign: "center",
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },
  historyType: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 4,
  },
  historyMessage: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  snapshotBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  snapshotTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#374151",
    marginBottom: 4,
  },
  snapshotText: {
    fontSize: 12,
    color: "#4B5563",
  },
  backButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  backButtonText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 14,
  },
});