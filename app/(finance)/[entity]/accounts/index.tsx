import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAccounts } from "@/src/finance/hooks/useAccounts";

export default function MaisonAccounts() {
  const router = useRouter();
  const { accounts, loading } = useAccounts("maison");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏦 Comptes Maison</Text>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.type.toUpperCase()} - {item.currency}</Text>
            <Text>Solde initial: {item.initialBalance}</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(finance)/maison/accounts/new")}
      >
        <Text style={styles.buttonText}>+ Nouveau Compte</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  card: {
    padding: 15,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 10,
  },
  name: { fontWeight: "bold", fontSize: 16 },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "white", fontWeight: "bold" },
});