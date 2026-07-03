// app/(traiteur)/documents/invoices.tsx

import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useInvoices } from "@/src/hooks/useFirestore";

function formatAmount(value?: number) {
    if (!value) return "0,00 $";

    return `${value.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} $`;
}

function formatDate(value?: any) {
    if (!value) return "-";

    const date =
        typeof value?.toDate === "function"
            ? value.toDate()
            : new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("fr-FR");
}

function getInvoiceAmount(invoice: any) {
    return (
        invoice?.totals?.totalTTC ??
        invoice?.totals?.total ??
        invoice?.totalTTC ??
        invoice?.total ??
        0
    );
}



function getClientName(invoice: any) {
    return invoice?.client?.name ?? "-";
}

function getEventName(invoice: any) {
    return (
        invoice?.eventName ??
        invoice?.designation ??
        "-"
    );
}

function getDeliveryDate(invoice: any) {
    return invoice?.dateLivraison ?? null;
}

function getPeopleCount(invoice: any) {
    return invoice?.guestCount ?? "-";
}

function getDeliveryAddress(invoice: any) {
    return (
        invoice?.deliveryAddress ??
        invoice?.client?.city ??
        "-"
    );
}


function getStatusLabel(status?: string) {
    switch (status) {
        case "draft":
            return "Brouillon";
        case "issued":
            return "Émise";
        case "partial":
            return "Partiel";
        case "paid":
            return "Payée";
        case "replaced":
            return "Remplacée";
        case "cancelled":
            return "Annulée";
        default:
            return status || "-";
    }
}

function getStatusColors(status?: string) {
    switch (status) {
        case "draft":
            return {
                background: "#FEF3C7",
                text: "#92400E",
            };

        case "issued":
            return {
                background: "#DCFCE7",
                text: "#166534",
            };

        case "paid":
            return {
                background: "#DBEAFE",
                text: "#1D4ED8",
            };

        case "partial":
            return {
                background: "#F3E8FF",
                text: "#7E22CE",
            };

        case "cancelled":
            return {
                background: "#FEE2E2",
                text: "#B91C1C",
            };

        case "replaced":
            return {
                background: "#E5E7EB",
                text: "#374151",
            };

        default:
            return {
                background: "#F3F4F6",
                text: "#374151",
            };
    }
}

type InvoiceStatusFilter =
    | "all"
    | "draft"
    | "issued"
    | "paid"
    | "partial"
    | "cancelled"
    | "replaced";

const statusFilters: {
    label: string;
    value: InvoiceStatusFilter;
}[] = [
        { label: "Toutes", value: "all" },
        { label: "Brouillons", value: "draft" },
        { label: "Émises", value: "issued" },
        { label: "Payées", value: "paid" },
        { label: "Partielles", value: "partial" },
        { label: "Annulées", value: "cancelled" },
        { label: "Remplacées", value: "replaced" },
    ];

export default function DocumentInvoicesScreen() {
    const router = useRouter();
    const { data: invoices, loading, error } = useInvoices();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<InvoiceStatusFilter>("all");

    const { width } = useWindowDimensions();
    const isMobile = width < 768;



    const filteredInvoices = useMemo(() => {
        const query = search.trim().toLowerCase();

        return [...(invoices || [])]
            .sort((a: any, b: any) => {
                const dateA =
                    a?.createdAt?.toDate?.() ??
                    a?.issuedAt?.toDate?.() ??
                    new Date(a?.createdAt || a?.issuedAt || 0);

                const dateB =
                    b?.createdAt?.toDate?.() ??
                    b?.issuedAt?.toDate?.() ??
                    new Date(b?.createdAt || b?.issuedAt || 0);

                return dateB.getTime() - dateA.getTime();
            })
            .filter((invoice: any) => {
                const matchesStatus =
                    statusFilter === "all" || invoice?.status === statusFilter;

                if (!matchesStatus) return false;

                if (!query) return true;

                const target = [
                    invoice?.number,
                    getClientName(invoice),
                    getEventName(invoice),
                    getDeliveryAddress(invoice),
                    invoice?.status,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return target.includes(query);
            });
    }, [invoices, search, statusFilter]);

    const invoiceStats = useMemo(() => {
        const totalInvoices = filteredInvoices.length;

        const totalAmount = filteredInvoices.reduce(
            (sum: number, invoice: any) => sum + getInvoiceAmount(invoice),
            0
        );

        const paidAmount = filteredInvoices
            .filter((invoice: any) => invoice?.status === "paid")
            .reduce((sum: number, invoice: any) => sum + getInvoiceAmount(invoice), 0);

        const pendingAmount = filteredInvoices
            .filter((invoice: any) =>
                ["issued", "partial", "draft"].includes(invoice?.status)
            )
            .reduce((sum: number, invoice: any) => sum + getInvoiceAmount(invoice), 0);

        return {
            totalInvoices,
            totalAmount,
            paidAmount,
            pendingAmount,
        };
    }, [filteredInvoices]);

    function openInvoice(invoiceId: string) {
        router.push(`/(traiteur)/invoices/${invoiceId}` as never);
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Chargement des factures...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Erreur de chargement des factures.</Text>
            </View>
        );
    }

    if (isMobile) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.breadcrumb}>Documents / Archives</Text>
                    <Text style={styles.title}>Factures</Text>
                    <Text style={styles.subtitle}>
                        Consultez toutes les factures émises.
                    </Text>
                </View>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total factures</Text>
                        <Text style={styles.statValue}>
                            {invoiceStats.totalInvoices}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Montant total</Text>
                        <Text style={styles.statValue}>
                            {formatAmount(invoiceStats.totalAmount)}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Payées</Text>
                        <Text style={styles.statValue}>
                            {formatAmount(invoiceStats.paidAmount)}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>En attente</Text>
                        <Text style={styles.statValue}>
                            {formatAmount(invoiceStats.pendingAmount)}
                        </Text>
                    </View>
                </View>

                <View style={styles.searchBox}>
                    <MaterialIcons name="search" size={20} color="#6B7280" />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Rechercher facture, client..."
                        style={styles.searchInput}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                <View style={styles.filterBarWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterBar}
                    >
                        {statusFilters.map((filter) => {
                            const active = statusFilter === filter.value;

                            return (
                                <TouchableOpacity
                                    key={filter.value}
                                    style={[
                                        styles.filterChip,
                                        active && styles.filterChipActive,
                                    ]}
                                    onPress={() => setStatusFilter(filter.value)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            active && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>


                <FlatList
                    data={filteredInvoices}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.mobileList}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Aucune facture trouvée.</Text>
                    }
                    renderItem={({ item }: any) => (
                        <View style={styles.mobileCard}>
                            <View style={styles.mobileCardHeader}>
                                <Text style={styles.mobileInvoiceNumber}>
                                    {item?.number || "-"}
                                </Text>
                                <View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor: getStatusColors(item?.status).background,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusBadgeText,
                                                {
                                                    color: getStatusColors(item?.status).text,
                                                },
                                            ]}
                                        >
                                            {getStatusLabel(item?.status)}
                                        </Text>
                                    </View>
                                </View>

                            </View>

                            <Text style={styles.mobileClient}>
                                {getClientName(item)}
                            </Text>

                            <View style={styles.mobileInfoRow}>
                                <Text style={styles.mobileLabel}>Événement</Text>
                                <Text style={styles.mobileValue}>{getEventName(item)}</Text>
                            </View>

                            <View style={styles.mobileInfoRow}>
                                <Text style={styles.mobileLabel}>Date livraison</Text>
                                <Text style={styles.mobileValue}>
                                    {formatDate(getDeliveryDate(item))}
                                </Text>
                            </View>
                            <View style={styles.mobileInfoRow}>
                                <Text style={styles.mobileLabel}>
                                    Date facture
                                </Text>

                                <Text style={styles.mobileValue}>
                                    {formatDate(item?.issuedAt)}
                                </Text>
                            </View>
                            <View style={styles.mobileInfoRow}>
                                <Text style={styles.mobileLabel}>Date création</Text>
                                <Text style={styles.mobileValue}>
                                    {formatDate(item?.createdAt)}
                                </Text>
                            </View>

                            <View style={styles.mobileInfoRow}>
                                <Text style={styles.mobileLabel}>Adresse</Text>
                                <Text style={styles.mobileValue}>
                                    {getDeliveryAddress(item)}
                                </Text>
                            </View>

                            <View style={styles.mobileInfoRow}>
                                <Text style={styles.mobileLabel}>Nombre</Text>
                                <Text style={styles.mobileValue}>
                                    {getPeopleCount(item)}
                                </Text>
                            </View>

                            <View style={styles.mobileInfoRow}>
                                <Text style={styles.mobileLabel}>Montant</Text>
                                <Text style={styles.mobileAmount}>
                                    {formatAmount(getInvoiceAmount(item))}
                                </Text>
                            </View>

                            <View style={styles.mobileActions}>
                                <TouchableOpacity
                                    style={styles.mobileButton}
                                    onPress={() => openInvoice(item.id)}
                                >
                                    <MaterialIcons name="visibility" size={18} color="#065F46" />
                                    <Text style={styles.mobileButtonText}>Voir</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.mobileButton}
                                    onPress={() =>
                                        console.log("PDF invoice", item.id)
                                    }
                                >
                                    <MaterialIcons
                                        name="picture-as-pdf"
                                        size={18}
                                        color="#065F46"
                                    />
                                    <Text style={styles.mobileButtonText}>PDF</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.breadcrumb}>Documents / Archives</Text>
                <Text style={styles.title}>Factures</Text>
                <Text style={styles.subtitle}>
                    Consultez toutes les factures émises et leurs informations principales.
                </Text>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total factures</Text>
                    <Text style={styles.statValue}>{invoiceStats.totalInvoices}</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Montant total</Text>
                    <Text style={styles.statValue}>
                        {formatAmount(invoiceStats.totalAmount)}
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Payées</Text>
                    <Text style={styles.statValue}>
                        {formatAmount(invoiceStats.paidAmount)}
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>En attente</Text>
                    <Text style={styles.statValue}>
                        {formatAmount(invoiceStats.pendingAmount)}
                    </Text>
                </View>
            </View>

            <View style={styles.searchBox}>
                <MaterialIcons name="search" size={20} color="#6B7280" />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Rechercher par facture, client, désignation..."
                    style={styles.searchInput}
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            <View style={styles.filterBarWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterBar}
                >
                    {statusFilters.map((filter) => {
                        const active = statusFilter === filter.value;

                        return (
                            <TouchableOpacity
                                key={filter.value}
                                style={[
                                    styles.filterChip,
                                    active && styles.filterChipActive,
                                ]}
                                onPress={() => setStatusFilter(filter.value)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        active && styles.filterChipTextActive,
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, styles.colInvoice]}>N° Facture</Text>
                        <Text style={[styles.th, styles.colClient]}>Client</Text>
                        <Text style={[styles.th, styles.colEvent]}>Événement</Text>
                        <Text style={[styles.th, styles.colDate]}>Date livraison</Text>
                        <Text style={[styles.th, styles.colAddress]}>Adresse</Text>
                        <Text style={[styles.th, styles.colPeople]}>#</Text>
                        <Text style={[styles.th, styles.colAmount]}>Montant</Text>
                        <Text style={[styles.th, styles.colDate]}>Date facture</Text>
                        <Text style={[styles.th, styles.colDate]}>Date création</Text>
                        <Text style={[styles.th, styles.colStatus]}>Statut</Text>
                        <Text style={[styles.th, styles.colActions]}>Actions</Text>
                    </View>

                    <FlatList
                        data={filteredInvoices}
                        style={{
                            flex: 1,
                            minHeight: 0,
                        }}
                        keyExtractor={(item: any) => item.id}
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyText}>Aucune facture trouvée.</Text>
                            </View>
                        }
                        renderItem={({ item }: any) => (
                            <View style={styles.tableRow}>
                                <Text style={[styles.td, styles.colInvoice]}>
                                    {item?.number || "-"}
                                </Text>

                                <Text style={[styles.td, styles.colClient]}>
                                    {getClientName(item)}
                                </Text>

                                <Text style={[styles.td, styles.colEvent]}>
                                    {getEventName(item)}
                                </Text>

                                <Text style={[styles.td, styles.colDate]}>
                                    {formatDate(getDeliveryDate(item))}
                                </Text>

                                <Text style={[styles.td, styles.colAddress]}>
                                    {getDeliveryAddress(item)}
                                </Text>

                                <Text style={[styles.td, styles.colPeople]}>
                                    {getPeopleCount(item)}
                                </Text>

                                <Text style={[styles.td, styles.colAmount]}>
                                    {formatAmount(getInvoiceAmount(item))}
                                </Text>

                                <Text style={[styles.td, styles.colDate]}>
                                    {formatDate(item?.issuedAt)}
                                </Text>

                                <Text style={[styles.td, styles.colDate]}>
                                    {formatDate(item?.createdAt)}
                                </Text>

                                <View style={[styles.colStatus]}>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor: getStatusColors(item?.status).background,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusBadgeText,
                                                {
                                                    color: getStatusColors(item?.status).text,
                                                },
                                            ]}
                                        >
                                            {getStatusLabel(item?.status)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.actions, styles.colActions]}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => openInvoice(item.id)}
                                    >
                                        <MaterialIcons
                                            name="visibility"
                                            size={18}
                                            color="#065F46"
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionButton}
                                        onPress={() =>
                                            console.log("PDF invoice", item.id)
                                        }>
                                        <MaterialIcons
                                            name="picture-as-pdf"
                                            size={18}
                                            color="#065F46"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 16,
        paddingTop: 44,
        paddingBottom: 16,
    },
    header: {
        marginBottom: 16,
    },
    breadcrumb: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#064E3B",
    },

    subtitle: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 3,
    },
    searchBox: {
        height: 46,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        marginBottom: 16,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: "#111827",
    },
    table: {
        minWidth: 1490,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E5E7EB",

        height: 700,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#2F6B4F",
        minHeight: 44,
        alignItems: "center",
    },
    tableRow: {
        flexDirection: "row",
        minHeight: 54,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    th: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
        paddingHorizontal: 10,
    },
    td: {
        color: "#111827",
        fontSize: 13,
        paddingHorizontal: 10,
    },
    colInvoice: {
        width: 130,
    },
    colClient: {
        width: 160,
    },
    colDate: {
        width: 130,
    },

    colPeople: {
        width: 70,
        textAlign: "center",
    },
    colAmount: {
        width: 140,
        textAlign: "right",
    },
    colStatus: {
        width: 110,
        justifyContent: "center",
    },
    colActions: {
        width: 110,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 10,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyBox: {
        padding: 24,
    },
    emptyText: {
        color: "#6B7280",
        fontSize: 14,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
    },
    loadingText: {
        marginTop: 8,
        color: "#6B7280",
    },
    errorText: {
        color: "#DC2626",
        fontWeight: "600",
    },
    mobileList: {
        gap: 12,
        paddingBottom: 24,
    },

    mobileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    mobileCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },

    mobileInvoiceNumber: {
        fontSize: 18,
        fontWeight: "800",
        color: "#064E3B",
    },

    mobileClient: {
        fontSize: 17,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 14,
    },

    mobileLabel: {
        fontSize: 14,
        color: "#6B7280",
    },

    mobileValue: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "500",
    },

    mobileAmount: {
        fontSize: 15,
        fontWeight: "800",
        color: "#064E3B",
    },



    mobileStatus: {
        fontSize: 12,
        fontWeight: "700",
        color: "#065F46",
        backgroundColor: "#ECFDF5",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },



    mobileInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 5,
    },



    mobileActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12,
    },

    mobileButton: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
    },

    mobileButtonText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#065F46",
    },
    statsGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
        flexWrap: "wrap",
    },

    statCard: {
        flex: 1,
        minWidth: 140,
        maxWidth: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    statLabel: {
        fontSize: 13,
        color: "#6B7280",
    },

    statValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#064E3B",
    },

    colEvent: {
        width: 220,
    },

    colAddress: {
        width: 180,
    },
    filterBarWrapper: {
        marginBottom: 14,
    },

    filterBar: {
        gap: 8,
        paddingVertical: 2,
    },

    filterChip: {
        minHeight: 36,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
    },

    filterChipActive: {
        backgroundColor: "#065F46",
        borderColor: "#065F46",
    },

    filterChipText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#374151",
        lineHeight: 16,
    },

    filterChipTextActive: {
        color: "#FFFFFF",
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: "flex-start",
    },

    statusBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    resultCount: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 12,
    },
});