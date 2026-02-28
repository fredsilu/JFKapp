import {
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFinanceDashboard } from "@/src/finance/hooks/useFinanceDashboard";

/* ============================= */
/*         MAIN SCREEN           */
/* ============================= */

export default function MaisonDashboard() {
  const router = useRouter();
  const { data, loading } = useFinanceDashboard("maison");

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
    totalBudget = 0,
    budgetGap = 0,
    budgetByCategory = {},
  } = data;

  const budgetAlerts = Object.entries(budgetByCategory).reduce(
    (acc, [_, values]) => {
      if (values.usageRate > 100) acc.over += 1;
      else if (values.usageRate >= 85) acc.warning += 1;
      return acc;
    },
    { over: 0, warning: 0 }
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>🏠 Maison</Text>

          <TouchableOpacity
            style={styles.journalButton}
            onPress={() => router.push("/(finance)/maison/journal")}
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

        {(budgetAlerts.over > 0 || budgetAlerts.warning > 0) && (
          <View style={styles.alertCard}>
            {budgetAlerts.over > 0 && (
              <Text style={styles.alertRed}>
                🔴 {budgetAlerts.over} catégorie(s) en dépassement
              </Text>
            )}

            {budgetAlerts.warning > 0 && (
              <Text style={styles.alertOrange}>
                🟠 {budgetAlerts.warning} catégorie(s) proche du dépassement
              </Text>
            )}
          </View>
        )}

        {/* BUDGET GLOBAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget mensuel</Text>

          <View style={styles.grid}>
            <Card title="Budget total" value={totalBudget} color="#111827" />
            <Card
              title="Écart budget"
              value={budgetGap}
              color={budgetGap >= 0 ? "#16a34a" : "#dc2626"}
            />
          </View>
        </View>

        {/* BUDGET PAR CATÉGORIE */}
        {Object.keys(budgetByCategory).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget par catégorie</Text>

            {Object.entries(budgetByCategory).map(
              ([category, values]) => (
                <View key={category} style={styles.categoryCard}>
                  <Text style={styles.categoryTitle}>{category}</Text>

                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryText}>
                      Budget: {formatNumber(values.budget)}
                    </Text>
                    <Text style={styles.categoryText}>
                      Réel: {formatNumber(values.actual)}
                    </Text>
                  </View>

                  <View style={styles.categoryRow}>
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color:
                            values.gap >= 0 ? "#16a34a" : "#dc2626",
                        },
                      ]}
                    >
                      Écart: {formatNumber(values.gap)}
                    </Text>

                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color:
                            values.usageRate > 100
                              ? "#dc2626"
                              : "#16a34a",
                        },
                      ]}
                    >
                      {values.usageRate.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              )
            )}
          </View>
        )}

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
      <Text style={[styles.cardValue, { color }]}>
        {formatNumber(value)}
      </Text>
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
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  journalButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  journalText: { color: "white", fontWeight: "600" },
  section: { marginBottom: 30 },
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

  categoryCard: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  categoryTitle: { fontWeight: "bold", marginBottom: 6 },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryText: { fontSize: 13 },

  alertCard: {
  backgroundColor: "#fff7ed",
  padding: 14,
  borderRadius: 12,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: "#fed7aa",
},

alertRed: {
  color: "#dc2626",
  fontWeight: "600",
  marginBottom: 4,
},

alertOrange: {
  color: "#ea580c",
  fontWeight: "600",
},
});