import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { ArchivedDocument } from "@/types/archives";
import { fetchArchivedDocuments } from "@/src/services/archivedDocument.service";

type FilterType = "all" | "invoice" | "proforma";

function formatAmount(amount?: number, currency?: string) {
    if (amount === undefined || Number.isNaN(amount)) return "-";
    return `${amount.toLocaleString("fr-FR")} ${currency || "USD"}`;
}

function formatType(type: ArchivedDocument["type"]) {
    return type === "invoice" ? "Facture" : "Proforma";
}

export default function ArchivedDocumentsScreen() {
    const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<FilterType>("all");

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchArchivedDocuments();
            setDocuments(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadDocuments();
        }, [loadDocuments])
    );

    const filteredDocuments = useMemo(() => {
        const q = search.trim().toLowerCase();

        return documents.filter((doc) => {
            const matchesType = filterType === "all" || doc.type === filterType;

            const searchable = [
                doc.number,
                doc.clientName,
                doc.historicalClientName,
                doc.designation,
                doc.fileName,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return matchesType && (!q || searchable.includes(q));
        });
    }, [documents, filterType, search]);

    async function openPdf(url?: string) {
        if (!url) return;
        await Linking.openURL(url);
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Chargement des archives...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Archives historiques</Text>
            <Text style={styles.subtitle}>
                Anciennes factures et proformas importées avec PDF stocké.
            </Text>

            <TouchableOpacity
                style={styles.createButton}
                onPress={() =>
                    router.push("/(traiteur)/documents/new-archive-test" as never)
                }
            >
                <Text style={styles.createButtonText}>+ Archive test</Text>
            </TouchableOpacity>

            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher client, numéro, désignation..."
                style={styles.searchInput}
            />

            <View style={styles.filters}>
                <TouchableOpacity
                    style={[styles.filterButton, filterType === "all" && styles.filterActive]}
                    onPress={() => setFilterType("all")}
                >
                    <Text style={styles.filterText}>Tous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filterType === "invoice" && styles.filterActive,
                    ]}
                    onPress={() => setFilterType("invoice")}
                >
                    <Text style={styles.filterText}>Factures</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filterType === "proforma" && styles.filterActive,
                    ]}
                    onPress={() => setFilterType("proforma")}
                >
                    <Text style={styles.filterText}>Proformas</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.count}>{filteredDocuments.length} document(s)</Text>

            <ScrollView contentContainerStyle={styles.list}>
                {filteredDocuments.map((doc) => (
                    <View key={doc.id || doc.storagePath} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.type}>{formatType(doc.type)}</Text>
                                <Text style={styles.number}>{doc.number}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.pdfButton}
                                onPress={() => openPdf(doc.pdfUrl)}
                            >
                                <Text style={styles.pdfButtonText}>PDF</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.client}>{doc.clientName}</Text>

                        {!!doc.historicalClientName &&
                            doc.historicalClientName !== doc.clientName && (
                                <Text style={styles.historicalClient}>
                                    Nom historique : {doc.historicalClientName}
                                </Text>
                            )}

                        {!!doc.designation && (
                            <Text style={styles.designation}>{doc.designation}</Text>
                        )}

                        {doc.type === "proforma" && (
                            <>
                                <Text style={styles.meta}>
                                    Date proforma : {doc.documentDate || "-"}
                                </Text>
                                <Text style={styles.meta}>
                                    Date événement : {doc.eventDate || "-"}
                                </Text>
                                <Text style={styles.meta}>
                                    Num facture : {doc.linkedInvoiceNumber || "-"}
                                </Text>
                            </>
                        )}

                        {doc.type === "invoice" && (
                            <>
                                <Text style={styles.meta}>
                                    Date événement : {doc.eventDate || "-"}
                                </Text>
                                <Text style={styles.meta}>
                                    Date facture : {doc.invoiceDate || doc.documentDate || "-"}
                                </Text>
                                <Text style={styles.meta}>
                                    Date paiement : {doc.paymentDate || "-"}
                                </Text>
                            </>
                        )}

                        <View style={styles.metaRow}>
                            <Text style={styles.meta}>
                                Date : {doc.documentDate || doc.eventDate || "-"}
                            </Text>
                            <Text style={styles.meta}>
                                Montant : {formatAmount(doc.amount, doc.currency)}
                            </Text>
                        </View>
                    </View>
                ))}

                {filteredDocuments.length === 0 && (
                    <Text style={styles.emptyText}>Aucune archive trouvée.</Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        padding: 16,
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
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 4,
        marginBottom: 14,
    },
    searchInput: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 12,
    },
    filters: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 10,
    },
    filterButton: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    filterActive: {
        backgroundColor: "#E0F2FE",
        borderColor: "#38BDF8",
    },
    filterText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    count: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 8,
    },
    list: {
        gap: 10,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    type: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },
    number: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginTop: 2,
    },
    client: {
        marginTop: 10,
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },
    historicalClient: {
        marginTop: 3,
        fontSize: 12,
        color: "#6B7280",
    },
    designation: {
        marginTop: 8,
        fontSize: 13,
        color: "#374151",
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 10,
    },
    meta: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
    },
    pdfButton: {
        backgroundColor: "#111827",
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignSelf: "flex-start",
    },
    pdfButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 12,
    },
    emptyText: {
        textAlign: "center",
        color: "#6B7280",
        marginTop: 40,
    },
    createButton: {
        backgroundColor: "#111827",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignSelf: "flex-start",
        marginBottom: 12,
    },
    createButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
});