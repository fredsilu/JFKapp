import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createOrUpdateBudget } from "@/src/finance/services/budgetService";
import { EntityType } from "@/types/finance.types";

export default function NewBudgetScreen() {
  const router = useRouter();
  const { entity } = useLocalSearchParams<{ entity: EntityType }>();

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const handleSave = async () => {
    if (!category.trim()) {
      Alert.alert("Erreur", "La catégorie est obligatoire");
      return;
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Erreur", "Montant invalide");
      return;
    }

    try {
      await createOrUpdateBudget(
        entity as EntityType,
        category,
        month,
        year,
        numericAmount,
        "USD"
      );

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible d'enregistrer le budget");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Nouveau budget ({entity})
      </Text>

      <TextInput
        placeholder="Catégorie"
        style={styles.input}
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        placeholder="Montant"
        keyboardType="numeric"
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Enregistrer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
});