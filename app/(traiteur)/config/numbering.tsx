//app/(traiteur)/config/numbering.tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import {
  getNumberingCounters,
  recalculateCounters,
  setInvoiceCounter,
  setProformaCounter,
} from "@/src/services/numberingSettings.service";

export default function NumberingSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoice, setInvoice] = useState("");
  const [proforma, setProforma] = useState("");

  const loadCounters = useCallback(async () => {
    try {
      setLoading(true);
      const counters = await getNumberingCounters();

      setInvoice(String(counters.invoice));
      setProforma(String(counters.proforma));
    } catch (error) {
      console.error("❌ load counters error:", error);
      Alert.alert("Erreur", "Impossible de charger les compteurs");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCounters();
    }, [loadCounters])
  );

  async function handleSave() {
    const invoiceValue = Number(invoice);
    const proformaValue = Number(proforma);

    if (!Number.isFinite(invoiceValue) || invoiceValue < 0) {
      Alert.alert("Erreur", "Compteur facture invalide");
      return;
    }

    if (!Number.isFinite(proformaValue) || proformaValue < 0) {
      Alert.alert("Erreur", "Compteur proforma invalide");
      return;
    }

    try {
      setSaving(true);

      await Promise.all([
        setInvoiceCounter(invoiceValue),
        setProformaCounter(proformaValue),
      ]);

      Alert.alert("Succès", "Compteurs mis à jour.");
      await loadCounters();
    } catch (error) {
      console.error("❌ save counters error:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les compteurs");
    } finally {
      setSaving(false);
    }
  }

  async function handleRecalculate() {
    try {
      setSaving(true);

      const counters = await recalculateCounters();

      setInvoice(String(counters.invoice));
      setProforma(String(counters.proforma));

      Alert.alert(
        "Recalcul terminé",
        `Dernière facture : ${counters.invoice}\nDernière proforma : ${counters.proforma}`
      );
    } catch (error) {
      console.error("❌ recalculate counters error:", error);
      Alert.alert("Erreur", "Impossible de recalculer les compteurs");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Numérotation</Text>

      <Text style={styles.notice}>
        Ces valeurs représentent le dernier numéro officiel utilisé. La prochaine facture ou proforma prendra le numéro suivant.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Dernière facture officielle</Text>
        <TextInput
          style={styles.input}
          value={invoice}
          onChangeText={setInvoice}
          keyboardType="numeric"
          placeholder="Ex: 57"
        />

        <Text style={styles.preview}>
          Prochaine facture : CR{new Date().getFullYear()}-FC-
          {String(Number(invoice || 0) + 1).padStart(3, "0")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Dernière proforma officielle</Text>
        <TextInput
          style={styles.input}
          value={proforma}
          onChangeText={setProforma}
          keyboardType="numeric"
          placeholder="Ex: 34"
        />

        <Text style={styles.preview}>
          Prochaine proforma : CR{new Date().getFullYear()}-PR-
          {String(Number(proforma || 0) + 1).padStart(3, "0")}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, saving && styles.disabledButton]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.primaryButtonText}>
          Enregistrer les compteurs
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, saving && styles.disabledButton]}
        onPress={handleRecalculate}
        disabled={saving}
      >
        <Text style={styles.secondaryButtonText}>
          Recalculer depuis les documents
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#4B5563",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
  },
  notice: {
    backgroundColor: "#FFFBEB",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: "#92400E",
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  preview: {
    marginTop: 8,
    color: "#2563EB",
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  backButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
});