// app/tools/calculator-v2.tsx
import React, { useState } from "react";
import { Alert } from "react-native";
import {
    router,
    Stack,
    useLocalSearchParams,
} from "expo-router";

import SimulationEditor from "@/components/simulation/SimulationEditor";
import { createCateringSimulation } from "@/src/services/cateringSimulation.service";

function paramToString(value?: string | string[]) {
    if (!value) return "";
    return Array.isArray(value) ? value[0] : value;
}

export default function CalculatorV2Screen() {
    const params = useLocalSearchParams<{
        clientId?: string | string[];
        clientName?: string | string[];
    }>();

    const clientId = paramToString(params.clientId);
    const clientName = decodeURIComponent(
        paramToString(params.clientName)
    );

    const [saving, setSaving] = useState(false);

    async function handleSubmit(payload: any) {
        if (saving) return;

        try {
            setSaving(true);

            const simulationId = await createCateringSimulation({
                name: payload.eventName || "Simulation traiteur",
                eventName: payload.eventName || "Simulation traiteur",

                clientId,
                clientName: payload.clientName || clientName,

                numberOfPeople: payload.numberOfPeople,
                guestCount: payload.numberOfPeople,

                dateLivraison: payload.dateLivraison || "",
                deliveryTime: payload.deliveryTime || "",
                deliveryAddress: payload.deliveryAddress || "",
                comment: payload.comment || "",

                sections: payload.sections ?? [],

                globalTurnover: payload.totals?.subtotal ?? 0,
                globalCost: payload.totals?.totalCost ?? 0,
                globalMargin: payload.totals?.margin ?? 0,

                discount: 0,

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

            router.replace({
                pathname: "/(traiteur)/simulations/[id]",
                params: {
                    id: simulationId,
                },
            });
        } catch (error) {
            console.error("❌ create simulation v2 error:", error);
            Alert.alert("Erreur", "Impossible d'enregistrer.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: "Nouvelle simulation",
                }}
            />

            <SimulationEditor
                title="Création de simulation"
                initialClientName={clientName}
                submitLabel="Enregistrer"
                saving={saving}
                onSubmit={handleSubmit}
            />
        </>
    );
}