import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFinanceTransactions } from "@/src/finance/hooks/useFinanceTransactions";
import TransactionItem from "@/src/components/TransactionItem";

export default function MaisonJournal() {
  const router = useRouter();
  const { transactions, loading } = useFinanceTransactions("maison");

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📄 Journal</Text>

          <TouchableOpacity
            style={styles.newButton}
            onPress={() =>
              router.push("/(finance)/maison/new-transaction")
            }
          >
            <Text style={styles.newButtonText}>+ Nouvelle</Text>
          </TouchableOpacity>
        </View>

        {/* Liste */}
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TransactionItem transaction={item} />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Aucune transaction pour le moment
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  newButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7280",
  },
});