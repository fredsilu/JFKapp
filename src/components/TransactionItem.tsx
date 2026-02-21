import { View, Text, StyleSheet } from "react-native";
import { Transaction } from "@/types/finance.types";

interface Props {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: Props) {
  const isIncome = transaction.type === "income";

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.category}>{transaction.category}</Text>
        <Text style={styles.date}>
          {new Date(transaction.date).toLocaleDateString()}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          { color: isIncome ? "#16a34a" : "#dc2626" },
        ]}
      >
        {isIncome ? "+" : "-"} {transaction.amount.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 1,
  },
  category: {
    fontWeight: "bold",
  },
  date: {
    fontSize: 12,
    color: "#666",
  },
  amount: {
    fontWeight: "bold",
    fontSize: 16,
  },
});