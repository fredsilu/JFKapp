//app/(traiteur)/documents/archives.tsx
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { ArchivedDocument } from "@/types/archives";
import { fetchArchivedDocuments } from "@/src/services/archivedDocument.service";
import ArchiveCard from "@/components/archives/ArchiveCard";


import ArchiveStats from "@/components/archives/ArchiveStats";
import ArchiveTable from "@/components/archives/ArchiveTable";

import ArchiveFilters, {
    ArchiveFilterType,
} from "@/components/archives/ArchiveFilters";



function extractSortKey(doc: ArchivedDocument) {
    const text = `${doc.number || ""} ${doc.fileName || ""}`;

    const yearMatch = text.match(/20\d{2}/);
    const year = yearMatch ? Number(yearMatch[0]) : 0;

    const allNumbers = text.match(/\d+/g) || [];
    const lastNumber = allNumbers.length > 0 ? Number(allNumbers[allNumbers.length - 1]) : 0;

    return {
        year,
        sequence: Number.isFinite(lastNumber) ? lastNumber : 0,
    };
}

function sortArchivedDocuments(a: ArchivedDocument, b: ArchivedDocument) {
    const ka = extractSortKey(a);
    const kb = extractSortKey(b);

    if (kb.year !== ka.year) return kb.year - ka.year;
    if (kb.sequence !== ka.sequence) return kb.sequence - ka.sequence;

    return (b.documentDate || b.invoiceDate || b.eventDate || "").localeCompare(
        a.documentDate || a.invoiceDate || a.eventDate || ""
    );
}

function buildStats(docs: ArchivedDocument[]) {
    const invoices = docs.filter((d) => d.type === "invoice");
    const proformas = docs.filter((d) => d.type === "proforma");

    const totalInvoices = invoices.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalProformas = proformas.reduce((sum, d) => sum + (d.amount || 0), 0);

    const clients = new Set(
        docs
            .map((d) => d.clientId || d.clientName || d.historicalClientName)
            .filter(Boolean)
    );

    const mapped = docs.filter((d) => d.clientMatchStatus === "mapped").length;
    const newHistorical = docs.filter(
        (d) => d.clientMatchStatus === "new_historical_client"
    ).length;
    const unmapped = docs.filter((d) => d.clientMatchStatus === "unmapped").length;

    return {
        total: docs.length,
        invoices: invoices.length,
        proformas: proformas.length,
        totalInvoices,
        totalProformas,
        clients: clients.size,
        mapped,
        newHistorical,
        unmapped,
    };
}

export default function ArchivedDocumentsScreen() {
    const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] =
        useState<ArchiveFilterType>("all");

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

        return documents
            .filter((doc) => {
                const matchesFilter =
                    filterType === "all" ||
                    doc.type === filterType ||
                    doc.clientMatchStatus === filterType;
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

                return matchesFilter && (!q || searchable.includes(q));
            })
            .sort(sortArchivedDocuments);
    }, [documents, filterType, search]);

    const stats = useMemo(() => buildStats(filteredDocuments), [filteredDocuments]);



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
            <View style={styles.topArea}>
                <Text style={styles.title}>Archives historiques</Text>

                <Text style={styles.subtitle}>
                    Anciennes factures et proformas importées avec PDF stocké.
                </Text>

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Rechercher client, numéro, désignation..."
                    style={styles.searchInput}
                />

                <ArchiveFilters
                    value={filterType}
                    onChange={setFilterType}
                />

                <ArchiveStats
                    total={stats.total}
                    invoices={stats.invoices}
                    proformas={stats.proformas}
                    clients={stats.clients}
                    totalInvoices={stats.totalInvoices}
                    totalProformas={stats.totalProformas}
                    mapped={stats.mapped}
                    newHistorical={stats.newHistorical}
                    unmapped={stats.unmapped}
                />

                <Text style={styles.count}>
                    {filteredDocuments.length} document(s)
                </Text>
            </View>

            <View style={styles.tableArea}>
                {Platform.OS === "web" ? (
                    <ArchiveTable documents={filteredDocuments} />
                ) : (
                    <ScrollView contentContainerStyle={styles.list}>
                        {filteredDocuments.map((doc) => (
                            <ArchiveCard
                                key={doc.id || doc.storagePath}
                                document={doc}
                            />
                        ))}

                        {filteredDocuments.length === 0 && (
                            <Text style={styles.emptyText}>
                                Aucune archive trouvée.
                            </Text>
                        )}
                    </ScrollView>
                )}

                {Platform.OS === "web" && filteredDocuments.length === 0 && (
                    <Text style={styles.emptyText}>Aucune archive trouvée.</Text>
                )}
            </View>
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

    count: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 8,
    },
    list: {
        gap: 10,
        paddingBottom: 24,
    },

    tableArea: {
        flex: 1,
        minHeight: 0,
    },

    emptyText: {
        textAlign: "center",
        color: "#6B7280",
        marginTop: 40,
    },
    topArea: {
  flexShrink: 0,
},


});