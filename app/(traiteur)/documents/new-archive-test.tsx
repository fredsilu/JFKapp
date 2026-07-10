import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";

import { createArchivedDocument } from "@/src/services/archivedDocument.service";
import { uploadOfficialPdf } from "@/src/services/documentStorage.service";

export default function NewArchiveTestScreen() {
    const [loading, setLoading] = useState(false);
    const [number, setNumber] = useState("TEST-ARCHIVE-002");
    const [clientName, setClientName] = useState("Client Test");
    const [amount, setAmount] = useState("100");

    async function handleCreateArchive() {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "application/pdf",
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];

            setLoading(true);

            const response = await fetch(file.uri);
            const blob = await response.blob();

            const uploaded = await uploadOfficialPdf({
                kind: "archived-proformas",
                documentNumber: number,
                pdfBlob: blob,
            });

            await createArchivedDocument({
                type: "proforma",
                number,
                clientName,
                historicalClientName: clientName,
                clientMatchStatus: "unmapped",
                designation: "Archive test avec vrai PDF",
                documentDate: new Date().toISOString().slice(0, 10),
                amount: Number(amount) || 0,
                currency: "USD",
                fileName: file.name || `${number}.pdf`,
                pdfUrl: uploaded.pdfUrl,
                storagePath: uploaded.pdfPath,
                source: "historical_import",
                importStatus: "complete",
            });

            Alert.alert("Succès", "Archive test créée.");
            //router.replace("/(traiteur)/documents/archives");
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de créer l’archive test.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Nouvelle archive test</Text>

            <Text style={styles.label}>Numéro</Text>
            <TextInput value={number} onChangeText={setNumber} style={styles.input} />

            <Text style={styles.label}>Client</Text>
            <TextInput
                value={clientName}
                onChangeText={setClientName}
                style={styles.input}
            />

            <Text style={styles.label}>Montant</Text>
            <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.input}
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCreateArchive}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? "Création..." : "Choisir PDF et créer archive"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
    },
    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
    },
    button: {
        backgroundColor: "#111827",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
});