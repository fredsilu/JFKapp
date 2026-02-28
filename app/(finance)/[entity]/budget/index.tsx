import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useBudgets } from "@/src/finance/hooks/useBudgets";
import { EntityType } from "@/types/finance.types";

export default function BudgetScreen() {
  const { entity } = useLocalSearchParams<{ entity: EntityType }>();

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const { budgets, loading } = useBudgets(
    entity as EntityType,
    month,
    year
  );

  if (loading) {
    return <Text>Chargement...</Text>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          router.push({
            pathname: "/(finance)/[entity]/budget/new",
            params: { entity },
          })
        }
      >
        <Text style={styles.addText}>+ Ajouter un budget</Text>
      </TouchableOpacity>
      <Text style={styles.title}>
        Budget {entity} - {month + 1}/{year}
      </Text>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.category}>
              {item.category}
            </Text>
            <Text>
              {item.amount} {item.currency}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  category: {
    fontWeight: "600",
  },
  addButton: {
  backgroundColor: "#111827",
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 8,
  alignSelf: "flex-start",
  marginBottom: 16,
},

addText: {
  color: "white",
  fontWeight: "bold",
},
});