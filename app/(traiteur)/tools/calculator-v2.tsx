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
import {
    getCateringServiceSettings,
    CateringServiceSettings,
} from "@/src/services/cateringServiceSettings.service";
import { router } from "expo-router";
import ArticleSectionCard from "@/components/simulation/ArticleSectionCard";
import ServiceSectionCard from "@/components/simulation/ServiceSectionCard";
import { CateringServiceDay } from "@/types/catering";
import { CateringSection } from "@/types/catering";
import { createCateringSimulation } from "@/src/services/cateringSimulation.service";
import { getCateringSectionTemplates } from "@/src/services/cateringSectionTemplate.service";
import {
    createEmptySectionsFromTemplates,
    getSectionsTotals,
    calculateSection,
} from "@/src/utils/cateringSections";

export default function CalculatorV2Screen() {
    const [eventName, setEventName] = useState("");
    const [clientName, setClientName] = useState("");
    const [numberOfPeople, setNumberOfPeople] = useState("0");
    const [sections, setSections] = useState<CateringSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [serviceSettings, setServiceSettings] =
        useState<CateringServiceSettings | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        try {
            setLoading(true);
            const settings =
                await getCateringServiceSettings();

            setServiceSettings(settings);
            const templates = await getCateringSectionTemplates();
            const emptySections = createEmptySectionsFromTemplates(templates);
            const hydratedSections = emptySections.map((section) => {
                if (section.kind !== "service") return section;

                return {
                    ...section,
                    serviceDays: [
                        {
                            ...(section.serviceDays?.[0] ?? createServiceDay(1)),

                            serverRate:
                                settings.defaultServerRate ?? 25,

                            cookRate:
                                settings.defaultCookRate ?? 50,

                            serverDailyCost:
                                settings.serverDailyCost ?? 0,

                            cookDailyCost:
                                settings.cookDailyCost ?? 0,

                            extraDailyCost:
                                (settings.electricityDailyCost ?? 0) +
                                (settings.gasDailyCost ?? 0) +
                                (settings.fuelDailyCost ?? 0),
                        },
                    ],
                };
            });

            setSections(hydratedSections);
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

    function updateServiceDay(
        sectionId: string,
        dayId: string,
        field: keyof CateringServiceDay,
        value: any
    ) {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;

                const updatedSection: CateringSection = {
                    ...section,
                    serviceDays: (section.serviceDays ?? []).map((day) =>
                        day.id === dayId
                            ? {
                                ...day,
                                [field]: value,
                            }
                            : day
                    ),
                };

                return calculateSection(updatedSection);
            })
        );
    }

    function createServiceDay(dayNumber: number): CateringServiceDay {
        return {
            id: `service_day_${dayNumber}_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            dayNumber,

            numberOfPeople: Number(numberOfPeople) || 0,

            serverRate:
                serviceSettings?.defaultServerRate ?? 25,

            cookRate:
                serviceSettings?.defaultCookRate ?? 50,

            numberOfServers: 0,
            numberOfCooks: 0,

            serverDailyCost:
                serviceSettings?.serverDailyCost ?? 0,

            cookDailyCost:
                serviceSettings?.cookDailyCost ?? 0,

            extraDailyCost:
                (serviceSettings?.electricityDailyCost ?? 0) +
                (serviceSettings?.gasDailyCost ?? 0) +
                (serviceSettings?.fuelDailyCost ?? 0),

            totalCost: 0,
            billedAmount: 0,
        };
    }

    function normalizeServiceDays(
        section: CateringSection,
        nextNumberOfDays: number
    ): CateringServiceDay[] {
        const count = Math.max(Number(nextNumberOfDays || 1), 1);
        const existingDays = section.serviceDays ?? [];

        if (section.serviceMode !== "different_days") {
            return existingDays.length > 0 ? [existingDays[0]] : [createServiceDay(1)];
        }

        return Array.from({ length: count }).map((_, index) => {
            return (
                existingDays[index] ?? createServiceDay(index + 1)
            );
        });
    }

    function updateSectionField(
        sectionId: string,
        field: keyof CateringSection,
        value: any
    ) {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;

                const nextSection: CateringSection = {
                    ...section,
                    [field]: value,
                };

                if (
                    nextSection.kind === "service" &&
                    (field === "numberOfDays" || field === "serviceMode")
                ) {
                    nextSection.serviceDays = normalizeServiceDays(
                        nextSection,
                        Number(nextSection.numberOfDays ?? 1)
                    );
                }

                return calculateSection(nextSection);
            })
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

            {sections.map((section) =>
                section.kind === "service" ? (
                    <ServiceSectionCard
                        key={section.id}
                        section={section}
                        onUpdateSection={updateSectionField}
                        onUpdateServiceDay={updateServiceDay}
                    />
                ) : (
                    <ArticleSectionCard
                        key={section.id}
                        section={section}
                        onUpdate={updateSectionField}
                    />
                )
            )}

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