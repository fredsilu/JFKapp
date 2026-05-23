//app/(finance)/[entity]/new-transaction.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert, ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

import {
  createTransaction,
  Entity,
} from "@/src/finance/services/financeTransactionService";

import { useAccounts } from "@/src/finance/hooks/useAccounts";
import { getEntity } from "@/src/finance/utils/getEntity";
import { getTransactionId } from "@/src/finance/utils/getTransactionId";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ===================================================== */
/* DEFAULT SYSTEM ACCOUNTS                               */
/* ===================================================== */

const DEFAULT_ACCOUNTS = [
  { id: "cash", name: "💵 Espèces" },
  { id: "bank", name: "🏦 Banque" },
  { id: "mobile", name: "📱 Mobile" },
];

/* ===================================================== */
/* CATEGORY MAP                                          */
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
  const params = useLocalSearchParams();

  const [saving, setSaving] = useState(false);

  const currentEntity = getEntity(params);

  const { accounts } = useAccounts(currentEntity);

  const finalAccounts =
    accounts && accounts.length > 0 ? accounts : DEFAULT_ACCOUNTS;

  let transactionId: string | null = null;

  try {
    transactionId = getTransactionId(params);
  } catch {
    transactionId = null;
  }

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = CATEGORY_MAP[currentEntity][type];

  /* ============================= */
  /* LOAD TRANSACTION FOR EDIT     */
  /* ============================= */

  useEffect(() => {

    if (!transactionId) return;

    const id: string = transactionId;

    async function loadTransaction() {
      try {
        const ref = doc(db, "finance", currentEntity, "transactions", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const t: any = snap.data();
        setType(t.type ?? "expense");
        setAmount(t.amount ? String(t.amount) : "");
        setCategory(t.category ?? null);
        setDescription(t.description ?? "");
        setAccountId(t.accountId ?? null);

        if (t.date) {
          setDate(t.date.toDate());
        }

      } catch (error) {
        console.log("Erreur chargement transaction", error);
      }
    }

    loadTransaction();

  }, [transactionId]);

  /* ============================= */
  /* SAVE                          */
  /* ============================= */

  async function handleSave() {
    if (saving) return;

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
      setSaving(true);

      if (transactionId) {
        await updateDoc(
          doc(db, "finance", currentEntity, "transactions", transactionId),
          {
            type,
            amount: numericAmount,
            currency: "USD",
            date,
            accountId,
            category,
            description,
          }
        );
      } else {
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
      }

      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Erreur", "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          {transactionId
            ? "Modifier transaction"
            : `Nouvelle transaction ${currentEntity}`}
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
              onPress={() => setType(t as "income" | "expense")}
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
            onChange={(_, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
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

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveText}>
              {transactionId ? "Mettre à jour" : "Enregistrer"}
            </Text>
          )}
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

  saveButtonDisabled: {
    opacity: 0.7,
  },

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


  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});