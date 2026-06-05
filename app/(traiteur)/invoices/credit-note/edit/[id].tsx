// app/(traiteur)/invoices/credit-note/edit/[id].tsx
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
    Platform,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import {
    getCreditNoteById,
    updateDraftCreditNote,
    issueCreditNote,
    CreditNote,
} from "@/src/services/creditNote.service";

import { formatCurrency } from "@/src/utils/costs";

export default function EditCreditNoteScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");

    const loadCreditNote = useCallback(async () => {
        if (!id) {
            Alert.alert("Erreur", "Identifiant avoir introuvable");
            router.replace("/(traiteur)/invoices");
            return;
        }

        try {
            setLoading(true);

            const data = await getCreditNoteById(id);

            if (!data) {
                Alert.alert("Erreur", "Avoir introuvable");
                router.replace("/(traiteur)/invoices");
                return;
            }

            if (data.status !== "draft") {
                Alert.alert(
                    "Avoir verrouillé",
                    "Seul un avoir brouillon peut être modifié."
                );

                router.replace({
                    pathname: "/(traiteur)/invoices/[id]",
                    params: { id: String(data.invoiceId) },
                });

                return;
            }

            setCreditNote(data);
            setAmount(String(data.amount ?? ""));
            setReason(data.reason ?? "");
        } catch (error) {
            console.error("❌ load credit note error:", error);
            Alert.alert("Erreur", "Impossible de charger l’avoir");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadCreditNote();
        }, [loadCreditNote])
    );

    const cleanAmount = Number(amount.replace(",", ".").trim());
    const cleanReason = reason.trim();

    const canSave =
        !saving &&
        Number.isFinite(cleanAmount) &&
        cleanAmount > 0 &&
        cleanReason.length >= 3;

    async function handleSaveDraft() {
        if (!id) return;

        if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
            Alert.alert("Erreur", "Montant invalide");
            return;
        }

        if (cleanReason.length < 3) {
            Alert.alert("Erreur", "Motif obligatoire");
            return;
        }

        try {
            setSaving(true);

            await updateDraftCreditNote(id, {
                amount: cleanAmount,
                reason: cleanReason,
            });

            Alert.alert("Succès", "Brouillon d’avoir sauvegardé.");
        } catch (error: any) {
            console.error("❌ save credit note error:", error);
            Alert.alert(
                "Erreur",
                error?.message || "Impossible de sauvegarder l’avoir"
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleIssueCreditNote() {
        if (!id) return;

        const confirmMessage =
            "Voulez-vous émettre cet avoir ? Après émission, il sera verrouillé.";

        const confirmed =
            Platform.OS === "web" && typeof window !== "undefined"
                ? window.confirm(confirmMessage)
                : true;

        if (!confirmed) return;

        try {
            setSaving(true);

            await handleSaveDraft();

            const issuedCreditNote = await issueCreditNote(id);

            Alert.alert("Succès", "Avoir émis avec succès.");

            router.replace({
                pathname: "/(traiteur)/invoices/[id]",
                params: { id: String(issuedCreditNote.invoiceId) },
            });
        } catch (error: any) {
            console.error("❌ issue credit note error:", error);
            Alert.alert(
                "Erreur",
                error?.message || "Impossible d’émettre l’avoir"
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Chargement de l’avoir...</Text>
            </View>
        );
    }

    if (!creditNote) {
        return (
            <View style={styles.center}>
                <Text>Avoir introuvable</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>Modifier avoir brouillon</Text>

            <View style={styles.notice}>
                <Text style={styles.noticeTitle}>Avoir modifiable</Text>
                <Text style={styles.noticeText}>
                    Vous pouvez modifier le montant et le motif avant émission.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Numéro avoir</Text>
                <Text style={styles.value}>{creditNote.number}</Text>

                <Text style={styles.label}>Facture concernée</Text>
                <Text style={styles.value}>{creditNote.invoiceNumber}</Text>

                <Text style={styles.label}>Type</Text>
                <Text style={styles.value}>
                    {creditNote.type === "full" ? "Avoir total" : "Avoir partiel"}
                </Text>
            </View>

            <Text style={styles.inputLabel}>Montant de l’avoir</Text>
            <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Ex : 150"
            />

            <Text style={styles.inputLabel}>Motif de l’avoir</Text>
            <TextInput
                style={styles.textArea}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholder="Ex : correction montant, remise commerciale..."
            />

            <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Montant avoir</Text>
                <Text style={styles.totalValue}>
                    {formatCurrency(Number.isFinite(cleanAmount) ? cleanAmount : 0)}
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.saveButton, (!canSave || saving) && styles.disabledButton]}
                onPress={handleSaveDraft}
                disabled={!canSave || saving}
            >
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sauvegarder le brouillon</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.issueButton, (!canSave || saving) && styles.disabledButton]}
                onPress={handleIssueCreditNote}
                disabled={!canSave || saving}
            >
                <Text style={styles.buttonText}>Émettre l’avoir</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() =>
                    router.replace({
                        pathname: "/(traiteur)/invoices/[id]",
                        params: { id: String(creditNote.invoiceId) },
                    })
                }
                disabled={saving}
            >
                <Text style={styles.backButtonText}>Retour facture</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F6F8",
        padding: 16,
    },

    contentContainer: {
        paddingBottom: 120,
        flexGrow: 1,
    },

    center: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },

    loadingText: {
        marginTop: 10,
        color: "#4B5563",
    },

    title: {
        fontSize: 24,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 16,
    },

    notice: {
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#F59E0B",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },

    noticeTitle: {
        fontSize: 15,
        fontWeight: "900",
        color: "#92400E",
        marginBottom: 6,
    },

    noticeText: {
        fontSize: 13,
        lineHeight: 19,
        color: "#78350F",
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },

    label: {
        fontSize: 12,
        fontWeight: "800",
        color: "#6B7280",
        marginTop: 6,
    },

    value: {
        fontSize: 15,
        fontWeight: "800",
        color: "#111827",
        marginTop: 2,
    },

    inputLabel: {
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 8,
    },

    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: "#111827",
        marginBottom: 14,
    },

    textArea: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        minHeight: 120,
        padding: 12,
        fontSize: 14,
        color: "#111827",
        marginBottom: 14,
    },

    totalCard: {
        backgroundColor: "#111827",
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
    },

    totalLabel: {
        color: "#D1D5DB",
        fontSize: 14,
        fontWeight: "700",
    },

    totalValue: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "900",
        marginTop: 4,
    },

    saveButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 10,
    },

    issueButton: {
        backgroundColor: "#D97706",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 10,
    },

    buttonText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 15,
    },

    disabledButton: {
        opacity: 0.7,
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
});