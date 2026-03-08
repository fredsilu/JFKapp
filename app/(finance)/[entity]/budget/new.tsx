import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getEntity } from "@/src/finance/utils/getEntity";

export default function NewBudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const entity = getEntity(params);

  const now = new Date();

  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const [categories, setCategories] = useState({
    courses: "",
    transport: "",
    maison: "",
    loisirs: "",
    divers: "",
  });

  function updateCategory(key: string, value: string) {
    setCategories((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function saveBudget() {
    const id = `${year}-${String(month).padStart(2, "0")}`;

    const numericCategories: any = {};

    Object.entries(categories).forEach(([key, value]) => {
      numericCategories[key] = Number(value || 0);
    });

    const totalBudget = Object.values(numericCategories).reduce(
      (sum: number, val: any) => sum + val,
      0
    );

    await setDoc(
      doc(db, "finance", entity, "budgets", id),
      {
        month,
        year,
        categories: numericCategories,
        total: totalBudget,
        createdAt: new Date(),
      },
      { merge: true }
    );

    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Définir un budget</Text>

        <Text style={styles.subtitle}>
          {month}/{year}
        </Text>

        {Object.keys(categories).map((cat) => (
          <View key={cat} style={styles.row}>
            <Text style={styles.label}>{cat}</Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={(categories as any)[cat]}
              onChangeText={(v) => updateCategory(cat, v)}
              placeholder="0"
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveBudget}
        >
          <Text style={styles.saveText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    marginBottom: 6,
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  label: {
    fontWeight: "600",
    textTransform: "capitalize",
    color: "#111827",
  },

  input: {
    width: 100,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    textAlign: "right",
    backgroundColor: "#fafafa",
  },

  saveButton: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  saveText: {
    color: "white",
    fontWeight: "700",
  },
});