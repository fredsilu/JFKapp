import React from "react";
import {
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

// ✅ Important: adapte le chemin selon ton alias
import { useFinanceDashboard } from "@/src/finance/hooks/useFinanceDashboard";
import { EntityType } from "@/types/finance.types";

/* ============================= */
/*         MAIN SCREEN           */
/* ============================= */

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const currentEntity = params.entity as EntityType;

  if (!currentEntity) {
    return null;
  }

  const { data, loading } = useFinanceDashboard(currentEntity);

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

    // ✅ Budget fields (déjà dans ton EntityDashboardSummary)
    totalBudget = 0,
    budgetGap = 0,
    budgetByCategory = {},
  } = data;

  const budgetAlerts = Object.entries(budgetByCategory || {}).reduce(
    (acc, [, values]: any) => {
      if (values?.usageRate > 100) acc.over += 1;
      else if (values?.usageRate >= 85) acc.warning += 1;
      return acc;
    },
    { over: 0, warning: 0 }
  );

  const title =
    currentEntity === "maison" ? "🏠 Maison" : "🏢 Crepolia";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.budgetButton}
              onPress={() =>
                router.push({
                  pathname: "/(finance)/[entity]/budget/index",
                  params: { entity: currentEntity },
                })
              }
            >
              <Text style={styles.budgetText}>Budget</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.journalButton}
              onPress={() =>
                router.push({
                  pathname: "/(finance)/[entity]/journal",
                  params: { entity: currentEntity },
                })
              }
            >
              <Text style={styles.journalText}>Journal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ALERTES BUDGET */}
        {(budgetAlerts.over > 0 || budgetAlerts.warning > 0) && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>⚠️ Alertes budget</Text>
            {budgetAlerts.over > 0 && (
              <Text style={styles.alertText}>
                🔴 Dépassement sur {budgetAlerts.over} catégorie(s)
              </Text>
            )}
            {budgetAlerts.warning > 0 && (
              <Text style={styles.alertText}>
                🟠 Alerte (≥ 85%) sur {budgetAlerts.warning} catégorie(s)
              </Text>
            )}
          </View>
        )}

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

        {/* ============================= */}
        {/*         BUDGET SECTION        */}
        {/* ============================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget du mois</Text>

          {totalBudget > 0 ? (
            <>
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>Budget total</Text>
                <Text style={styles.resultValue}>
                  {formatNumber(totalBudget)} USD
                </Text>

                <Text
                  style={{
                    marginTop: 8,
                    fontWeight: "bold",
                    color: budgetGap >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  Écart global : {formatNumber(budgetGap)} USD
                </Text>

                <TouchableOpacity
                  style={styles.manageBudgetLink}
                  onPress={() =>
                    router.push({
                      pathname: "/(finance)/[entity]/budget/index",
                      params: { entity: currentEntity },
                    })
                  }
                >
                  <Text style={styles.manageBudgetText}>
                    Gérer le budget →
                  </Text>
                </TouchableOpacity>
              </View>

              {!!budgetByCategory &&
                Object.entries(budgetByCategory).map(
                  ([category, values]: any) => {
                    const usage = Number(values?.usageRate || 0);
                    const color =
                      usage < 80
                        ? "#16a34a"
                        : usage <= 100
                        ? "#f59e0b"
                        : "#dc2626";

                    return (
                      <View key={category} style={styles.budgetRow}>
                        <Text style={styles.budgetCat}>{category}</Text>

                        <Text style={styles.budgetNumbers}>
                          {formatNumber(values?.actual || 0)} /{" "}
                          {formatNumber(values?.budget || 0)}
                        </Text>

                        <Text style={[styles.budgetPct, { color }]}>
                          {Math.round(usage)}%
                        </Text>
                      </View>
                    );
                  }
                )}
            </>
          ) : (
            <View style={styles.resultCard}>
              <Text>Aucun budget défini pour ce mois.</Text>
              <TouchableOpacity
                style={styles.manageBudgetLink}
                onPress={() =>
                  router.push({
                    pathname: "/(finance)/[entity]/budget/index",
                    params: { entity: currentEntity },
                  })
                }
              >
                <Text style={styles.manageBudgetText}>
                  Définir un budget →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================= */
/* COMPONENTS & UTILS           */
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
      <Text style={[styles.cardValue, { color }]}>{formatNumber(value)}</Text>
    </View>
  );
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString();
}

/* ============================= */
/*            STYLES             */
/* ============================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  title: { fontSize: 22, fontWeight: "bold" },

  journalButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  journalText: { color: "white", fontWeight: "600" },

  budgetButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  budgetText: { color: "white", fontWeight: "600" },

  alertBox: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    elevation: 2,
  },
  alertTitle: { fontWeight: "800", marginBottom: 6 },
  alertText: { color: "#374151" },

  section: { marginBottom: 26 },
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
  resultLabel: { fontSize: 14, color: "#6b7280" },
  resultValue: { fontSize: 22, fontWeight: "bold", marginTop: 6 },

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
  cardTitle: { fontSize: 13, color: "#6b7280" },
  cardValue: { fontSize: 18, fontWeight: "bold", marginTop: 6 },

  manageBudgetLink: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  manageBudgetText: {
    color: "#2563eb",
    fontWeight: "700",
  },

  budgetRow: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetCat: { fontWeight: "700", flex: 1 },
  budgetNumbers: { flex: 1, textAlign: "center" },
  budgetPct: { width: 60, textAlign: "right", fontWeight: "800" },
});