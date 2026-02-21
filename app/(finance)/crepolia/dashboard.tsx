import {
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useFinanceDashboard } from "@/src/finance/hooks/useFinanceDashboard";
import { distributeDividend } from "@/src/finance/services/dividendService";
import { useProjection } from "@/src/finance/hooks/useProjection";

/* ============================= */
/*         MAIN SCREEN           */
/* ============================= */

export default function CrepoliaDashboard() {
  const router = useRouter();
  const { data, loading, reload } = useFinanceDashboard("crepolia");
  const [processing, setProcessing] = useState(false);
  const { data: projection } = useProjection("crepolia");

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 60 }} size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>Aucune donnée disponible</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    totalIncome = 0,
    totalExpense = 0,
    netResult = 0,
    totalTreasury = 0,
    totalCash = 0,
    totalBank = 0,
    totalMobile = 0,
    forecastGap = 0,
    dividend = 0,
    dividendRate = 0,
  } = data;

  /* ============================= */
  /*      DISTRIBUTE HANDLER       */
  /* ============================= */

  const handleDistribute = () => {
    if (dividend <= 0) {
      Alert.alert("Aucun dividende disponible");
      return;
    }

    if (dividend > totalTreasury) {
      Alert.alert(
        "Trésorerie insuffisante",
        "Impossible de distribuer un montant supérieur à la trésorerie disponible."
      );
      return;
    }

    Alert.alert(
      "Confirmer distribution",
      `Distribuer ${formatNumber(dividend)} USD ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              setProcessing(true);

              await distributeDividend({
                amount: dividend,
                sourceAccountId: "ID_COMPTE_CREPOLIA",
                targetAccountId: "ID_COMPTE_MAISON",
              });

              await reload();

              Alert.alert("Dividende distribué avec succès");
            } catch (error) {
              Alert.alert("Erreur lors de la distribution");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>🏢 Crepolia</Text>

          <TouchableOpacity
            style={styles.journalButton}
            onPress={() => router.push("/(finance)/crepolia/journal")}
          >
            <Text style={styles.journalText}>Journal</Text>
          </TouchableOpacity>
        </View>

        {/* RESULT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultat du mois</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Résultat net</Text>
            <Text
              style={[
                styles.resultValue,
                { color: netResult >= 0 ? "#16a34a" : "#dc2626" },
              ]}
            >
              {formatNumber(netResult)} USD
            </Text>
          </View>

          <View style={styles.grid}>
            <Card title="Revenus" value={totalIncome} color="#16a34a" />
            <Card title="Dépenses" value={totalExpense} color="#dc2626" />
          </View>
        </View>

        {projection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projection 90 jours</Text>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Trésorerie projetée</Text>
              <Text style={[styles.resultValue, { color: "#0ea5e9" }]}>
                {formatNumber(projection.projectedTreasury)} USD
              </Text>
            </View>

            <View style={styles.grid}>
              <Card title="Entrées prévues" value={projection.projectedIncome} color="#16a34a" />
              <Card title="Dépenses prévues" value={projection.projectedExpense} color="#dc2626" />
            </View>
          </View>
        )}

        {/* DIVIDEND */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribution</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Dividende potentiel</Text>
            <Text style={[styles.resultValue, { color: "#7c3aed" }]}>
              {formatNumber(dividend)} USD
            </Text>
            <Text style={styles.subInfo}>
              Taux appliqué : {dividendRate * 100}%
            </Text>

            <TouchableOpacity
              style={[
                styles.distributeButton,
                processing && { opacity: 0.5 },
              ]}
              disabled={processing}
              onPress={handleDistribute}
            >
              <Text style={styles.distributeText}>
                {processing
                  ? "Distribution en cours..."
                  : "Distribuer le dividende"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TREASURY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trésorerie</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Total disponible</Text>
            <Text style={[styles.resultValue, { color: "#2563eb" }]}>
              {formatNumber(totalTreasury)} USD
            </Text>
          </View>

          <View style={styles.grid}>
            <Card title="Espèces" value={totalCash} />
            <Card title="Banque" value={totalBank} />
            <Card title="Mobile" value={totalMobile} />
            <Card
              title="Écart prévisionnel"
              value={forecastGap}
              color="#f59e0b"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================= */
/*            CARD               */
/* ============================= */

function Card({
  title,
  value,
  color = "#111827",
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color }]}>
        {formatNumber(value)}
      </Text>
    </View>
  );
}

/* ============================= */
/*         UTIL FORMAT           */
/* ============================= */

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString();
}

/* ============================= */
/*            STYLES             */
/* ============================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  container: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  journalButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  journalText: {
    color: "white",
    fontWeight: "600",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#374151",
  },
  resultCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  resultLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  resultValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 6,
  },
  subInfo: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "white",
    width: "48%",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 6,
  },
  distributeButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  distributeText: {
    color: "white",
    fontWeight: "bold",
  },
});