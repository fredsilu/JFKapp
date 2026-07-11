import { StyleSheet } from "react-native";

export const documentListStyles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 0,
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },

    mobileContainer: {
        paddingTop: 10,
        paddingHorizontal: 12,
        paddingBottom: 6,
    },

    header: {
        justifyContent: "center",
    },

    breadcrumb: {
        fontSize: 11,
        color: "#64748B",
        marginBottom: 2,
    },

    title: {
        fontSize: 21,
        lineHeight: 25,
        fontWeight: "800",
        color: "#064E3B",
    },

    subtitle: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },

    desktopHeaderRow: {
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        marginBottom: 8,
    },

    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    totalBadge: {
        minWidth: 34,
        height: 24,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: "#DCFCE7",
        alignItems: "center",
        justifyContent: "center",
    },

    totalBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#166534",
    },

    desktopStatsGrid: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    compactStatCard: {
        minWidth: 150,
        height: 50,
        paddingHorizontal: 12,
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 9,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    compactStatLabel: {
        fontSize: 10,
        color: "#64748B",
        marginBottom: 1,
    },

    compactStatValue: {
        fontSize: 15,
        lineHeight: 18,
        fontWeight: "800",
        color: "#064E3B",
    },

    desktopControlsRow: {
        height: 42,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
    },

    desktopSearchBox: {
        width: 340,
        height: 38,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 9,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        gap: 7,
    },

    searchInput: {
        flex: 1,
        fontSize: 14,
        color: "#111827",
    },

    clearSearchButton: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
    },

    desktopFilterScroll: {
        flex: 1,
    },

    desktopFilterBar: {
        alignItems: "center",
        gap: 6,
        paddingRight: 4,
    },

    compactFilterChip: {
        height: 32,
        paddingHorizontal: 13,
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
    },

    compactFilterChipText: {
        fontSize: 11,
        lineHeight: 14,
        fontWeight: "700",
        color: "#374151",
    },

    filterChipActive: {
        backgroundColor: "#065F46",
        borderColor: "#065F46",
    },

    filterChipTextActive: {
        color: "#FFFFFF",
    },

    tableArea: {
        flex: 1,
        minHeight: 0,
    },

    horizontalTableScroll: {
        flex: 1,
        minHeight: 0,
    },

    horizontalTableContent: {
        flexGrow: 1,
    },

    table: {
        flex: 1,
        minHeight: 0,
        minWidth: 1570,
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#2F6B4F",
        height: 40,
        alignItems: "center",
    },

    tableRow: {
        flexDirection: "row",
        minHeight: 48,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    invoiceTableList: {
        flex: 1,
        minHeight: 0,
    },

    th: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },

    td: {
        color: "#111827",
        fontSize: 13,
        paddingHorizontal: 10,
    },

    sortableHeader: {
        height: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
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

    actionButtonDisabled: {
        backgroundColor: "#F3F4F6",
        opacity: 0.55,
    },

    actions: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 10,
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

    mobileHeaderCompact: {
        marginBottom: 8,
    },

    mobileBreadcrumb: {
        fontSize: 10,
        color: "#64748B",
        marginBottom: 2,
    },

    mobileTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },

    mobilePageTitle: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "800",
        color: "#064E3B",
    },

    mobileTotalBadge: {
        minWidth: 30,
        height: 22,
        paddingHorizontal: 7,
        borderRadius: 11,
        backgroundColor: "#DCFCE7",
        alignItems: "center",
        justifyContent: "center",
    },

    mobileTotalBadgeText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#166534",
    },

    mobileStatsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 7,
        marginBottom: 8,
    },

    mobileCompactStatCard: {
        flexGrow: 1,
        flexBasis: "47%",
        minWidth: 130,
        minHeight: 52,
        backgroundColor: "#FFFFFF",
        borderRadius: 9,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 10,
        paddingVertical: 7,
        justifyContent: "center",
    },

    mobileCompactStatLabel: {
        fontSize: 10,
        color: "#64748B",
        marginBottom: 1,
    },

    mobileCompactStatValue: {
        fontSize: 14,
        lineHeight: 17,
        fontWeight: "800",
        color: "#064E3B",
    },

    mobileSearchBox: {
        height: 38,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 9,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        gap: 7,
        marginBottom: 7,
    },

    mobileFilterScroll: {
        flexGrow: 0,
        marginBottom: 8,
    },

    mobileFilterBar: {
        gap: 6,
        alignItems: "center",
        paddingRight: 8,
    },

    mobileFilterChip: {
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 15,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
    },

    mobileFilterChipText: {
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "700",
        color: "#374151",
    },

    mobileFlatList: {
        flex: 1,
        minHeight: 0,
    },

    mobileList: {
        gap: 8,
        paddingBottom: 12,
    },

    mobileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 11,
        padding: 11,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    mobileCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },

    mobileDocumentNumber: {
        fontSize: 15,
        fontWeight: "800",
        color: "#064E3B",
    },

    mobileClient: {
        fontSize: 15,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 7,
    },

    mobileInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        paddingVertical: 3,
    },

    mobileLabel: {
        fontSize: 12,
        color: "#6B7280",
    },

    mobileValue: {
        flex: 1,
        textAlign: "right",
        fontSize: 12,
        color: "#111827",
        fontWeight: "500",
    },

    mobileAmount: {
        flex: 1,
        textAlign: "right",
        fontSize: 13,
        fontWeight: "800",
        color: "#064E3B",
    },

    mobileActions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
    },

    mobileButton: {
        flex: 1,
        height: 36,
        borderRadius: 8,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 5,
    },

    mobileButtonText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#065F46",
    },

    /*
   * Styles compatibles avec les fonctions renderStats()
   * et renderFilters() de Proformas et Avoirs.
   */

    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 8,
    },

    statCard: {
        flex: 1,
        minWidth: 140,
        maxWidth: "48%",
        minHeight: 50,
        backgroundColor: "#FFFFFF",
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        justifyContent: "center",
    },

    statLabel: {
        fontSize: 10,
        color: "#64748B",
        marginBottom: 1,
    },

    statValue: {
        fontSize: 15,
        lineHeight: 18,
        fontWeight: "800",
        color: "#064E3B",
    },

    searchBox: {
        height: 38,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 9,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        marginBottom: 8,
        gap: 7,
    },

    filterBarWrapper: {
        marginBottom: 8,
    },

    filterBar: {
        gap: 6,
        paddingVertical: 1,
        alignItems: "center",
    },

    filterChip: {
        height: 32,
        paddingHorizontal: 13,
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
    },

    filterChipText: {
        fontSize: 11,
        lineHeight: 14,
        fontWeight: "700",
        color: "#374151",
    },
});