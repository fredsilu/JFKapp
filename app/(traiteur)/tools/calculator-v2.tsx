import React, { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import SimulationEditor from "@/components/simulation/SimulationEditor";

import { createCateringSimulation } from "@/src/services/cateringSimulation.service";

export default function CalculatorV2Screen() {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(payload: any) {
    try {
      setSaving(true);

      const simulationId =
        await createCateringSimulation({
          name: payload.eventName,
          eventName: payload.eventName,

          clientId: "",
          clientName: payload.clientName,

          guestCount: payload.numberOfPeople,

          sections: payload.sections,

          globalTurnover:
            payload.totals.subtotal,

          globalCost:
            payload.totals.totalCost,

          globalMargin:
            payload.totals.margin,

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

      Alert.alert(
        "Succès",
        "Simulation enregistrée."
      );

      router.push({
        pathname: "/simulations/[id]",
        params: {
          id: simulationId,
        },
      });
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Erreur",
        "Impossible d'enregistrer."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SimulationEditor
      title="Nouvelle simulation"
      submitLabel="Enregistrer la simulation"
      saving={saving}
      onSubmit={handleSubmit}
    />
  );
}