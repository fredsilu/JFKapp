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
import { useFinanceDashboard } from "@/src/finance/hooks/useFinanceDashboard";
import { Entity } from "@/src/finance/services/financeTransactionService";
import { Budget, Transaction } from "@/types/finance.types";

/* ============================= */
/*         MAIN SCREEN           */
/* ============================= */

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentEntity = params.entity as Entity;

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
    totalBudget = 0,
    budgetGap = 0,
    budgetByCategory = {},
  } = data;

  const budgetAlerts = Object.entries(budgetByCategory).reduce(
    (acc, [_, values]: any) => {
      if (values.usageRate > 100) acc.over += 1;
      else if (values.usageRate >= 85) acc.warning += 1;
      return acc;
    },
    { over: 0, warning: 0 }
  );

  const title =
    currentEntity === "maison"
      ? "🏠 Maison"
      : "🏢 Crepolia";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>

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

function calculateBudgetStatus(
  category: string,
  budgets: Budget[],
  transactions: Transaction[]
) {
  const budget = budgets.find(
    (b) => b.category === category
  )

  if (!budget) return null

  const spent = transactions
    .filter(
      (t) =>
        t.category === category &&
        t.type === "expense"
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const remaining = budget.amount - spent

  const percentage =
    budget.amount > 0
      ? (spent / budget.amount) * 100
      : 0

  return {
    planned: budget.amount,
    spent,
    remaining,
    percentage,
  }
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
});