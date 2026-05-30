//app/(finance)/[entity]/accounts/new.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createAccount } from "@/src/finance/services/accountService";
import { EntityType, AccountType, CurrencyType } from "@/types/finance.types";

export default function NewAccount() {
  const router = useRouter();
  const { entity } = useLocalSearchParams<{ entity: EntityType }>();

  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [currency, setCurrency] = useState<CurrencyType>("USD");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom du compte est obligatoire.");
      return;
    }

    const balanceNumber = Number(initialBalance);

    if (isNaN(balanceNumber)) {
      Alert.alert("Erreur", "Le solde initial doit être un nombre.");
      return;
    }

    try {
      await createAccount(entity as EntityType, {
        name,
        type,
        currency,
        initialBalance: balanceNumber,
        isActive: true,
      });

      router.replace(`/(finance)/${entity}/accounts`);
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de créer le compte.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Nouveau Compte ({entity})
      </Text>

      <TextInput
        placeholder="Nom du compte"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Solde initial"
        style={styles.input}
        keyboardType="numeric"
        value={initialBalance}
        onChangeText={setInitialBalance}
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
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
});