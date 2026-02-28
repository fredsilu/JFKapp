import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createTransaction, Entity } from "@/src/finance/services/financeTransactionService";
import { useAccounts } from "@/src/finance/hooks/useAccounts";

export default function NewTransaction() {
  const router = useRouter();
  const { entity } = useLocalSearchParams<{ entity: Entity }>();

  const currentEntity = entity as Entity;

  const { accounts } = useAccounts(currentEntity);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);

  if (!currentEntity) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 20 }}>Entity invalide</Text>
      </SafeAreaView>
    );
  }

  async function handleSave() {
    if (!amount || !category || !accountId) {
      Alert.alert("Erreur", "Tous les champs sont obligatoires");
      return;
    }

    try {
      await createTransaction(currentEntity, {
        type,
        amount: parseFloat(amount),
        currency: "USD",
        date: new Date(),
        accountId,
        category,
        description,
        isInternalTransfer: false,
      });

      router.back();
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'enregistrer la transaction");
    }
  }

  const title =
    currentEntity === "maison"
      ? "Nouvelle transaction Maison"
      : "Nouvelle transaction Crepolia";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{title}</Text>

        {/* Type */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "income" && styles.incomeActive,
            ]}
            onPress={() => setType("income")}
          >
            <Text style={styles.typeText}>Entrée</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "expense" && styles.expenseActive,
            ]}
            onPress={() => setType("expense")}
          >
            <Text style={styles.typeText}>Dépense</Text>
          </TouchableOpacity>
        </View>

        {/* Montant */}
        <TextInput
          placeholder="Montant"
          keyboardType="numeric"
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
        />

        {/* Compte */}
        <Text style={styles.label}>Compte</Text>
        {accounts.map((acc) => (
          <TouchableOpacity
            key={acc.id}
            style={[
              styles.accountButton,
              accountId === acc.id && styles.accountActive,
            ]}
            onPress={() => setAccountId(acc.id)}
          >
            <Text style={{ color: "#111827" }}>{acc.name}</Text>
          </TouchableOpacity>
        ))}

        {/* Catégorie */}
        <TextInput
          placeholder="Catégorie"
          style={styles.input}
          value={category}
          onChangeText={setCategory}
        />

        {/* Description */}
        <TextInput
          placeholder="Description"
          style={styles.input}
          value={description}
          onChangeText={setDescription}
        />

        {/* Save */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },
  typeContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 4,
  },
  incomeActive: {
    backgroundColor: "#16a34a",
  },
  expenseActive: {
    backgroundColor: "#dc2626",
  },
  typeText: {
    color: "white",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    color: "#111827",
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#374151",
  },
  accountButton: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  accountActive: {
    borderWidth: 2,
    borderColor: "#2563eb",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
  },
});