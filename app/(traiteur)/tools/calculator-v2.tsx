// app/tools/calculator-v2.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
} from "react-native";
import { router } from "expo-router";

import { CateringSection } from "@/types/catering";
import { createCateringSimulation } from "@/src/services/cateringSimulation.service";
import { getCateringSectionTemplates } from "@/src/services/cateringSectionTemplate.service";
import {
    createEmptySectionsFromTemplates,
    getSectionsTotals,
} from "@/src/utils/cateringSections";

export default function CalculatorV2Screen() {
    const [eventName, setEventName] = useState("");
    const [clientName, setClientName] = useState("");
    const [numberOfPeople, setNumberOfPeople] = useState("0");
    const [sections, setSections] = useState<CateringSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        try {
            setLoading(true);

            const templates = await getCateringSectionTemplates();
            const emptySections = createEmptySectionsFromTemplates(templates);

            setSections(emptySections);
        } catch (error) {
            console.error("Erreur chargement rubriques:", error);
            Alert.alert("Erreur", "Impossible de charger les rubriques.");
        } finally {
            setLoading(false);
        }
    }

    const totals = useMemo(() => {
        return getSectionsTotals(sections);
    }, [sections]);

    function updateSectionField(
        sectionId: string,
        field: keyof CateringSection,
        value: any
    ) {
        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId
                    ? {
                        ...section,
                        [field]: value,
                    }
                    : section
            )
        );
    }

    async function handleSaveSimulation() {
        if (!eventName.trim()) {
            Alert.alert("Champ requis", "Veuillez saisir le nom de l’événement.");
            return;
        }

        try {
            setSaving(true);

            const simulationId = await createCateringSimulation({
                name: eventName.trim(),
                eventName: eventName.trim(),

                clientId: "",
                clientName: clientName.trim(),

                numberOfPeople: Number(numberOfPeople) || 0,
                guestCount: Number(numberOfPeople) || 0,

                sections: totals.sections,

                globalTurnover: totals.subtotal,
                globalCost: totals.totalCost,
                globalMargin: totals.margin,

                discount: 0,
                dateLivraison: "",

                breakfast: {
                    enabled: false,
                    numberOfPeople: 0,
                    unitPrice: 0,
                    numberOfDays: 1,
                    foodCostRate: 0,
                },
                lunch: {
                    enabled: false,
                    numberOfPeople: 0,
                    unitPrice: 0,
                    numberOfDays: 1,
                    foodCostRate: 0,
                },
                drinks: {
                    enabled: false,
                    numberOfPeople: 0,
                    unitPrice: 0,
                    numberOfDays: 1,
                    foodCostRate: 0,
                },
                service: {
                    enabled: false,
                    numberOfPeople: 0,
                    numberOfDays: 1,
                    serverRate: 0,
                    cookRate: 0,
                },
                serviceCosts: {
                    serverDailyCost: 0,
                    cookDailyCost: 0,
                    electricityDailyCost: 0,
                    gasDailyCost: 0,
                    fuelDailyCost: 0,
                },

                status: "draft",
                isDeleted: false,
                convertedToOrder: false,
            } as any);

            Alert.alert("Succès", "Simulation enregistrée.");

            router.push({
                pathname: "/simulations/[id]",
                params: { id: simulationId },
            });
        } catch (error) {
            console.error("Erreur sauvegarde simulation:", error);
            Alert.alert("Erreur", "Impossible d’enregistrer la simulation.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
                <Text>Chargement des rubriques...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
                Nouvelle simulation V2
            </Text>

            <Text>Nom de l’événement</Text>
            <TextInput
                value={eventName}
                onChangeText={setEventName}
                placeholder="Ex: Cocktail entreprise"
                style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    marginBottom: 12,
                    borderRadius: 8,
                }}
            />

            <Text>Client</Text>
            <TextInput
                value={clientName}
                onChangeText={setClientName}
                placeholder="Nom du client"
                style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    marginBottom: 12,
                    borderRadius: 8,
                }}
            />

            <Text>Nombre de personnes</Text>
            <TextInput
                value={numberOfPeople}
                onChangeText={setNumberOfPeople}
                keyboardType="numeric"
                placeholder="0"
                style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    marginBottom: 20,
                    borderRadius: 8,
                }}
            />

            {sections.map((section) => (
                <View
                    key={section.id}
                    style={{
                        padding: 14,
                        borderWidth: 1,
                        borderColor: "#ddd",
                        borderRadius: 10,
                        marginBottom: 12,
                        backgroundColor: "#fff",
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>
                        {section.name}
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            updateSectionField(section.id, "enabled", !section.enabled)
                        }
                        style={{
                            marginTop: 10,
                            marginBottom: 10,
                            padding: 10,
                            borderRadius: 8,
                            backgroundColor: section.enabled ? "#111" : "#ddd",
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: section.enabled ? "#fff" : "#111" }}>
                            {section.enabled ? "Rubrique activée" : "Activer cette rubrique"}
                        </Text>
                    </TouchableOpacity>

                    <Text>Quantité</Text>
                    <TextInput
                        value={String(section.quantity ?? 0)}
                        onChangeText={(value) =>
                            updateSectionField(section.id, "quantity", Number(value) || 0)
                        }
                        keyboardType="numeric"
                        style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            padding: 10,
                            marginTop: 4,
                            marginBottom: 8,
                            borderRadius: 8,
                        }}
                    />

                    <Text>Prix unitaire</Text>
                    <TextInput
                        value={String(section.unitPrice ?? 0)}
                        onChangeText={(value) =>
                            updateSectionField(section.id, "unitPrice", Number(value) || 0)
                        }
                        keyboardType="numeric"
                        style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            padding: 10,
                            marginTop: 4,
                            marginBottom: 8,
                            borderRadius: 8,
                        }}
                    />

                    <Text>Nombre de jours</Text>
                    <TextInput
                        value={String(section.numberOfDays ?? 1)}
                        onChangeText={(value) =>
                            updateSectionField(section.id, "numberOfDays", Number(value) || 1)
                        }
                        keyboardType="numeric"
                        style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            padding: 10,
                            marginTop: 4,
                            marginBottom: 8,
                            borderRadius: 8,
                        }}
                    />

                    <Text>Taux de coût matière / coût interne (%)</Text>
                    <TextInput
                        value={String(section.costRate ?? 0)}
                        onChangeText={(value) =>
                            updateSectionField(section.id, "costRate", Number(value) || 0)
                        }
                        keyboardType="numeric"
                        style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            padding: 10,
                            marginTop: 4,
                            marginBottom: 8,
                            borderRadius: 8,
                        }}
                    />
                </View>
            ))}

            <View
                style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 10,
                    backgroundColor: "#f3f3f3",
                }}
            >
                <Text style={{ fontSize: 18, fontWeight: "700" }}>Résumé</Text>
                <Text>Chiffre d’affaires : {totals.subtotal} USD</Text>
                <Text>Coût total : {totals.totalCost} USD</Text>
                <Text>Marge : {totals.margin} USD</Text>
            </View>

            <TouchableOpacity
                onPress={handleSaveSimulation}
                disabled={saving}
                style={{
                    marginTop: 24,
                    marginBottom: 40,
                    backgroundColor: saving ? "#999" : "#111",
                    padding: 16,
                    borderRadius: 10,
                    alignItems: "center",
                }}
            >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {saving ? "Enregistrement..." : "Enregistrer la simulation"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}