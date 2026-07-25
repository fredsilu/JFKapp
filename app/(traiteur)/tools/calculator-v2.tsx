// app/(traiteur)/tools/calculator-v2.tsx


import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  View,
  Text,
} from "react-native";

import {
  router,
  Stack,
  useLocalSearchParams,
} from "expo-router";

import SimulationEditor from "@/components/simulation/SimulationEditor";

import {
  createCateringSimulation,
  getSimulationById,
} from "@/src/services/cateringSimulation.service";

function paramToString(
  value?: string | string[]
): string {
  if (!value) return "";

  return Array.isArray(value)
    ? value[0] ?? ""
    : value;
}

function showAlert(
  title: string,
  message: string
) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

function formatDateFr(value: any): string {
  if (!value) return "";

  if (typeof value?.toDate === "function") {
    return value
      .toDate()
      .toLocaleDateString("fr-FR");
  }

  if (value instanceof Date) {
    return value.toLocaleDateString("fr-FR");
  }

  if (typeof value === "string") {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return value;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString("fr-FR");
      }
    }

    return value;
  }

  return "";
}

export default function CalculatorV2Screen() {
  const params = useLocalSearchParams<{
    clientId?: string | string[];
    clientName?: string | string[];
    reuseSimulationId?: string | string[];
    sessionId?: string | string[];
    mode?: string | string[];
  }>();

  /*
   * Lire tous les paramètres avant de calculer le mode.
   */
  const clientId = paramToString(
    params.clientId
  );

  const rawClientName = paramToString(
    params.clientName
  );

  const reuseSimulationId = paramToString(
    params.reuseSimulationId
  );

  const sessionId = paramToString(
    params.sessionId
  );

  const mode = paramToString(
    params.mode
  );

  /*
   * Une réutilisation n'est valide que lorsque :
   * 1. mode vaut "reuse"
   * 2. un identifiant de simulation est présent
   */
  const isReuseMode =
    mode === "reuse" &&
    Boolean(reuseSimulationId);

  let clientName = "";

  try {
    clientName = decodeURIComponent(
      rawClientName
    );
  } catch {
    clientName = rawClientName;
  }

  const [saving, setSaving] =
    useState(false);

  const [loadingReuse, setLoadingReuse] =
    useState(false);

  const [
    reuseSimulation,
    setReuseSimulation,
  ] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReuseSimulation() {
      /*
       * Mode nouvelle simulation :
       * supprimer toute ancienne simulation
       * conservée en mémoire.
       */
      if (!isReuseMode) {
        setReuseSimulation(null);
        setLoadingReuse(false);
        return;
      }

      try {
        setLoadingReuse(true);
        setReuseSimulation(null);

        const found =
          await getSimulationById(
            reuseSimulationId
          );

        if (!found) {
          throw new Error(
            "Simulation introuvable."
          );
        }

        if (isMounted) {
          setReuseSimulation(found);
        }
      } catch (error) {
        console.error(
          "❌ load reuse simulation error:",
          error
        );

        if (isMounted) {
          setReuseSimulation(null);

          showAlert(
            "Erreur",
            "Impossible de charger la simulation à réutiliser."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingReuse(false);
        }
      }
    }

    loadReuseSimulation();

    return () => {
      isMounted = false;
    };
  }, [
    isReuseMode,
    reuseSimulationId,
  ]);

  async function handleSubmit(
    payload: any
  ) {
    if (saving) return;

    try {
      setSaving(true);

      const subtotal = Number(
        payload.totals?.subtotal ?? 0
      );

      const discount = Number(
        payload.discount ??
        payload.totals?.discountAmount ??
        0
      );

      const grandTotal = Number(
        payload.totals?.grandTotal ??
        Math.max(
          subtotal - discount,
          0
        )
      );

      const totalCost = Number(
        payload.totals?.totalCost ?? 0
      );

      const margin = Number(
        payload.totals?.margin ??
        grandTotal - totalCost
      );

      const simulationId =
        await createCateringSimulation({
          name:
            payload.eventName ||
            "Simulation traiteur",

          eventName:
            payload.eventName ||
            "Simulation traiteur",

          clientId:
            payload.clientId ||
            clientId ||
            "",

          clientName:
            payload.clientName ||
            clientName ||
            "",

          eventDate:
            payload.eventDate || "",

          dateEvenement:
            payload.eventDate || "",

          servicePeriod:
            payload.servicePeriod || "",

          numberOfPeople:
            Number(
              payload.numberOfPeople
            ) || 0,

          guestCount:
            Number(
              payload.numberOfPeople
            ) || 0,

          dateLivraison:
            payload.dateLivraison || "",

          deliveryDate:
            payload.dateLivraison || "",

          deliveryTime:
            payload.deliveryTime || "",

          deliveryAddress:
            payload.deliveryAddress || "",

          comment:
            payload.comment || "",

          sections:
            payload.sections ?? [],

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

          status: "draft",
          isDeleted: false,

          convertedToOrder: false,

          sourceSimulationId:
            isReuseMode
              ? reuseSimulationId
              : null,
        } as any);

      showAlert(
        "Succès",
        "Simulation enregistrée."
      );

      router.replace({
        pathname:
          "/(traiteur)/simulations/[id]",

        params: {
          id: simulationId,
        },
      });
    } catch (error) {
      console.error(
        "❌ create simulation v2 error:",
        error
      );

      showAlert(
        "Erreur",
        "Impossible d'enregistrer."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingReuse) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>
          Chargement de la simulation...
        </Text>
      </View>
    );
  }

  /*
   * En mode réutilisation, ne jamais afficher
   * un formulaire vide lorsque la simulation
   * demandée n'a pas été chargée.
   */
  if (
    isReuseMode &&
    !loadingReuse &&
    !reuseSimulation
  ) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text>
          La simulation à réutiliser
          n’a pas pu être chargée.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isReuseMode
            ? "Réutiliser simulation"
            : "Nouvelle simulation",
        }}
      />

      <SimulationEditor
        /*
         * Chaque nouvelle session crée un nouvel
         * éditeur et efface l'ancien état React.
         */
        key={
          isReuseMode
            ? `reuse-${reuseSimulationId}`
            : `new-${sessionId || "default"}`
        }
        title={
          isReuseMode
            ? "Réutilisation de simulation"
            : "Création de simulation"
        }
        initialEventName={
          isReuseMode
            ? reuseSimulation?.eventName ||
            reuseSimulation?.name ||
            ""
            : ""
        }
        initialServicePeriod={
          isReuseMode
            ? reuseSimulation
              ?.servicePeriod || ""
            : ""
        }
        initialClientId={
          isReuseMode
            ? reuseSimulation?.clientId ||
            ""
            : clientId
        }
        initialClientName={
          isReuseMode
            ? reuseSimulation
              ?.clientName || ""
            : clientName
        }
        initialNumberOfPeople={
          isReuseMode
            ? Number(
              reuseSimulation
                ?.numberOfPeople ??
              reuseSimulation
                ?.guestCount ??
              0
            )
            : 0
        }
        initialEventDate={
          isReuseMode
            ? formatDateFr(
              reuseSimulation
                ?.eventDate ||
              reuseSimulation
                ?.dateEvenement
            )
            : ""
        }
        initialDateLivraison={
          isReuseMode
            ? formatDateFr(
              reuseSimulation
                ?.dateLivraison ||
              reuseSimulation
                ?.deliveryDate
            )
            : ""
        }
        initialDeliveryTime={
          isReuseMode
            ? reuseSimulation
              ?.deliveryTime || ""
            : ""
        }
        initialDeliveryAddress={
          isReuseMode
            ? reuseSimulation
              ?.deliveryAddress || ""
            : ""
        }
        initialComment={
          isReuseMode
            ? reuseSimulation?.comment ||
            ""
            : ""
        }
        initialSections={
          isReuseMode
            ? reuseSimulation?.sections ??
            []
            : undefined
        }
        initialDiscount={
          isReuseMode
            ? Number(
              reuseSimulation
                ?.discount ??
              reuseSimulation
                ?.totals
                ?.discountAmount ??
              0
            )
            : 0
        }
        submitLabel="Enregistrer"
        saving={saving}
        onSubmit={handleSubmit}
      />
    </>
  );
}