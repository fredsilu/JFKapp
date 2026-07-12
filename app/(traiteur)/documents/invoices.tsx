// app/(traiteur)/documents/invoices.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Linking,
    useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import MobileListHeader from "@/src/components/mobile/MobileListHeader";
import MobileStatsBar from "@/src/components/mobile/MobileStatsBar";
import MobileSearchBar from "@/src/components/mobile/MobileSearchBar";
import MobileFilterBar from "@/src/components/mobile/MobileFilterBar";

import { documentListStyles as styles } from "@/src/styles/documentList.styles";

import { useInvoices } from "@/src/hooks/useFirestore";
import { fetchArchivedInvoices, normalizeArchivedInvoice } from "@/src/services/archivedDocument.service";
import DocumentPageHeader from "@/src/components/DocumentPageHeader";



function formatAmount(value?: number) {
    if (!value) return "0,00 $";

    return `${value.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} $`;
}
async function openPdf(item: any) {
    if (!item?.pdfUrl) {
        console.log("PDF indisponible", item?.id);
        return;
    }

    console.log("Ouverture PDF :", item.pdfUrl);

    if (typeof window !== "undefined") {
        window.open(item.pdfUrl, "_blank");
        return;
    }

    await Linking.openURL(item.pdfUrl);
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
    return (
        invoice?.client?.name ??
        invoice?.clientName ??
        invoice?.historicalClientName ??
        "-"
    );
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
function hasPdf(item: any) {
    return Boolean(item?.pdfUrl);
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
        case "historical":
            return "Archive";
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
        case "historical":
            return {
                background: "#E5E7EB",
                text: "#374151",
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

type SortField =
    | "number"
    | "client"
    | "amount"
    | "invoiceDate"
    | "createdAt";

type SortDirection = "asc" | "desc";

type InvoiceStatusFilter =
    | "all"
    | "draft"
    | "issued"
    | "paid"
    | "partial"
    | "cancelled"
    | "replaced"
    | "historical";

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
        { label: "Archives", value: "historical" },
    ];

function getDateTimestamp(value?: any): number {
    if (!value) return 0;

    if (typeof value?.toDate === "function") {
        return value.toDate().getTime();
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export default function DocumentInvoicesScreen() {
    const router = useRouter();
    const { data: appInvoices, loading, error } = useInvoices();
    const [archivedInvoices, setArchivedInvoices] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<InvoiceStatusFilter>("all");

    const { width } = useWindowDimensions();
    const isMobile = width < 768;


    const invoices = useMemo(() => {
        const normalizedArchives =
            archivedInvoices.map(normalizeArchivedInvoice);

        return [...(appInvoices || []), ...normalizedArchives];
    }, [appInvoices, archivedInvoices]);



    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDirection, setSortDirection] =
        useState<SortDirection>("desc");

    const filteredInvoices = useMemo(() => {
        const query = search.trim().toLowerCase();

        return [...(invoices || [])]
            .sort((a: any, b: any) => {
                let valueA: any;
                let valueB: any;

                switch (sortField) {
                    case "number":
                        valueA = a?.number || "";
                        valueB = b?.number || "";
                        break;

                    case "client":
                        valueA = getClientName(a);
                        valueB = getClientName(b);
                        break;

                    case "amount":
                        valueA = getInvoiceAmount(a);
                        valueB = getInvoiceAmount(b);
                        break;

                    case "invoiceDate":
                        valueA = getDateTimestamp(
                            a?.issuedAt ??
                            a?.invoiceDate ??
                            a?.documentDate
                        );

                        valueB = getDateTimestamp(
                            b?.issuedAt ??
                            b?.invoiceDate ??
                            b?.documentDate
                        );
                        break;

                    case "createdAt":
                    default:
                        valueA = getDateTimestamp(a?.createdAt);
                        valueB = getDateTimestamp(b?.createdAt);
                        break;
                }

                if (typeof valueA === "string") {
                    const result = valueA.localeCompare(valueB, "fr", {
                        numeric: true,
                    });

                    return sortDirection === "asc" ? result : -result;
                }

                return sortDirection === "asc"
                    ? valueA - valueB
                    : valueB - valueA;
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
    }, [invoices, search, statusFilter, sortField, sortDirection]);

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

    function renderSortableHeader(
        label: string,
        field: SortField,
        columnStyle: any
    ) {
        const active = sortField === field;

        return (
            <TouchableOpacity
                style={[styles.sortableHeader, columnStyle]}
                onPress={() => toggleSort(field)}
                activeOpacity={0.8}
            >
                <Text style={styles.th}>{label}</Text>

                <MaterialIcons
                    name={
                        active
                            ? sortDirection === "asc"
                                ? "arrow-upward"
                                : "arrow-downward"
                            : "unfold-more"
                    }
                    size={15}
                    color={active ? "#FFFFFF" : "#D1FAE5"}
                />
            </TouchableOpacity>
        );
    }

    function toggleSort(field: SortField) {
        if (sortField === field) {
            setSortDirection((current) =>
                current === "asc" ? "desc" : "asc"
            );
            return;
        }

        setSortField(field);
        setSortDirection("asc");
    }

    function openInvoice(invoice: any) {
        if (invoice?.isHistorical) {
            router.push(`/(traiteur)/documents/history/${invoice.id}` as never);
            return;
        }

        router.push(`/(traiteur)/invoices/${invoice.id}` as never);
    }

    useEffect(() => {
        fetchArchivedInvoices().then(setArchivedInvoices);
    }, []);



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
            <View style={[styles.container, styles.mobileContainer]}>
        <View style={localStyles.mobileControls}>
                <MobileListHeader
                    title="Factures"
                    total={invoiceStats.totalInvoices}
                    onBack={() => router.replace("/(traiteur)/documents" as never)}
                />

                <MobileStatsBar
                    items={[
                        { label: "Montant total", value: formatAmount(invoiceStats.totalAmount), wide: true },
                        { label: "Payées", value: formatAmount(invoiceStats.paidAmount), wide: true },
                        { label: "En attente", value: formatAmount(invoiceStats.pendingAmount), wide: true },
                    ]}
                />

                <MobileSearchBar
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Rechercher une facture..."
                />

                <MobileFilterBar
                    items={statusFilters}
                    value={statusFilter}
                    onChange={setStatusFilter}
                />


                </View>

        <FlatList
                    style={[localStyles.mobileListFlex, styles.mobileFlatList]}
                    data={filteredInvoices}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.mobileList}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Aucune facture trouvée.</Text>
                    }
                    renderItem={({ item }: any) => (
                        <View style={styles.mobileCard}>
                            <View style={styles.mobileCardHeader}>
                                <Text style={styles.mobileDocumentNumber}>
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
                                    {formatDate(
                                        item?.issuedAt ??
                                        item?.invoiceDate ??
                                        item?.documentDate
                                    )}
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
                                    onPress={() => openInvoice(item)}
                                >
                                    <MaterialIcons name="visibility" size={18} color="#065F46" />
                                    <Text style={styles.mobileButtonText}>Voir</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.mobileButton,
                                        !hasPdf(item) && styles.actionButtonDisabled,
                                    ]}
                                    onPress={() => openPdf(item)}
                                    disabled={!hasPdf(item)}
                                >
                                    <MaterialIcons
                                        name="picture-as-pdf"
                                        size={18}
                                        color={hasPdf(item) ? "#065F46" : "#9CA3AF"}
                                    />
                                    <Text style={styles.mobileButtonText}>PDF</Text>
                                </TouchableOpacity>
                            </View>
                            {item?.isHistorical && !hasPdf(item) && (
                                <View style={localStyles.mobileNoPdfRow}>
                                    <View style={localStyles.noPdfBadge}>
                                        <Text style={localStyles.noPdfBadgeText}>
                                            Sans PDF
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                />
            </View>



        );
    }

    return (
        <View style={styles.container}>
            {/* En-tête compact */}
            <DocumentPageHeader
                title="Factures"
                subtitle="Consultez toutes les factures émises et leurs informations principales."
                stats={[
                    {
                        label: "Total factures",
                        value: invoiceStats.totalInvoices,
                    },
                    {
                        label: "Montant total",
                        value: formatAmount(invoiceStats.totalAmount),
                    },
                    {
                        label: "Payées",
                        value: formatAmount(invoiceStats.paidAmount),
                    },
                    {
                        label: "En attente",
                        value: formatAmount(invoiceStats.pendingAmount),
                    },
                ]}
            />

            {/* Recherche et filtres sur la même ligne */}
            <View style={styles.desktopControlsRow}>
                <View style={styles.desktopSearchBox}>
                    <MaterialIcons name="search" size={19} color="#6B7280" />

                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Rechercher par facture, client, désignation..."
                        style={styles.searchInput}
                        placeholderTextColor="#9CA3AF"
                    />

                    {search.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearch("")}
                            style={styles.clearSearchButton}
                        >
                            <MaterialIcons name="close" size={18} color="#64748B" />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.desktopFilterScroll}
                    contentContainerStyle={styles.desktopFilterBar}
                >
                    {statusFilters.map((filter) => {
                        const active = statusFilter === filter.value;

                        return (
                            <TouchableOpacity
                                key={filter.value}
                                style={[
                                    styles.compactFilterChip,
                                    active && styles.filterChipActive,
                                ]}
                                onPress={() => setStatusFilter(filter.value)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.compactFilterChipText,
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

            {/* Tableau occupant tout l’espace disponible */}
            <View style={styles.tableArea}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator
                    style={styles.horizontalTableScroll}
                    contentContainerStyle={styles.horizontalTableContent}
                >
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            {renderSortableHeader(
                                "N° Facture",
                                "number",
                                localStyles.colInvoice
                            )}

                            {renderSortableHeader(
                                "Client",
                                "client",
                                localStyles.colClient
                            )}

                            <Text style={[styles.th, localStyles.colEvent]}>
                                Événement
                            </Text>

                            <Text style={[styles.th, localStyles.colDate]}>
                                Date livraison
                            </Text>

                            <Text style={[styles.th, localStyles.colAddress]}>
                                Adresse
                            </Text>

                            <Text style={[styles.th, localStyles.colPeople]}>
                                #
                            </Text>

                            {renderSortableHeader(
                                "Montant",
                                "amount",
                                localStyles.colAmount
                            )}

                            {renderSortableHeader(
                                "Date facture",
                                "invoiceDate",
                                localStyles.colDate
                            )}

                            {renderSortableHeader(
                                "Date création",
                                "createdAt",
                                localStyles.colDate
                            )}

                            <Text style={[styles.th, localStyles.colStatus]}>
                                Statut
                            </Text>

                            <Text style={[styles.th, localStyles.colActions]}>
                                Actions
                            </Text>
                        </View>

                        <FlatList
                            data={filteredInvoices}
                            style={styles.invoiceTableList}
                            keyExtractor={(item: any) => item.id}
                            showsVerticalScrollIndicator
                            ListEmptyComponent={
                                <View style={styles.emptyBox}>
                                    <Text style={styles.emptyText}>
                                        Aucune facture trouvée.
                                    </Text>
                                </View>
                            }
                            renderItem={({ item }: any) => (
                                <View style={styles.tableRow}>
                                    <View style={localStyles.invoiceNumberCell}>
                                        <Text
                                            style={localStyles.invoiceNumberText}
                                            numberOfLines={2}
                                        >
                                            {item?.number || "-"}
                                        </Text>

                                        {item?.isHistorical && !hasPdf(item) && (
                                            <View style={localStyles.noPdfBadge}>
                                                <Text style={localStyles.noPdfBadgeText}>
                                                    Sans PDF
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text
                                        style={[styles.td, localStyles.colClient]}
                                        numberOfLines={2}
                                    >
                                        {getClientName(item)}
                                    </Text>

                                    <Text
                                        style={[styles.td, localStyles.colEvent]}
                                        numberOfLines={2}
                                    >
                                        {getEventName(item)}
                                    </Text>

                                    <Text style={[styles.td, localStyles.colDate]}>
                                        {formatDate(getDeliveryDate(item))}
                                    </Text>

                                    <Text
                                        style={[styles.td, localStyles.colAddress]}
                                        numberOfLines={2}
                                    >
                                        {getDeliveryAddress(item)}
                                    </Text>

                                    <Text style={[styles.td, localStyles.colPeople]}>
                                        {getPeopleCount(item)}
                                    </Text>

                                    <Text style={[styles.td, localStyles.colAmount]}>
                                        {formatAmount(getInvoiceAmount(item))}
                                    </Text>

                                    <Text style={[styles.td, localStyles.colDate]}>
                                        {formatDate(
                                            item?.issuedAt ??
                                            item?.invoiceDate ??
                                            item?.documentDate
                                        )}
                                    </Text>

                                    <Text style={[styles.td, localStyles.colDate]}>
                                        {formatDate(item?.createdAt)}
                                    </Text>

                                    <View style={localStyles.colStatus}>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor:
                                                        getStatusColors(item?.status).background,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusBadgeText,
                                                    {
                                                        color:
                                                            getStatusColors(item?.status).text,
                                                    },
                                                ]}
                                            >
                                                {getStatusLabel(item?.status)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.actions, localStyles.colActions]}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => openInvoice(item)}
                                        >
                                            <MaterialIcons
                                                name="visibility"
                                                size={18}
                                                color="#065F46"
                                            />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.actionButton,
                                                !hasPdf(item) &&
                                                styles.actionButtonDisabled,
                                            ]}
                                            onPress={() => openPdf(item)}
                                            disabled={!hasPdf(item)}
                                        >
                                            <MaterialIcons
                                                name="picture-as-pdf"
                                                size={18}
                                                color={
                                                    hasPdf(item) ? "#065F46" : "#9CA3AF"
                                                }
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
  mobileControls: {
    paddingTop: 2,
    paddingBottom: 6,
    backgroundColor: "#F4F6F8",
  },
  mobileListFlex: {
    flex: 1,
  },

    colInvoice: {
        width: 210,
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

    colEvent: {
        width: 220,
    },

    colAddress: {
        width: 180,
    },

    invoiceNumberCell: {
        width: 210,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    invoiceNumberText: {
        flex: 1,
        fontSize: 13,
        color: "#111827",
    },

    noPdfBadge: {
        backgroundColor: "#FEF3C7",
        borderRadius: 999,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },

    noPdfBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#92400E",
    },

    mobileNoPdfRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 8,
    },
});