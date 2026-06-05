// app/(traiteur)/invoices/edit/[id].tsx
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

import { CateringInvoice } from "@/types/catering";

import {
    getCateringInvoiceById,
    updateDraftInvoice,
    issueReplacementDraftInvoice,
} from "@/src/services/cateringInvoice.service";

type EditableInvoiceItem = {
    label: string;
    quantity: number;
    numberOfDays?: number;
    days?: number;
    unitPrice?: number;
    total?: number;
    totalPrice?: number;
};

function toNumber(value: string | number | undefined | null): number {
    const n = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
}

function calculateItemTotal(item: EditableInvoiceItem): number {
    const quantity = toNumber(item.quantity);
    const days = toNumber(item.numberOfDays ?? item.days ?? 1) || 1;
    const unitPrice = toNumber(item.unitPrice);

    return quantity * days * unitPrice;
}

function calculateTotals(items: EditableInvoiceItem[]) {
    const subtotal = items.reduce((sum, item) => {
        return sum + calculateItemTotal(item);
    }, 0);

    return {
        subtotal,
        discount: 0,
        discountAmount: 0,
        tax: 0,
        totalAfterDiscount: subtotal,
        total: subtotal,
        currency: "USD",
    };
}

export default function EditInvoiceScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [invoice, setInvoice] = useState<CateringInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [designation, setDesignation] = useState("");
    const [eventName, setEventName] = useState("");
    const [dateLivraison, setDateLivraison] = useState("");
    const [deliveryTime, setDeliveryTime] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [guestCount, setGuestCount] = useState("");
    const [comment, setComment] = useState("");
    const [items, setItems] = useState<EditableInvoiceItem[]>([]);

    const totals = calculateTotals(items);

    const loadInvoice = useCallback(async () => {
        if (!id) {
            Alert.alert("Erreur", "Identifiant facture introuvable");
            router.replace("/(traiteur)/invoices");
            return;
        }

        try {
            setLoading(true);

            const data = await getCateringInvoiceById(id);

            if (!data) {
                Alert.alert("Erreur", "Facture introuvable");
                router.replace("/(traiteur)/invoices");
                return;
            }

            if (data.status !== "draft") {
                Alert.alert(
                    "Facture verrouillée",
                    "Seule une facture brouillon peut être modifiée."
                );
                if (!data.id) {
                    Alert.alert("Erreur", "Identifiant facture manquant");
                    router.replace("/(traiteur)/invoices");
                    return;
                }
                router.replace({
                    pathname: "/(traiteur)/invoices/[id]",
                    params: { id: String(id) },
                });

                return;
            }

            setInvoice(data);
            setDesignation(data.designation || "");
            setEventName(data.eventName || "");
            setDateLivraison(data.dateLivraison || "");
            setDeliveryTime(data.deliveryTime || "");
            setDeliveryAddress(data.deliveryAddress || "");
            setGuestCount(String(data.guestCount ?? ""));
            setComment(data.comment || "");

            setItems(
                (data.items || []).map((item: any) => ({
                    label: item.label || item.name || "",
                    quantity: toNumber(item.quantity),
                    numberOfDays: toNumber(item.numberOfDays ?? item.days ?? 1) || 1,
                    unitPrice: toNumber(item.unitPrice),
                    total: toNumber(item.total ?? item.totalPrice),
                }))
            );
        } catch (error) {
            console.error("❌ load draft invoice error:", error);
            Alert.alert("Erreur", "Impossible de charger la facture");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadInvoice();
        }, [loadInvoice])
    );

    function updateItem(
        index: number,
        field: keyof EditableInvoiceItem,
        value: string
    ) {
        setItems((current) =>
            current.map((item, itemIndex) => {
                if (itemIndex !== index) return item;

                const updatedItem = {
                    ...item,
                    [field]:
                        field === "label"
                            ? value
                            : toNumber(value),
                };

                return {
                    ...updatedItem,
                    total: calculateItemTotal(updatedItem),
                    totalPrice: calculateItemTotal(updatedItem),
                };
            })
        );
    }

    function addItem() {
        setItems((current) => [
            ...current,
            {
                label: "Nouvelle ligne",
                quantity: 1,
                numberOfDays: 1,
                unitPrice: 0,
                total: 0,
                totalPrice: 0,
            },
        ]);
    }

    function removeItem(index: number) {
        setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    }

    async function handleSaveDraft() {
        if (!id) return;

        try {
            setSaving(true);

            const normalizedItems = items.map((item) => {
                const numberOfDays = toNumber(item.numberOfDays ?? item.days ?? 1) || 1;
                const quantity = toNumber(item.quantity);
                const unitPrice = toNumber(item.unitPrice);
                const total = quantity * numberOfDays * unitPrice;

                return {
                    ...item,
                    label: item.label || "Ligne sans libellé",
                    quantity,
                    numberOfDays,
                    days: numberOfDays,
                    unitPrice,
                    total,
                    totalPrice: total,
                };
            });

            await updateDraftInvoice(id, {
                designation,
                eventName,
                dateLivraison,
                deliveryTime,
                deliveryAddress,
                guestCount: toNumber(guestCount),
                comment,
                items: normalizedItems as any,
                totals: calculateTotals(normalizedItems) as any,
            });

            Alert.alert("Succès", "Brouillon sauvegardé.");
        } catch (error: unknown) {
            console.error("❌ save draft invoice error:", error);

            Alert.alert(
                "Erreur",
                error instanceof Error
                    ? error.message
                    : "Impossible de sauvegarder le brouillon"
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleIssueInvoice() {
        if (!id) return;

        const confirmMessage =
            "Voulez-vous émettre cette facture ? Après émission, elle sera verrouillée.";

        const confirmed =
            Platform.OS === "web" && typeof window !== "undefined"
                ? window.confirm(confirmMessage)
                : true;

        if (!confirmed) return;

        try {
            setSaving(true);

            await handleSaveDraft();

            const issuedInvoice = await issueReplacementDraftInvoice(id);

            Alert.alert("Succès", "Facture émise avec succès.");

            router.replace({
                pathname: "/(traiteur)/invoices/[id]",
                params: { id: String(issuedInvoice.id ?? id) },
            });
        } catch (error: unknown) {
            console.error("❌ issue draft invoice error:", error);

            Alert.alert(
                "Erreur",
                error instanceof Error
                    ? error.message
                    : "Impossible d’émettre la facture"
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Chargement du brouillon...</Text>
            </View>
        );
    }

    if (!invoice) {
        return (
            <View style={styles.center}>
                <Text>Facture introuvable</Text>
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
            <Text style={styles.title}>Modifier facture brouillon</Text>

            <View style={styles.notice}>
                <Text style={styles.noticeTitle}>Brouillon modifiable</Text>
                <Text style={styles.noticeText}>
                    Vous pouvez modifier les informations et les lignes de facture avant
                    émission.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Numéro</Text>
                <Text style={styles.value}>{invoice.number}</Text>

                <Text style={styles.label}>Client</Text>
                <Text style={styles.value}>{invoice.client?.name || "—"}</Text>
            </View>

            <Text style={styles.inputLabel}>Désignation</Text>
            <TextInput
                style={styles.input}
                value={designation}
                onChangeText={setDesignation}
            />

            <Text style={styles.inputLabel}>Événement</Text>
            <TextInput
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
            />

            <Text style={styles.inputLabel}>Date livraison</Text>
            <TextInput
                style={styles.input}
                value={dateLivraison}
                onChangeText={setDateLivraison}
                placeholder="YYYY-MM-DD"
            />

            <Text style={styles.inputLabel}>Heure livraison</Text>
            <TextInput
                style={styles.input}
                value={deliveryTime}
                onChangeText={setDeliveryTime}
            />

            <Text style={styles.inputLabel}>Lieu livraison</Text>
            <TextInput
                style={styles.input}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
            />

            <Text style={styles.inputLabel}>Nombre de personnes</Text>
            <TextInput
                style={styles.input}
                value={guestCount}
                onChangeText={setGuestCount}
                keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Commentaire</Text>
            <TextInput
                style={styles.textArea}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
            />

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Lignes de facture</Text>

                <TouchableOpacity style={styles.addButton} onPress={addItem}>
                    <Text style={styles.addButtonText}>+ Ligne</Text>
                </TouchableOpacity>
            </View>

            {items.map((item, index) => (
                <View key={`${item.label}-${index}`} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>Ligne {index + 1}</Text>

                    <Text style={styles.inputLabel}>Libellé</Text>
                    <TextInput
                        style={styles.input}
                        value={item.label}
                        onChangeText={(value) => updateItem(index, "label", value)}
                    />

                    <Text style={styles.inputLabel}>Jours</Text>
                    <TextInput
                        style={styles.input}
                        value={String(item.numberOfDays ?? item.days ?? 1)}
                        onChangeText={(value) => updateItem(index, "numberOfDays", value)}
                        keyboardType="numeric"
                    />

                    <Text style={styles.inputLabel}>Quantité</Text>
                    <TextInput
                        style={styles.input}
                        value={String(item.quantity ?? 0)}
                        onChangeText={(value) => updateItem(index, "quantity", value)}
                        keyboardType="numeric"
                    />

                    <Text style={styles.inputLabel}>Prix unitaire</Text>
                    <TextInput
                        style={styles.input}
                        value={String(item.unitPrice ?? 0)}
                        onChangeText={(value) => updateItem(index, "unitPrice", value)}
                        keyboardType="numeric"
                    />

                    <Text style={styles.totalLine}>
                        Total ligne : {calculateItemTotal(item).toLocaleString("fr-FR")} $
                    </Text>

                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeItem(index)}
                    >
                        <Text style={styles.removeButtonText}>Supprimer la ligne</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total facture</Text>
                <Text style={styles.totalValue}>
                    {totals.total.toLocaleString("fr-FR")} $
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSaveDraft}
                disabled={saving}
            >
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sauvegarder le brouillon</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.issueButton, saving && styles.disabledButton]}
                onPress={handleIssueInvoice}
                disabled={saving}
            >
                <Text style={styles.buttonText}>Émettre la facture</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() =>
                    router.replace({
                        pathname: "/(traiteur)/invoices/[id]",
                        params: { id: String(id) },
                    })
                }
                disabled={saving}
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
        backgroundColor: "#EEF2FF",
        borderWidth: 1,
        borderColor: "#C7D2FE",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },

    noticeTitle: {
        fontSize: 15,
        fontWeight: "900",
        color: "#3730A3",
        marginBottom: 6,
    },

    noticeText: {
        fontSize: 13,
        lineHeight: 19,
        color: "#312E81",
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
        fontSize: 13,
        fontWeight: "800",
        color: "#374151",
        marginBottom: 6,
    },

    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: "#111827",
        marginBottom: 12,
    },

    textArea: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        minHeight: 100,
        padding: 12,
        fontSize: 14,
        color: "#111827",
        marginBottom: 14,
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
        marginBottom: 10,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#111827",
    },

    addButton: {
        backgroundColor: "#065F46",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },

    addButtonText: {
        color: "#fff",
        fontWeight: "900",
    },

    itemCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    itemTitle: {
        fontSize: 15,
        fontWeight: "900",
        color: "#111827",
        marginBottom: 10,
    },

    totalLine: {
        fontSize: 14,
        fontWeight: "900",
        color: "#065F46",
        marginBottom: 10,
    },

    removeButton: {
        backgroundColor: "#FEE2E2",
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },

    removeButtonText: {
        color: "#B91C1C",
        fontWeight: "900",
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
        backgroundColor: "#16A34A",
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
    contentContainer: {
        paddingBottom: 120,
        flexGrow: 1,
    },
});