// app/(traiteur)/config/numbering.tsx
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
  Modal,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import {
  getNumberingCounters,
  recalculateCounters,
  setInvoiceCounter,
  setProformaCounter,
} from "@/src/services/numberingSettings.service";

type PendingAction = "save" | "recalculate" | null;

export default function NumberingSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoice, setInvoice] = useState("");
  const [proforma, setProforma] = useState("");

  const [originalInvoice, setOriginalInvoice] = useState(0);
  const [originalProforma, setOriginalProforma] = useState(0);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const loadCounters = useCallback(async () => {
    try {
      setLoading(true);

      const counters = await getNumberingCounters();

      const invoiceCounter = Number(counters.invoice ?? 0);
      const proformaCounter = Number(counters.proforma ?? 0);

      setInvoice(String(invoiceCounter));
      setProforma(String(proformaCounter));

      setOriginalInvoice(invoiceCounter);
      setOriginalProforma(proformaCounter);
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

  function sanitizeNumber(value: string) {
    return value.replace(/[^0-9]/g, "");
  }

  function openConfirmation(action: PendingAction) {
    setPendingAction(action);
    setConfirmText("");
    setConfirmVisible(true);
  }

  function closeConfirmation() {
    if (saving) return;

    setConfirmVisible(false);
    setConfirmText("");
    setPendingAction(null);
  }

  function validateCounters() {
    const invoiceValue = Number(invoice || 0);
    const proformaValue = Number(proforma || 0);

    if (!Number.isInteger(invoiceValue) || invoiceValue < 0) {
      Alert.alert("Erreur", "Compteur facture invalide");
      return null;
    }

    if (!Number.isInteger(proformaValue) || proformaValue < 0) {
      Alert.alert("Erreur", "Compteur proforma invalide");
      return null;
    }

    if (invoiceValue < originalInvoice) {
      Alert.alert(
        "Modification bloquée",
        `Le compteur facture ne peut pas être inférieur au dernier compteur connu (${originalInvoice}).`
      );
      return null;
    }

    if (proformaValue < originalProforma) {
      Alert.alert(
        "Modification bloquée",
        `Le compteur proforma ne peut pas être inférieur au dernier compteur connu (${originalProforma}).`
      );
      return null;
    }

    return {
      invoiceValue,
      proformaValue,
    };
  }

  async function executeSave() {
    const values = validateCounters();

    if (!values) return;

    try {
      setSaving(true);

      await Promise.all([
        setInvoiceCounter(values.invoiceValue),
        setProformaCounter(values.proformaValue),
      ]);

      setInvoice(String(values.invoiceValue));
      setProforma(String(values.proformaValue));

      setOriginalInvoice(values.invoiceValue);
      setOriginalProforma(values.proformaValue);

      Alert.alert("Succès", "Compteurs mis à jour.");
    } catch (error) {
      console.error("❌ save counters error:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les compteurs");
    } finally {
      setSaving(false);
      closeConfirmation();
    }
  }

  async function executeRecalculate() {
    try {
      setSaving(true);

      const counters = await recalculateCounters();

      const invoiceCounter = Number(counters.invoice ?? 0);
      const proformaCounter = Number(counters.proforma ?? 0);

      setInvoice(String(invoiceCounter));
      setProforma(String(proformaCounter));

      setOriginalInvoice(invoiceCounter);
      setOriginalProforma(proformaCounter);

      Alert.alert(
        "Recalcul terminé",
        `Dernière facture : ${invoiceCounter}\nDernière proforma : ${proformaCounter}`
      );
    } catch (error) {
      console.error("❌ recalculate counters error:", error);
      Alert.alert("Erreur", "Impossible de recalculer les compteurs");
    } finally {
      setSaving(false);
      closeConfirmation();
    }
  }

  function handleSave() {
    const values = validateCounters();

    if (!values) return;

    if (
      values.invoiceValue === originalInvoice &&
      values.proformaValue === originalProforma
    ) {
      Alert.alert("Information", "Aucune modification à enregistrer.");
      return;
    }

    openConfirmation("save");
  }

  function handleRecalculate() {
    openConfirmation("recalculate");
  }

  async function handleConfirmAction() {
    if (confirmText.trim().toUpperCase() !== "CONFIRMER") {
      Alert.alert(
        "Confirmation requise",
        'Veuillez saisir exactement "CONFIRMER" pour continuer.'
      );
      return;
    }

    if (pendingAction === "save") {
      await executeSave();
      return;
    }

    if (pendingAction === "recalculate") {
      await executeRecalculate();
    }
  }

  const nextInvoice = String(Number(invoice || 0) + 1).padStart(3, "0");
  const nextProforma = String(Number(proforma || 0) + 1).padStart(3, "0");
  const year = new Date().getFullYear();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Numérotation</Text>

        <Text style={styles.notice}>
          Ces valeurs représentent le dernier numéro officiel utilisé. La
          prochaine facture ou proforma prendra le numéro suivant.
        </Text>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Zone sensible</Text>

          <Text style={styles.warningText}>
            Modifier manuellement la numérotation peut créer des doublons ou
            casser la continuité des documents officiels. Cette action doit être
            réservée à une correction exceptionnelle.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Dernière facture officielle</Text>

          <TextInput
            style={styles.input}
            value={invoice}
            onChangeText={(value) => setInvoice(sanitizeNumber(value))}
            keyboardType="numeric"
            placeholder="Ex: 57"
          />

          <Text style={styles.currentValue}>
            Valeur actuelle : {originalInvoice}
          </Text>

          <Text style={styles.preview}>
            Prochaine facture : CR{year}-FC-{nextInvoice}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Dernière proforma officielle</Text>

          <TextInput
            style={styles.input}
            value={proforma}
            onChangeText={(value) => setProforma(sanitizeNumber(value))}
            keyboardType="numeric"
            placeholder="Ex: 34"
          />

          <Text style={styles.currentValue}>
            Valeur actuelle : {originalProforma}
          </Text>

          <Text style={styles.preview}>
            Prochaine proforma : CR{year}-PR-{nextProforma}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Enregistrement..." : "Enregistrer les compteurs"}
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

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={closeConfirmation}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmation obligatoire</Text>

            <Text style={styles.modalWarning}>
              Cette opération touche à la numérotation officielle des documents.
              Une erreur peut créer des doublons ou casser la continuité des
              factures et proformas.
            </Text>

            <Text style={styles.modalText}>
              Pour continuer, saisissez exactement :
            </Text>

            <Text style={styles.confirmKeyword}>CONFIRMER</Text>

            <TextInput
              style={styles.confirmInput}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Saisir CONFIRMER"
              autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={closeConfirmation}
                disabled={saving}
              >
                <Text style={styles.cancelModalButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmModalButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleConfirmAction}
                disabled={saving}
              >
                <Text style={styles.confirmModalButtonText}>
                  {saving ? "Traitement..." : "Confirmer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    marginBottom: 12,
  },
  warningCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    color: "#991B1B",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 6,
  },
  warningText: {
    color: "#7F1D1D",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
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
  currentValue: {
    marginTop: 8,
    color: "#6B7280",
    fontWeight: "700",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },
  modalWarning: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: "#991B1B",
    fontWeight: "700",
    lineHeight: 19,
    marginBottom: 12,
  },
  modalText: {
    color: "#374151",
    fontSize: 14,
    marginBottom: 6,
  },
  confirmKeyword: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  confirmInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelModalButtonText: {
    color: "#111827",
    fontWeight: "800",
  },
  confirmModalButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmModalButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
});