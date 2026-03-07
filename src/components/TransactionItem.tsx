import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types/finance.types";
import { Entity } from "@/src/finance/services/financeTransactionService";

interface Props {
  transaction: Transaction;
  entity: Entity;
}

export default function TransactionItem({ transaction, entity }: Props) {
  const router = useRouter();

  const isIncome = transaction.type === "income";

  const shortDescription = transaction.description
    ? transaction.description.length > 40
      ? transaction.description.slice(0, 40) + "..."
      : transaction.description
    : "—";

  const handleEdit = () => {
    router.push({
      pathname: "/(finance)/[entity]/new-transaction",
      params: {
        entity,
        id: transaction.id,
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous supprimer cette transaction ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "finance", transaction.id));
            } catch (error) {
              console.log("Erreur suppression:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleEdit}>
      <View style={styles.left}>
        <Text style={styles.category}>{transaction.category}</Text>

        <Text style={styles.description}>{shortDescription}</Text>

        <Text style={styles.date}>
          {new Date(transaction.date).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: isIncome ? "#16a34a" : "#dc2626" },
          ]}
        >
          {isIncome ? "+" : "-"} {transaction.amount.toLocaleString()}
        </Text>

        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.delete}>Supprimer</Text>
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