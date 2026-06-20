// app/(traiteur)/simulations/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { formatShortDocumentDate } from "@/src/utils/dateFormat";

import { formatCurrency } from "@/src/utils/costs";
import { getCateringSimulations } from "@/src/services/cateringSimulation.service";
import { fetchClients } from "@/src/services/clientService";

function toNumber(value: any, fallback = 0): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function displayValue(value: any): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function displayDate(value: any): string {
  if (!value) return "—";

  if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  return formatShortDocumentDate(value);
}

export default function CateringSimulationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [clientName, setClientName] = useState<string>("—");
  const [sim, setSim] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSimulation() {
      if (!id) return;

      try {
        setLoading(true);

        const [sims, clients] = await Promise.all([
          getCateringSimulations(),
          fetchClients(),
        ]);

        const found = sims.find((s) => s.id === id);

        setSim(found || null);

        if (found?.clientId) {
          const client = clients.find((c) => c.id === found.clientId);
          setClientName(client?.name || "Client inconnu");
        } else if ((found as any)?.clientName) {
          setClientName((found as any).clientName);
        }
      } catch (e) {
        console.error("❌ load simulation error:", e);
        setSim(null);
      } finally {
        setLoading(false);
      }
    }

    loadSimulation();
  }, [id]);

  const financials = useMemo(() => {
    if (!sim) {
      return {
        subtotal: 0,
        discount: 0,
        grandTotal: 0,
        totalCost: 0,
        margin: 0,
      };
    }

    const subtotal =
      toNumber(sim.totals?.subtotal) ||
      toNumber(sim.globalTurnover) + toNumber(sim.discount);

    const discount =
      toNumber(sim.totals?.discountAmount) || toNumber(sim.discount);

    const grandTotal =
      toNumber(sim.totals?.grandTotal) || Math.max(subtotal - discount, 0);

    const totalCost =
      toNumber(sim.totals?.totalCost) || toNumber(sim.globalCost);

    const margin =
      toNumber(sim.totals?.margin) ||
      grandTotal - totalCost ||
      toNumber(sim.globalMargin);

    return {
      subtotal,
      discount,
      grandTotal,
      totalCost,
      margin,
    };
  }, [sim]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!sim) {
    return (
      <View style={styles.center}>
        <Text>Simulation introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {sim.eventName || sim.name || "Simulation sans nom"}
      </Text>


      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Informations générales</Text>

        <Text style={styles.subtitle}>Client : {clientName}</Text>

        <Text style={styles.subtitle}>
          Nombre de personnes : {displayValue(sim.guestCount)}
        </Text>

        <Text style={styles.subtitle}>
          Date livraison : {displayDate(sim.dateLivraison)}
        </Text>

        <Text style={styles.subtitle}>
          Heure livraison : {displayValue(sim.deliveryTime)}
        </Text>

        <Text style={styles.subtitle}>
          Date événement : {displayDate(sim.eventDate)}
        </Text>

        <Text style={styles.subtitle}>
          Période prestation : {displayValue(sim.servicePeriod)}
        </Text>

        <Text style={styles.subtitle}>
          Adresse livraison : {displayValue(sim.deliveryAddress)}
        </Text>

        <Text style={styles.subtitle}>
          Date création : {displayDate(sim.createdAt)}
        </Text>

        <Text style={styles.status}>Statut : {sim.status || "draft"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rubriques</Text>

        {(sim.sections ?? [])
          .filter((section: any) => section.enabled)
          .map((section: any) => (
            <View key={section.id} style={styles.cardLine}>
              <Text style={styles.lineTitle}>{section.name}</Text>

              <Text style={styles.lineText}>
                Mode de calcul :{" "}
                {section.billingMode === "perDay" ? "Par jour" : "Fixe"}
              </Text>

              <Text style={styles.lineText}>
                Quantité : {section.quantity}
              </Text>

              <Text style={styles.lineText}>
                Prix unitaire : {formatCurrency(section.unitPrice)}
              </Text>

              {section.billingMode === "perDay" && (
                <Text style={styles.lineText}>
                  Nombre de jours : {section.numberOfDays}
                </Text>
              )}

              <Text style={styles.lineText}>
                Chiffre d&apos;affaires : {formatCurrency(section.total)}
              </Text>

              <Text style={styles.lineText}>
                Coût : {formatCurrency(section.costAmount ?? 0)}
              </Text>

              <Text style={styles.lineText}>
                Marge : {formatCurrency(section.margin ?? 0)}
              </Text>
            </View>
          ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résultats financiers</Text>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>CA avant remise</Text>
          <Text style={styles.resultValue}>
            {formatCurrency(financials.subtotal)}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Remise globale</Text>
          <Text style={styles.resultValue}>
            -{formatCurrency(financials.discount)}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>CA après remise</Text>
          <Text style={styles.resultValue}>
            {formatCurrency(financials.grandTotal)}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Coût total</Text>
          <Text style={styles.resultValue}>
            {formatCurrency(financials.totalCost)}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Marge globale</Text>
          <Text style={styles.resultValue}>
            {formatCurrency(financials.margin)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {sim?.id && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: "/(traiteur)/proformas/create-from-simulation",
                params: {
                  simulationId: sim.id,
                  backTo: "/(traiteur)/simulations",
                },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Créer proforma</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            router.push({
              pathname: "/(traiteur)/tools/calculator-v2",
              params: {
                reuseSimulationId: sim.id,
                backTo: "/(traiteur)/simulations",
              },
            })
          }
        >
          <Text style={styles.secondaryButtonText}>
            Réutiliser cette simulation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(traiteur)/simulations")}
        >
          <Text style={styles.backButtonText}>Retour aux simulations</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 16,
  },

  center: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    color: "#111827",
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    elevation: 2,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 6,
  },

  status: {
    fontSize: 13,
    fontWeight: "700",
    color: "#007AFF",
    marginTop: 6,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    color: "#111827",
  },

  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },

  resultLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },

  resultValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  cardLine: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },

  lineTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
    color: "#111827",
  },

  lineText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },

  actions: {
    marginTop: 10,
  },

  secondaryButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  backButton: {
    backgroundColor: "#E5E7EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  backButtonText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 15,
  },
});