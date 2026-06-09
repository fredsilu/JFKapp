// app/tools/calculator-v2.tsx
import React, { useState } from "react";
import { Alert, Platform } from "react-native";
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

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

export default function CalculatorV2Screen() {
  const params = useLocalSearchParams<{
    clientId?: string | string[];
    clientName?: string | string[];
  }>();

  const clientId = paramToString(params.clientId);
  const clientName = decodeURIComponent(paramToString(params.clientName));

  const [saving, setSaving] = useState(false);

  async function handleSubmit(payload: any) {
    if (saving) return;

    try {
      setSaving(true);

      const subtotal = Number(payload.totals?.subtotal ?? 0);
      const discount = Number(payload.discount ?? payload.totals?.discountAmount ?? 0);
      const grandTotal = Number(
        payload.totals?.grandTotal ?? Math.max(subtotal - discount, 0)
      );
      const totalCost = Number(payload.totals?.totalCost ?? 0);
      const margin = Number(payload.totals?.margin ?? grandTotal - totalCost);

      console.log("🔥 PAYLOAD REÇU EDITEUR:", payload);
console.log("🔥 DISCOUNT:", payload.discount);
console.log("🔥 TOTALS:", payload.totals);

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

        totals: {
          subtotal,
          discountAmount: discount,
          grandTotal,
          totalCost,
          margin,
        },

        globalTurnover: grandTotal,
        globalCost: totalCost,
        globalMargin: margin,

        discount,

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

      showAlert("Succès", "Simulation enregistrée.");

      router.replace({
        pathname: "/(traiteur)/simulations/[id]",
        params: {
          id: simulationId,
        },
      });
    } catch (error) {
      console.error("❌ create simulation v2 error:", error);
      showAlert("Erreur", "Impossible d'enregistrer.");
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