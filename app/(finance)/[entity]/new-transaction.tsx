import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createTransaction, Entity } from "@/src/finance/services/financeTransactionService";
import { useAccounts } from "@/src/finance/hooks/useAccounts";

/* ===================================================== */
/* DEFAULT SYSTEM ACCOUNTS                              */
/* ===================================================== */

const DEFAULT_ACCOUNTS = [
  { id: "cash", name: "💵 Espèces" },
  { id: "bank", name: "🏦 Banque" },
  { id: "mobile", name: "📱 Mobile" },
];

/* ===================================================== */
/* CATEGORY MAP                                         */
/* ===================================================== */

const CATEGORY_MAP: Record<
  Entity,
  { income: string[]; expense: string[] }
> = {
  maison: {
    income: ["Salaire", "Dividende", "Remboursement", "Autre"],
    expense: [
      "Courses",
      "École",
      "Loyer",
      "Transport",
      "Santé",
      "Électricité",
      "Dîme & Offrandes",
      "Autre",
    ],
  },
  crepolia: {
    income: ["Vente", "Catering", "Contrat", "Autre"],
    expense: [
      "Achat matière",
      "Salaires",
      "Transport",
      "Gaz",
      "Marketing",
      "Autre",
    ],
  },
};

/* ===================================================== */

export default function NewTransaction() {
  const router = useRouter();
  const { entity } = useLocalSearchParams<{ entity: Entity }>();
  const currentEntity = entity as Entity;

  const { accounts } = useAccounts(currentEntity);

  // 🔥 fallback si aucun compte
  const finalAccounts =
    accounts && accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!currentEntity) return null;

  const categories = CATEGORY_MAP[currentEntity][type];

  async function handleSave() {
    const numericAmount = parseFloat(amount);

    if (!numericAmount || numericAmount <= 0) {
      Alert.alert("Montant invalide");
      return;
    }

    if (!category || !accountId) {
      Alert.alert("Tous les champs sont obligatoires");
      return;
    }

    try {
      await createTransaction(currentEntity, {
        type,
        amount: numericAmount,
        currency: "USD",
        date,
        accountId,
        category,
        description,
        isInternalTransfer: false,
      });

      router.back();
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.title}>
          Nouvelle transaction {currentEntity}
        </Text>

        {/* TYPE */}
        <View style={styles.typeContainer}>
          {["income", "expense"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeButton,
                type === t &&
                (t === "income"
                  ? styles.incomeActive
                  : styles.expenseActive),
              ]}
              onPress={() => setType(t as any)}
            >
              <Text style={styles.typeText}>
                {t === "income" ? "Entrée" : "Dépense"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MONTANT */}
        <TextInput
          placeholder="Montant USD"
          keyboardType="numeric"
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
        />

        {/* DATE */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )}

        {/* COMPTES */}
        <Text style={styles.label}>Compte</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {finalAccounts.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.chip,
                accountId === acc.id && styles.chipActive,
              ]}
              onPress={() => setAccountId(acc.id)}
            >
              <Text>{acc.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CATEGORIES */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  category === cat && styles.chipActivePurple,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* DESCRIPTION */}
        <View style={{ marginTop: 20 }}>
          <TextInput
            placeholder="Description"
            style={styles.input}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* SAVE */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Enregistrer</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ===================================================== */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },

  typeContainer: { flexDirection: "row", marginBottom: 16 },

  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#e5e7eb",
  },

  incomeActive: { backgroundColor: "#16a34a" },
  expenseActive: { backgroundColor: "#dc2626" },

  typeText: { color: "white", fontWeight: "600" },

  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  label: { fontWeight: "600", marginBottom: 8 },

  chip: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  chipActive: {
    borderColor: "#2563eb",
    borderWidth: 2,
  },

  chipActivePurple: {
    borderColor: "#9333ea",
    borderWidth: 2,
  },

  saveButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  saveText: { color: "white", fontWeight: "bold" },
});
