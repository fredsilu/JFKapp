// app/(traiteur)/documents/history/[id].tsx

import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { fetchArchivedDocumentById } from "@/src/services/archivedDocument.service";
import { ArchivedDocument } from "@/types/archives";

function formatAmount(value?: number, currency?: string) {
    if (!value) return `0,00 ${currency || "USD"}`;

    return `${value.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${currency || "USD"}`;
}

function formatDate(value?: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("fr-FR");
}

function getTypeLabel(type?: string) {
    switch (type) {
        case "invoice":
            return "Facture historique";
        case "proforma":
            return "Proforma historique";
        case "credit_note":
            return "Avoir historique";
        default:
            return "Document historique";
    }
}

export default function HistoricalDocumentDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [document, setDocument] = useState<ArchivedDocument | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDocument() {
            try {
                if (!id) return;

                const result = await fetchArchivedDocumentById(id);
                setDocument(result);
            } finally {
                setLoading(false);
            }
        }

        loadDocument();
    }, [id]);

    async function openPdf() {
        if (!document?.pdfUrl) return;

        await Linking.openURL(document.pdfUrl);
    }

    function editDocument() {
        router.push(`/(traiteur)/documents/history/${id}/edit` as never);
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Chargement du document historique...</Text>
            </View>
        );
    }

    if (!document) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Document historique introuvable.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={20} color="#065F46" />
                    <Text style={styles.backText}>Retour</Text>
                </TouchableOpacity>

                <Text style={styles.breadcrumb}>Documents / Historique</Text>
                <Text style={styles.title}>{document.number || "-"}</Text>
                <Text style={styles.subtitle}>{getTypeLabel(document.type)}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Informations principales</Text>

                <InfoRow label="Type" value={getTypeLabel(document.type)} />
                <InfoRow label="Numéro" value={document.number || "-"} />
                <InfoRow
                    label="Client"
                    value={
                        document.clientName ||
                        document.historicalClientName ||
                        "-"
                    }
                />
                <InfoRow label="Désignation" value={document.designation || "-"} />
                <InfoRow
                    label="Montant"
                    value={formatAmount(document.amount, document.currency)}
                />
                <InfoRow label="Devise" value={document.currency || "USD"} />
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Dates</Text>

                <InfoRow label="Date document" value={formatDate(document.documentDate)} />
                <InfoRow label="Date événement" value={formatDate(document.eventDate)} />
                <InfoRow label="Heure événement" value={document.eventTime || "-"} />
                <InfoRow label="Date facture" value={formatDate(document.invoiceDate)} />
                <InfoRow label="Date paiement" value={formatDate(document.paymentDate)} />
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Liens</Text>

                <InfoRow
                    label="Facture liée"
                    value={document.linkedInvoiceNumber || "-"}
                />
                <InfoRow
                    label="Proforma liée"
                    value={document.linkedProformaNumber || "-"}
                />
                <InfoRow
                    label="Fichier"
                    value={document.fileName || "-"}
                />
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, !document.pdfUrl && styles.disabledButton]}
                    onPress={openPdf}
                    disabled={!document.pdfUrl}
                >
                    <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Voir PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={editDocument}>
                    <MaterialIcons name="edit" size={20} color="#065F46" />
                    <Text style={styles.secondaryButtonText}>Modifier</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    content: {
        padding: 16,
        gap: 14,
    },
    center: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 8,
        color: "#6B7280",
    },
    errorText: {
        color: "#DC2626",
        fontWeight: "700",
    },
    header: {
        gap: 4,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
    },
    backText: {
        color: "#065F46",
        fontWeight: "700",
    },
    breadcrumb: {
        fontSize: 13,
        color: "#6B7280",
    },
    title: {
        fontSize: 26,
        fontWeight: "800",
        color: "#064E3B",
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    infoLabel: {
        flex: 1,
        color: "#6B7280",
        fontSize: 14,
    },
    infoValue: {
        flex: 2,
        color: "#111827",
        fontSize: 14,
        fontWeight: "600",
        textAlign: "right",
    },
    actions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: "#065F46",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    actionButtonText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
    secondaryButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        borderWidth: 1,
        borderColor: "#A7F3D0",
    },
    secondaryButtonText: {
        color: "#065F46",
        fontWeight: "800",
    },
    disabledButton: {
        opacity: 0.5,
    },
});