//app/(finance)/[entity]/journal.tsx
import {
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFinanceTransactions } from "@/src/finance/hooks/useFinanceTransactions";
import TransactionItem from "@/src/components/TransactionItem";
import { useState } from "react";
import { getEntity } from "@/src/finance/utils/getEntity";

export default function JournalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const currentEntity = getEntity(params);

  const [refreshing, setRefreshing] = useState(false);

  if (!currentEntity) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Entity non définie
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { transactions, loading, reload } =
    useFinanceTransactions(currentEntity);

  const title =
    currentEntity === "maison"
      ? "📄 Journal Maison"
      : "📄 Journal Crepolia";

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await reload();
    } catch (error) {
      console.log("Erreur refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          style={{ marginTop: 60 }}
          size="large"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>

          <TouchableOpacity
            style={styles.newButton}
            onPress={() =>
              router.push({
                pathname: "/(finance)/[entity]/new-transaction",
                params: { entity: currentEntity },
              })
            }
          >
            <Text style={styles.newButtonText}>
              + Nouvelle
            </Text>
          </TouchableOpacity>
        </View>

        {/* LISTE DES TRANSACTIONS */}
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: 30,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              entity={currentEntity}
              reload={reload}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Aucune transaction pour le moment
              </Text>
            </View>
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

  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },

  emptyText: {
    textAlign: "center",
    color: "#6b7280",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    color: "#ef4444",
    fontSize: 16,
  },
});