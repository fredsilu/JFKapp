// app/(traiteur)/invoices/credit-note/view/[id].tsx
import React, { useCallback, useState } from "react";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
} from "react-native";
import * as Linking from "expo-linking";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import {
    CreditNote,
    getCreditNoteById,
} from "@/src/services/creditNote.service";

import {
    getCateringInvoiceById,
} from "@/src/services/cateringInvoice.service";

import { CateringInvoice } from "@/types/catering";
import { formatCurrency } from "@/src/utils/costs";
import { generateInvoicePDF } from "@/src/services/invoicePdf.service";
import { buildCreditNotePdfData } from "@/src/services/creditNotePdf.service";
import { buildInvoiceHTML } from "@/src/utils/invoiceHtml";
import { downloadHtmlAsPdfWeb } from "@/src/utils/downloadHtmlAsPdfWeb";
import { formatShortDocumentDate } from "@/src/utils/dateFormat";



function getStatusLabel(status?: string) {
    switch (status) {
        case "draft":
            return "Brouillon";
        case "issued":
            return "Émis";
        case "cancelled":
            return "Annulé";
        default:
            return status || "—";
    }
}

function getTypeLabel(type?: string) {
    switch (type) {
        case "full":
            return "Avoir total";
        case "partial":
            return "Avoir partiel";
        default:
            return "Avoir";
    }
}

function getCreditNotePdfFileName(creditNote: CreditNote) {
    const number = creditNote.number || creditNote.id || "avoir";
    return `AVOIR_${number}.pdf`;
}

export default function CreditNoteViewScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [creditNote, setCreditNote] = useState<CreditNote | null>(null);
    const [invoice, setInvoice] = useState<CateringInvoice | null>(null);

    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);

    const loadCreditNote = useCallback(async () => {
        if (!id) {
            Alert.alert("Erreur", "Identifiant avoir introuvable");
            router.replace("/(traiteur)/invoices");
            return;
        }

        try {
            setLoading(true);

            const note = await getCreditNoteById(id);

            if (!note) {
                Alert.alert("Erreur", "Avoir introuvable");
                router.replace("/(traiteur)/invoices");
                return;
            }

            const linkedInvoice = await getCateringInvoiceById(note.invoiceId);

            if (!linkedInvoice) {
                Alert.alert("Erreur", "Facture liée introuvable");
                router.replace("/(traiteur)/invoices");
                return;
            }

            setCreditNote(note);
            setInvoice(linkedInvoice);
        } catch (error) {
            console.error("❌ load credit note view error:", error);
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

    async function getImageSource(moduleId: number): Promise<string> {
        const asset = Asset.fromModule(moduleId);

        await asset.downloadAsync();

        const uri = asset.localUri || asset.uri;

        if (Platform.OS === "web") {
            return uri;
        }

        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: "base64",
        });

        return `data:image/png;base64,${base64}`;
    }
    function openArchivedPdf() {
        if (!creditNote?.pdfUrl) {
            Alert.alert(
                "PDF indisponible",
                "Aucun PDF archivé n'est disponible pour cet avoir."
            );
            return;
        }

        Linking.openURL(creditNote.pdfUrl);
    }
    async function handleGeneratePDF() {
        if (!creditNote || !invoice) return;

        if (creditNote.status !== "issued") {
            Alert.alert(
                "Avoir non émis",
                "Seul un avoir émis peut être généré en PDF."
            );
            return;
        }

        const printWindow =
            Platform.OS === "web" && typeof window !== "undefined"
                ? window.open("", "_blank")
                : null;

        try {
            setPdfLoading(true);

            const logoBase64 = await getImageSource(
                require("@/assets/images/crepolia-logo.png")
            );

            let stampBase64 = "";
            let signatureBase64 = "";

            try {
                stampBase64 = await getImageSource(
                    require("@/assets/images/crepolia-stamp.png")
                );
            } catch { }

            try {
                signatureBase64 = await getImageSource(
                    require("@/assets/images/crepolia-signature.png")
                );
            } catch { }

            const pdfData: any = buildCreditNotePdfData(creditNote, invoice);

            pdfData.logoBase64 = logoBase64;
            pdfData.stampBase64 = stampBase64;
            pdfData.signatureBase64 = signatureBase64;

            const filename = getCreditNotePdfFileName(creditNote);

            if (Platform.OS === "web") {
                const html = buildInvoiceHTML(pdfData, {
                    logoBase64,
                    stampBase64,
                    signatureBase64,
                });

                downloadHtmlAsPdfWeb(html, filename, printWindow ?? undefined);
                return;
            }

            await generateInvoicePDF(pdfData, filename);
        } catch (error) {
            console.error("❌ credit note PDF error:", error);
            Alert.alert("Erreur", "Impossible de générer le PDF d’avoir");
        } finally {
            setPdfLoading(false);
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

    if (!creditNote || !invoice) {
        return (
            <View style={styles.center}>
                <Text>Avoir introuvable</Text>
            </View>
        );
    }

    const amount = Number(creditNote.amount ?? 0);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            <Text style={styles.title}>Détail avoir</Text>

            <View style={styles.headerCard}>
                <Text style={styles.number}>{creditNote.number}</Text>

                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {getStatusLabel(creditNote.status)}
                    </Text>
                </View>

                <Text style={styles.client}>
                    {invoice.client?.name || "Client non défini"}
                </Text>
            </View>

            <View style={styles.notice}>
                <Text style={styles.noticeTitle}>Pièce comptable</Text>
                <Text style={styles.noticeText}>
                    Cet avoir vient en déduction de la facture concernée. Il ne supprime
                    pas la facture initiale.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Informations avoir</Text>

                <Text style={styles.line}>Numéro : {creditNote.number}</Text>
                <Text style={styles.line}>
                    Statut : {getStatusLabel(creditNote.status)}
                </Text>
                <Text style={styles.line}>Type : {getTypeLabel(creditNote.type)}</Text>
                <Text style={styles.line}>
                    Date émission : {formatShortDocumentDate(creditNote.issuedAt)}
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Facture concernée</Text>

                <Text style={styles.line}>
                    Numéro facture : {creditNote.invoiceNumber || invoice.number || "—"}
                </Text>

                <Text style={styles.line}>
                    Client : {invoice.client?.name || "—"}
                </Text>

                <Text style={styles.line}>
                    Total facture : {formatCurrency(Number(invoice.totals?.total ?? 0))}
                </Text>
            </View>

            <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Montant de l’avoir</Text>
                <Text style={styles.amountValue}>
                    - {formatCurrency(amount)}
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Motif</Text>
                <Text style={styles.reason}>
                    {creditNote.reason || "—"}
                </Text>
            </View>
            {creditNote?.pdfUrl ? (
                <TouchableOpacity
                    style={styles.archivedPdfButton}
                    onPress={openArchivedPdf}
                >
                    <Text style={styles.archivedPdfButtonText}>
                        Voir PDF archivé
                    </Text>
                </TouchableOpacity>
            ) : null}
            <TouchableOpacity
                style={[
                    styles.pdfButton,
                    (pdfLoading || creditNote.status !== "issued") &&
                    styles.disabledButton,
                ]}
                onPress={handleGeneratePDF}
                disabled={pdfLoading || creditNote.status !== "issued"}
            >
                {pdfLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.pdfButtonText}>Générer PDF avoir</Text>
                )}
            </TouchableOpacity>

            {creditNote.status === "draft" && creditNote.id ? (
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                        router.replace({
                            pathname: "/(traiteur)/invoices/credit-note/edit/[id]",
                            params: { id: String(creditNote.id) },
                        })
                    }
                >
                    <Text style={styles.editButtonText}>Modifier le brouillon</Text>
                </TouchableOpacity>
            ) : null}

            <TouchableOpacity
                style={styles.backButton}
                onPress={() =>
                    router.replace({
                        pathname: "/(traiteur)/invoices/[id]",
                        params: { id: String(invoice.id || creditNote.invoiceId) },
                    })
                }
                disabled={pdfLoading}
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
        paddingBottom: 80,
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

    headerCard: {
        backgroundColor: "#92400E",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
    },

    number: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "900",
        marginBottom: 8,
    },

    client: {
        color: "#FEF3C7",
        fontSize: 15,
        marginTop: 8,
    },

    statusBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },

    statusText: {
        color: "#92400E",
        fontSize: 12,
        fontWeight: "800",
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
        elevation: 2,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 10,
    },

    line: {
        fontSize: 14,
        color: "#4B5563",
        marginBottom: 6,
    },

    amountCard: {
        backgroundColor: "#111827",
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
    },

    amountLabel: {
        color: "#D1D5DB",
        fontSize: 14,
        fontWeight: "700",
    },

    amountValue: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "900",
        marginTop: 4,
    },

    reason: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
    },

    pdfButton: {
        backgroundColor: "#286AA7",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 10,
    },

    pdfButtonText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 15,
    },

    editButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 10,
    },

    editButtonText: {
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
        marginBottom: 10,
    },

    backButtonText: {
        color: "#111827",
        fontWeight: "800",
        fontSize: 14,
    },
    archivedPdfButton: {
        backgroundColor: "#059669",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 10,
    },

    archivedPdfButtonText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 15,
    },
});