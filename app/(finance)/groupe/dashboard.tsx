import {
  ScrollView,
  ActivityIndicator,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import Slider from "@react-native-community/slider";

import { useGroupDashboard } from "@/src/finance/hooks/useGroupDashboard";
import { useGroupProjection } from "@/src/finance/hooks/useGroupProjection";
import { simulateProjection } from "@/src/finance/services/simulationService";

/* ============================= */
/*         MAIN SCREEN           */
/* ============================= */

export default function GroupeDashboard() {
  const { data, loading } = useGroupDashboard();
  const { data: projection } = useGroupProjection();

  const [simulationAmount, setSimulationAmount] = useState(0);

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
  } = data;

  const simulated =
    projection &&
    simulateProjection({
      currentTreasury: projection.currentTreasury,
      projectedIncome: projection.projectedIncome,
      projectedExpense: projection.projectedExpense,
      simulatedOutflow: simulationAmount,
    });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.title}>📊 Groupe Consolidé</Text>

        {/* ================= RESULT ================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultat consolidé</Text>

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

        {/* ================= TREASURY ================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trésorerie consolidée</Text>

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
          </View>
        </View>

        {/* ================= PROJECTION ================= */}
        {projection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Projection Groupe 90 jours
            </Text>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>
                Trésorerie projetée
              </Text>
              <Text
                style={[
                  styles.resultValue,
                  {
                    color:
                      projection.risk === "HIGH"
                        ? "#dc2626"
                        : projection.risk === "MEDIUM"
                        ? "#f59e0b"
                        : "#16a34a",
                  },
                ]}
              >
                {formatNumber(projection.projectedTreasury)} USD
              </Text>
            </View>

            <View style={styles.grid}>
              <Card
                title="Entrées prévues"
                value={projection.projectedIncome}
                color="#16a34a"
              />
              <Card
                title="Dépenses prévues"
                value={projection.projectedExpense}
                color="#dc2626"
              />
            </View>

            <Text style={styles.riskText}>
              Niveau de risque : {projection.risk}
            </Text>
          </View>
        )}

        {/* ================= SIMULATION ================= */}
        {projection && simulated && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Simulation décision stratégique
            </Text>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>
                Montant simulé : {formatNumber(simulationAmount)} USD
              </Text>

              <Slider
                minimumValue={0}
                maximumValue={projection.currentTreasury}
                step={500}
                value={simulationAmount}
                onValueChange={setSimulationAmount}
                minimumTrackTintColor="#7c3aed"
                maximumTrackTintColor="#d1d5db"
              />
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>
                Trésorerie projetée après simulation
              </Text>

              <Text
                style={[
                  styles.resultValue,
                  {
                    color:
                      simulated.risk === "HIGH"
                        ? "#dc2626"
                        : simulated.risk === "MEDIUM"
                        ? "#f59e0b"
                        : "#16a34a",
                  },
                ]}
              >
                {formatNumber(simulated.projectedTreasury)} USD
              </Text>

              <Text style={styles.riskText}>
                Risque simulé : {simulated.risk}
              </Text>
            </View>
          </View>
        )}
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
/*        FORMAT UTIL            */
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
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
  riskText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
});