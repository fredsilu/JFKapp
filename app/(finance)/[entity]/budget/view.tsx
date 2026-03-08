import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getEntity } from "@/src/finance/utils/getEntity";

export default function BudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const entity = getEntity(params);

  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const title =
    entity === "maison" ? "🏠 Budget Maison" : "🏢 Budget Crepolia";

  useEffect(() => {
    loadBudgets();
  }, []);

  async function loadBudgets() {
    try {
      const snap = await getDocs(
        collection(db, "finance", entity, "budgets")
      );

      const list: any[] = [];

      snap.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      list.sort((a, b) => (a.id < b.id ? 1 : -1));

      setBudgets(list);
    } catch (err) {
      console.log("Budget load error", err);
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{title}</Text>

        {/* CREATE BUTTON */}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/(finance)/[entity]/budget/new",
              params: { entity },
            })
          }
        >
          <Text style={styles.buttonText}>
            Définir un budget
          </Text>
        </TouchableOpacity>

        {/* LIST */}

        <Text style={styles.sectionTitle}>
          Budgets existants
        </Text>

        {loading && (
          <ActivityIndicator style={{ marginTop: 20 }} />
        )}

        {!loading && budgets.length === 0 && (
          <Text style={styles.empty}>
            Aucun budget enregistré
          </Text>
        )}

        {budgets.map((budget) => {
          const label = formatMonth(budget.id);

          return (
            <TouchableOpacity
              key={budget.id}
              style={styles.budgetCard}
              onPress={() =>
                router.push({
                  pathname: "/(finance)/[entity]/budget/view",
                  params: {
                    entity,
                    id: budget.id,
                  },
                })
              }
            >
              <Text style={styles.budgetTitle}>{label}</Text>

              <Text style={styles.budgetAmount}>
                {formatNumber(budget.total || 0)} USD
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================= */
/* UTILS                         */
/* ============================= */

function formatMonth(id: string) {
  const [year, month] = id.split("-");

  const date = new Date(Number(year), Number(month) - 1);

  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString();
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
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#374151",
  },

  empty: {
    marginTop: 10,
    color: "#6b7280",
  },

  budgetCard: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  budgetTitle: {
    fontWeight: "600",
    color: "#111827",
  },

  budgetAmount: {
    fontWeight: "700",
    color: "#2563eb",
  },
});