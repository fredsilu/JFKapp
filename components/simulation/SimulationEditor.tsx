import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
} from "react-native";

import ArticleSectionCard from "@/components/simulation/ArticleSectionCard";
import ServiceSectionCard from "@/components/simulation/ServiceSectionCard";

import {
    CateringSection,
    CateringServiceDay,
} from "@/types/catering";

import {
    calculateSection,
    createEmptySectionsFromTemplates,
    getSectionsTotals,
} from "@/src/utils/cateringSections";

import { getCateringSectionTemplates } from "@/src/services/cateringSectionTemplate.service";

import {
    CateringServiceSettings,
    getCateringServiceSettings,
} from "@/src/services/cateringServiceSettings.service";

type SimulationEditorSubmitPayload = {
    eventName: string;
    clientName: string;
    numberOfPeople: number;

    dateLivraison: string;
    deliveryTime: string;
    deliveryAddress: string;
    comment: string;

    sections: CateringSection[];

    totals: {
        subtotal: number;
        totalCost: number;
        margin: number;
    };
};

type Props = {
    title?: string;

    initialEventName?: string;
    initialClientName?: string;
    initialNumberOfPeople?: number;
    initialSections?: CateringSection[];
    initialDateLivraison?: string;
    initialDeliveryTime?: string;
    initialDeliveryAddress?: string;
    initialComment?: string;

    submitLabel?: string;
    saving?: boolean;

    onSubmit: (payload: SimulationEditorSubmitPayload) => Promise<void>;
};

export default function SimulationEditor({
    title = "Simulation",
    initialEventName = "",
    initialClientName = "",
    initialDateLivraison = "",
    initialDeliveryTime = "",
    initialDeliveryAddress = "",
    initialComment = "",
    initialNumberOfPeople = 0,
    initialSections,
    submitLabel = "Enregistrer",
    saving = false,
    onSubmit,
}: Props) {
    const [eventName, setEventName] = useState(initialEventName);
    const [clientName, setClientName] = useState(initialClientName);
    const [numberOfPeople, setNumberOfPeople] = useState(
        String(initialNumberOfPeople || 0)
    );

    const [dateLivraison, setDateLivraison] = useState(initialDateLivraison);
    const [deliveryTime, setDeliveryTime] = useState(initialDeliveryTime);
    const [deliveryAddress, setDeliveryAddress] = useState(initialDeliveryAddress);
    const [comment, setComment] = useState(initialComment);

    const [sections, setSections] = useState<CateringSection[]>([]);
    const [serviceSettings, setServiceSettings] =
        useState<CateringServiceSettings | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInitialData();
    }, []);

    async function loadInitialData() {
        try {
            setLoading(true);

            const settings = await getCateringServiceSettings();
            setServiceSettings(settings);

            if (initialSections?.length) {
                setSections(initialSections.map(calculateSection));
                return;
            }

            const templates = await getCateringSectionTemplates();
            const emptySections = createEmptySectionsFromTemplates(templates);

            const hydratedSections = emptySections.map((section) => {
                if (section.kind !== "service") return section;

                return {
                    ...section,
                    serviceDays: [
                        {
                            ...(section.serviceDays?.[0] ?? createServiceDay(1, settings)),

                            serverRate: settings.defaultServerRate ?? 25,
                            cookRate: settings.defaultCookRate ?? 50,

                            serverDailyCost: settings.serverDailyCost ?? 0,
                            cookDailyCost: settings.cookDailyCost ?? 0,

                            extraDailyCost:
                                (settings.electricityDailyCost ?? 0) +
                                (settings.gasDailyCost ?? 0) +
                                (settings.fuelDailyCost ?? 0),
                        },
                    ],
                };
            });

            setSections(hydratedSections.map(calculateSection));
        } catch (error) {
            console.error("Erreur chargement éditeur simulation:", error);
            Alert.alert("Erreur", "Impossible de charger l’éditeur.");
        } finally {
            setLoading(false);
        }
    }

    function createServiceDay(
        dayNumber: number,
        settings = serviceSettings
    ): CateringServiceDay {
        return {
            id: `service_day_${dayNumber}_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,

            dayNumber,

            numberOfPeople: Number(numberOfPeople) || 0,

            serverRate: settings?.defaultServerRate ?? 25,
            cookRate: settings?.defaultCookRate ?? 50,

            numberOfServers: 0,
            numberOfCooks: 0,

            serverDailyCost: settings?.serverDailyCost ?? 0,
            cookDailyCost: settings?.cookDailyCost ?? 0,

            extraDailyCost:
                (settings?.electricityDailyCost ?? 0) +
                (settings?.gasDailyCost ?? 0) +
                (settings?.fuelDailyCost ?? 0),

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
            return existingDays.length > 0
                ? [existingDays[0]]
                : [createServiceDay(1)];
        }

        return Array.from({ length: count }).map((_, index) => {
            return existingDays[index] ?? createServiceDay(index + 1);
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

    const totals = useMemo(() => {
        return getSectionsTotals(sections);
    }, [sections]);

    async function handleSubmit() {
        if (!eventName.trim()) {
            Alert.alert("Champ requis", "Veuillez saisir le nom de l’événement.");
            return;
        }

        await onSubmit({
            eventName: eventName.trim(),
            dateLivraison,
            deliveryTime,
            deliveryAddress,
            comment,
            clientName: clientName.trim(),
            numberOfPeople: Number(numberOfPeople) || 0,
            sections: totals.sections,
            totals: {
                subtotal: totals.subtotal,
                totalCost: totals.totalCost,
                margin: totals.margin,
            },
        });
    }

    if (loading) {
        return (
            <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
                <Text>Chargement...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
                {title}
            </Text>

            <Text>Nom de l’événement</Text>
            <TextInput
                value={eventName}
                onChangeText={setEventName}
                placeholder="Ex: Cocktail entreprise"
                style={inputStyle}
            />

            <Text>Client</Text>
            <TextInput
                value={clientName}
                onChangeText={setClientName}
                placeholder="Nom du client"
                style={inputStyle}
            />

            <Text>Nombre de personnes</Text>
            <TextInput
                value={numberOfPeople}
                onChangeText={setNumberOfPeople}
                keyboardType="numeric"
                placeholder="0"
                style={inputStyle}
            />
            <Text>Date livraison</Text>
            <TextInput
                value={dateLivraison}
                onChangeText={setDateLivraison}
                placeholder="YYYY-MM-DD"
                style={inputStyle}
            />

            <Text>Heure livraison</Text>
            <TextInput
                value={deliveryTime}
                onChangeText={setDeliveryTime}
                placeholder="Ex: 12h30"
                style={inputStyle}
            />

            <Text>Lieu livraison</Text>
            <TextInput
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Adresse de livraison"
                style={inputStyle}
            />

            <Text>Commentaire</Text>
            <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Instructions ou commentaire"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[
                    inputStyle,
                    {
                        minHeight: 90,
                    },
                ]}
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
                onPress={handleSubmit}
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
                    {saving ? "Enregistrement..." : submitLabel}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const inputStyle = {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
};