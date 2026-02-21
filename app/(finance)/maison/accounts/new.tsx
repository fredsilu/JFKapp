import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { createAccount } from "@/src/finance/services/accountService";
import { useRouter } from "expo-router";

export default function NewAccount() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  const handleSave = async () => {
    await createAccount("maison", {
      name,
      type: "bank",
      currency: "USD",
      initialBalance: Number(initialBalance),
      isActive: true,
    });

    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouveau Compte</Text>

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