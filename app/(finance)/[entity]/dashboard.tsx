import React, { useMemo, useState } from "react";
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
import { EntityType } from "@/types/finance.types";
import { getEntity } from "@/src/finance/utils/getEntity";

/* ============================= */
/*         MAIN SCREEN           */
/* ============================= */

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  let currentEntity: EntityType;

  try {
    currentEntity = getEntity(params);
  } catch {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Entité invalide</Text>
        </View>
      </SafeAreaView>
    );
  }

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  const { data, loading } = useFinanceDashboard(currentEntity, {
    month: selectedMonth,
    year: selectedYear,
  });

  const monthLabel = useMemo(() => {
    return selectedDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const isCurrentMonth =
    selectedMonth === today.getMonth() &&
    selectedYear === today.getFullYear();

  const goToPreviousMonth = () => {
    setSelectedDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    setSelectedDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

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
          <Text style={styles.errorText}>Aucune donnée disponible</Text>
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

  const budgetAlerts = Object.entries(budgetByCategory || {}).reduce(
    (acc, [, values]: any) => {
      if (values?.usageRate > 100) acc.over += 1;
      else if (values?.usageRate >= 85) acc.warning += 1;
      return acc;
    },
    { over: 0, warning: 0 }
  );

  const title = currentEntity === "maison" ? "🏠 Maison" : "🏢 Crepolia";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Dashboard financier</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.budgetButton}
              onPress={() =>
                router.push({
                  pathname: "/(finance)/[entity]/budget",
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

            <TouchableOpacity
              style={styles.archiveButton}
              onPress={() =>
                router.push({
                  pathname: "/(finance)/[entity]/archive",
                  params: { entity: currentEntity },
                })
              }
            >
              <Text style={styles.archiveText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MONTH NAV */}
        <View style={styles.monthCard}>
          <Text style={styles.monthLabel}>Résultat calculé pour :</Text>

          <View style={styles.monthRow}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={goToPreviousMonth}
            >
              <Text style={styles.monthNavText}>←</Text>
            </TouchableOpacity>

            <View style={styles.monthCenter}>
              <Text style={styles.monthValue}>
                {capitalize(monthLabel)}
              </Text>
              <Text style={styles.monthHint}>
                {isCurrentMonth ? "Mois en cours" : "Mois sélectionné"}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.monthNavButton,
                isCurrentMonth && styles.monthNavButtonDisabled,
              ]}
              onPress={goToNextMonth}
              disabled={isCurrentMonth}
            >
              <Text
                style={[
                  styles.monthNavText,
                  isCurrentMonth && styles.monthNavTextDisabled,
                ]}
              >
                →
              </Text>
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

        {/* RESULTAT MENSUEL */}
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

            <Text style={styles.resultPeriodText}>
              Période analysée : {capitalize(monthLabel)}
            </Text>
          </View>

          <View style={styles.grid}>
            <Card title="Revenus" value={totalIncome} color="#16a34a" />
            <Card title="Dépenses" value={totalExpense} color="#dc2626" />
          </View>
        </View>

        {/* TRESORERIE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trésorerie globale</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Total disponible</Text>
            <Text style={[styles.resultValue, { color: "#2563eb" }]}>
              {formatNumber(totalTreasury)} USD
            </Text>
            <Text style={styles.resultHint}>
              Calculée sur toutes les transactions non archivées
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

        {/* BUDGET */}
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
                  style={[
                    styles.budgetGapText,
                    { color: budgetGap >= 0 ? "#16a34a" : "#dc2626" },
                  ]}
                >
                  Écart global : {formatNumber(budgetGap)} USD
                </Text>

                <TouchableOpacity
                  style={styles.manageBudgetLink}
                  onPress={() =>
                    router.push({
                      pathname: "/(finance)/[entity]/budget",
                      params: { entity: currentEntity },
                    })
                  }
                >
                  <Text style={styles.manageBudgetText}>
                    Gérer le budget →
                  </Text>
                </TouchableOpacity>
              </View>

              {Object.entries(budgetByCategory || {}).map(
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
              <Text style={styles.emptyBudgetText}>
                Aucun budget défini pour {monthLabel}.
              </Text>

              <TouchableOpacity
                style={styles.manageBudgetLink}
                onPress={() =>
                  router.push({
                    pathname: "/(finance)/[entity]/budget",
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
/* COMPONENTS                    */
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
        {formatNumber(value)} USD
      </Text>
    </View>
  );
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("fr-FR");
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ============================= */
/* STYLES                        */
/* ============================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  container: {
    padding: 16,
    paddingBottom: 28,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },

  headerTop: {
    marginBottom: 16,
  },

  headerLeft: {
    marginBottom: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  budgetButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },

  budgetText: {
    color: "white",
    fontWeight: "700",
  },

  journalButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },

  journalText: {
    color: "white",
    fontWeight: "700",
  },

  archiveButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 44,
    alignItems: "center",
  },

  archiveText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },

  monthCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    marginBottom: 18,
  },

  monthLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 10,
  },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  monthNavButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },

  monthNavButtonDisabled: {
    backgroundColor: "#f3f4f6",
  },

  monthNavText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  monthNavTextDisabled: {
    color: "#9ca3af",
  },

  monthCenter: {
    flex: 1,
    alignItems: "center",
  },

  monthValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  monthHint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  alertBox: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },

  alertTitle: {
    fontWeight: "800",
    marginBottom: 6,
    color: "#111827",
  },

  alertText: {
    color: "#374151",
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#374151",
  },

  resultCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },

  resultLabel: {
    fontSize: 14,
    color: "#6b7280",
  },

  resultValue: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 6,
  },

  resultPeriodText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6b7280",
  },

  resultHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  },

  budgetGapText: {
    marginTop: 8,
    fontWeight: "700",
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
    borderRadius: 14,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 13,
    color: "#6b7280",
  },

  cardValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },

  manageBudgetLink: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },

  manageBudgetText: {
    color: "#2563eb",
    fontWeight: "700",
  },

  emptyBudgetText: {
    color: "#374151",
  },

  budgetRow: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  budgetCat: {
    fontWeight: "700",
    flex: 1,
    color: "#111827",
  },

  budgetNumbers: {
    flex: 1,
    textAlign: "center",
    color: "#374151",
  },

  budgetPct: {
    width: 60,
    textAlign: "right",
    fontWeight: "800",
  },
});