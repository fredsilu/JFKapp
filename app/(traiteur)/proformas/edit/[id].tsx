import React, { useCallback, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import SimulationEditor from "@/components/simulation/SimulationEditor";

import {
  CateringProforma,
  getCateringProformaById,
  updateCateringProforma,
} from "@/src/services/cateringProforma.service";

import {
  sectionsToDocumentItems,
  buildDocumentTotalsFromSections,
} from "@/src/utils/cateringSectionsToDocumentItems";

export default function EditProformaScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [proforma, setProforma] = useState<CateringProforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProforma = useCallback(async () => {
    if (!id) {
      Alert.alert("Erreur", "Identifiant proforma introuvable");
      router.replace("/(traiteur)/proformas");
      return;
    }

    try {
      setLoading(true);

      const data = await getCateringProformaById(id);

      if (!data) {
        Alert.alert("Erreur", "Proforma introuvable");
        router.replace("/(traiteur)/proformas");
        return;
      }

      if (data.status !== "draft") {
        Alert.alert(
          "Proforma verrouillée",
          "Seule une proforma brouillon peut être modifiée."
        );

        router.replace({
          pathname: "/(traiteur)/proformas/[id]",
          params: { id: String(id) },
        });

        return;
      }

      setProforma({
        ...data,
        id: data.id ?? id,
      });
    } catch (error) {
      console.error("❌ load draft proforma error:", error);
      Alert.alert("Erreur", "Impossible de charger la proforma");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadProforma();
    }, [loadProforma])
  );

  async function handleSave(payload: any) {
    if (!proforma?.id) return;

    try {
      setSaving(true);

      const items = sectionsToDocumentItems(payload.sections);
      const totals = buildDocumentTotalsFromSections(payload.sections);

      await updateCateringProforma(proforma.id, {
        eventName: payload.eventName,
        eventDate: payload.dateLivraison,

        sections: payload.sections,

        items: items.map((item: any) => ({
          label: item.label,
          quantity: Number(item.quantity ?? 0),
          unitPrice: Number(item.unitPrice ?? 0),
          total: Number(item.totalPrice ?? item.total ?? 0),
          numberOfDays: Number(item.days ?? item.numberOfDays ?? 1),
        })),

        totals: {
          subtotal: Number(totals.subtotal ?? 0),
          discount: Number((totals as any).discount ?? 0),
          tax: Number((totals as any).tax ?? 0),
          total: Number(totals.total ?? 0),
          currency: "USD",
        },
      });

      Alert.alert("Succès", "Proforma sauvegardée.");

      router.replace({
        pathname: "/(traiteur)/proformas/[id]",
        params: { id: proforma.id },
      });
    } catch (error) {
      console.error("❌ save draft proforma error:", error);

      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible de sauvegarder"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!proforma) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Proforma introuvable</Text>
      </View>
    );
  }

  return (
    <SimulationEditor
      title={`Modifier ${proforma.number}`}

      initialEventName={proforma.eventName ?? ""}
      initialClientName={proforma.clientName ?? ""}
      initialNumberOfPeople={0}

      initialDateLivraison={proforma.eventDate ?? ""}
      initialDeliveryTime=""
      initialDeliveryAddress=""
      initialComment=""

      initialSections={proforma.sections ?? []}

      submitLabel="Sauvegarder la proforma"

      saving={saving}

      onSubmit={handleSave}
    />
  );
}