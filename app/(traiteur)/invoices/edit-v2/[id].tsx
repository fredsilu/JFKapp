//app/(traiteur)/invoices/edit-v2/[id].tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  useLocalSearchParams,
  router,
} from "expo-router";

import { useFocusEffect } from "@react-navigation/native";

import SimulationEditor from "@/components/simulation/SimulationEditor";

import { CateringInvoice } from "@/types/catering";

import {
  getCateringInvoiceById,
  updateDraftInvoice,
} from "@/src/services/cateringInvoice.service";

import {
  sectionsToDocumentItems,
  buildDocumentTotalsFromSections,
} from "@/src/utils/cateringSectionsToDocumentItems";

export default function EditInvoiceV2Screen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [invoice, setInvoice] = useState<CateringInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadInvoice = useCallback(async () => {
    if (!id) {
      Alert.alert("Erreur", "Identifiant facture introuvable");
      router.replace("/(traiteur)/invoices");
      return;
    }

    try {
      setLoading(true);

      const data = await getCateringInvoiceById(id);

      if (!data) {
        Alert.alert("Erreur", "Facture introuvable");
        router.replace("/(traiteur)/invoices");
        return;
      }

      if (data.status !== "draft") {
        Alert.alert(
          "Facture verrouillée",
          "Seule une facture brouillon peut être modifiée."
        );

        router.replace({
          pathname: "/(traiteur)/invoices/[id]",
          params: { id: String(id) },
        });

        return;
      }

      setInvoice({
        ...data,
        id: data.id ?? id,
      });
    } catch (error) {
      console.error("❌ load draft invoice v2 error:", error);
      Alert.alert("Erreur", "Impossible de charger la facture");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadInvoice();
    }, [loadInvoice])
  );

  async function handleSave(payload: any) {
    if (!invoice?.id) return;

    try {
      setSaving(true);

      const items = sectionsToDocumentItems(payload.sections);
      const totals = buildDocumentTotalsFromSections(payload.sections);

      await updateDraftInvoice(invoice.id, {
        designation: payload.eventName || "Prestation traiteur",
        eventName: payload.eventName,

        guestCount: payload.numberOfPeople,
        eventDate: payload.eventDate,
        servicePeriod: payload.servicePeriod || "",
        dateLivraison: payload.dateLivraison,
        deliveryTime: payload.deliveryTime,
        deliveryAddress: payload.deliveryAddress,
        comment: payload.comment,

        sections: payload.sections,

        items: items as any,
        totals: totals as any,
      });

      Alert.alert("Succès", "Facture sauvegardée.");

      router.replace({
        pathname: "/(traiteur)/invoices/[id]",
        params: { id: invoice.id },
      });
    } catch (error) {
      console.error("❌ save draft invoice v2 error:", error);

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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Facture introuvable</Text>
      </View>
    );
  }

  return (
    <SimulationEditor
      title={`Modifier ${invoice.number}`}

      initialEventName={invoice.eventName ?? invoice.designation ?? ""}
      initialClientName={invoice.client?.name ?? ""}
      initialNumberOfPeople={invoice.guestCount ?? 0}

      initialEventDate={(invoice as any).eventDate ?? ""}
      initialServicePeriod={(invoice as any).servicePeriod ?? ""}
      initialDateLivraison={invoice.dateLivraison ?? ""}
      initialDeliveryTime={invoice.deliveryTime ?? ""}
      initialDeliveryAddress={invoice.deliveryAddress ?? ""}
      initialComment={invoice.comment ?? ""}

      initialSections={invoice.sections ?? []}

      submitLabel="Sauvegarder la facture"

      saving={saving}

      onSubmit={handleSave}
    />
  );
}