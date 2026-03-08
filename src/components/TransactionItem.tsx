import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";

import { Transaction } from "@/types/finance.types";
import {
  Entity,
  archiveTransaction,
} from "@/src/finance/services/financeTransactionService";

interface Props {
  transaction: Transaction;
  entity: Entity;
  reload?: () => void;
}

export default function TransactionItem({
  transaction,
  entity,
  reload,
}: Props) {
  const router = useRouter();

  const isIncome = transaction.type === "income";

  const shortDescription = transaction.description
    ? transaction.description.length > 40
      ? transaction.description.slice(0, 40) + "..."
      : transaction.description
    : "—";

  const formattedDate =
    transaction.date instanceof Date
      ? transaction.date.toLocaleDateString()
      : "";

  const handleEdit = () => {
    router.push({
      pathname: "/(finance)/[entity]/new-transaction",
      params: {
        entity,
        id: transaction.id,
      },
    });
  };

  const handleArchive = () => {
    Alert.alert(
      "Archiver la transaction",
      "Voulez-vous déplacer cette transaction dans la corbeille ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Archiver",
          style: "destructive",
          onPress: async () => {
            try {
              await archiveTransaction(entity, transaction.id);
              reload?.();
            } catch (error) {
              console.log("Erreur archivage transaction:", error);
              Alert.alert(
                "Erreur",
                "Impossible d’archiver la transaction"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleEdit}>
      <View style={styles.left}>
        <Text style={styles.category}>
          {transaction.category || "Sans catégorie"}
        </Text>

        <Text style={styles.description}>{shortDescription}</Text>

        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? "#16a34a" : "#dc2626" },
          ]}
        >
          {isIncome ? "+" : "-"}{" "}
          {(transaction.amount ?? 0).toLocaleString()}
        </Text>

        <TouchableOpacity onPress={handleArchive}>
          <Text style={styles.delete}>Archiver</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },

  delete: {
    marginTop: 6,
    fontSize: 12,
    color: "#ef4444",
  },
});