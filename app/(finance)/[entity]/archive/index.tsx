import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import { getEntity } from "@/src/finance/utils/getEntity";
import { useArchivedTransactions } from "@/src/finance/hooks/useArchivedTransactions";
import {
  restoreTransaction,
  deleteTransactionForever,
} from "@/src/finance/services/financeTransactionService";
import { Transaction } from "@/types/finance.types";

export default function ArchiveScreen() {
  const params = useLocalSearchParams();
  const currentEntity = getEntity(params);

  const { transactions, loading, reload } =
    useArchivedTransactions(currentEntity);

  const title =
    currentEntity === "maison"
      ? "🗑️ Corbeille Maison"
      : "🗑️ Corbeille Crepolia";

  const handleRestore = (transaction: Transaction) => {
    Alert.alert(
      "Restaurer",
      "Voulez-vous restaurer cette transaction ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Restaurer",
          onPress: async () => {
            try {
              await restoreTransaction(currentEntity, transaction.id);
              reload();
            } catch (error) {
              console.log("Erreur restauration:", error);
              Alert.alert("Erreur", "Impossible de restaurer");
            }
          },
        },
      ]
    );
  };

  const handleDeleteForever = (transaction: Transaction) => {
    Alert.alert(
      "Suppression définitive",
      "Cette action est irréversible. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransactionForever(currentEntity, transaction.id);
              reload();
            } catch (error) {
              console.log("Erreur suppression définitive:", error);
              Alert.alert("Erreur", "Impossible de supprimer définitivement");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 60 }} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>

        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.left}>
                <Text style={styles.category}>{item.category}</Text>

                <Text style={styles.description}>
                  {item.description || "—"}
                </Text>

                <Text style={styles.date}>
                  {item.date
                    ? new Date(item.date).toLocaleDateString()
                    : ""}
                </Text>
              </View>

              <View style={styles.right}>
                <Text
                  style={[
                    styles.amount,
                    {
                      color:
                        item.type === "income" ? "#16a34a" : "#dc2626",
                    },
                  ]}
                >
                  {item.type === "income" ? "+" : "-"}{" "}
                  {item.amount?.toLocaleString()}
                </Text>

                <TouchableOpacity onPress={() => handleRestore(item)}>
                  <Text style={styles.restore}>Restaurer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteForever(item)}
                >
                  <Text style={styles.delete}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Aucune transaction archivée
            </Text>
          }
          showsVerticalScrollIndicator={false}
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

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 1,
  },

  left: {
    flex: 1,
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  category: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 2,
  },

  description: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 3,
  },

  date: {
    fontSize: 12,
    color: "#666",
  },

  amount: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },

  restore: {
    fontSize: 12,
    color: "#2563eb",
    marginTop: 4,
  },

  delete: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 8,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7280",
  },
});