//components/simulation/ServiceSectionCard.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from "react-native";

import {
  CateringSection,
  CateringServiceDay,
} from "@/types/catering";

import { formatCurrency } from "@/src/utils/costs";

type Props = {
  section: CateringSection;

  onUpdateSection: (
    sectionId: string,
    field: keyof CateringSection,
    value: any
  ) => void;

  onUpdateServiceDay: (
    sectionId: string,
    dayId: string,
    field: keyof CateringServiceDay,
    value: any
  ) => void;
};

export default function ServiceSectionCard({
  section,
  onUpdateSection,
  onUpdateServiceDay,
}: Props) {
  const serviceDays = section.serviceDays ?? [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Service traiteur
        </Text>

        <Switch
          value={section.enabled}
          onValueChange={(value) =>
            onUpdateSection(
              section.id,
              "enabled",
              value
            )
          }
        />
      </View>

      {!section.enabled ? (
        <Text style={styles.inactiveText}>
          Active le service traiteur si Crepolia doit facturer le personnel et les charges.
        </Text>
      ) : (
        <>
          <Text style={styles.label}>Nombre de jours</Text>
          <TextInput
            value={String(section.numberOfDays ?? "")}
            onChangeText={(value) => {
              const cleanValue = value.replace(/[^0-9]/g, "");

              onUpdateSection(
                section.id,
                "numberOfDays",
                cleanValue === "" ? "" : Number(cleanValue)
              );
            }}
            onBlur={() => {
              if (!section.numberOfDays || Number(section.numberOfDays) < 1) {
                onUpdateSection(section.id, "numberOfDays", 1);
              }
            }}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>Mode de service</Text>

          <TouchableOpacity
            style={styles.toggleModeButton}
            onPress={() =>
              onUpdateSection(
                section.id,
                "serviceMode",
                section.serviceMode === "identical_days"
                  ? "different_days"
                  : "identical_days"
              )
            }
          >
            <Text style={styles.toggleModeText}>
              {section.serviceMode === "identical_days"
                ? "Même service tous les jours"
                : "Service différent selon les jours"}
            </Text>

            <Text style={styles.toggleModeHint}>Appuyer pour changer</Text>
          </TouchableOpacity>

          {serviceDays.map((day) => {
            const serversCost =
              Number(day.numberOfServers ?? 0) *
              Number(day.serverDailyCost ?? 0);

            const cooksCost =
              Number(day.numberOfCooks ?? 0) *
              Number(day.cookDailyCost ?? 0);

            return (
              <View key={day.id} style={styles.dayCard}>
                <Text style={styles.dayTitle}>Jour {day.dayNumber}</Text>

                <Text style={styles.label}>Nombre de personnes</Text>
                <TextInput
                  value={String(day.numberOfPeople ?? 0)}
                  onChangeText={(value) =>
                    onUpdateServiceDay(
                      section.id,
                      day.id,
                      "numberOfPeople",
                      Number(value) || 0
                    )
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Ratio serveur</Text>
                    <TextInput
                      value={String(day.serverRate ?? 25)}
                      onChangeText={(value) =>
                        onUpdateServiceDay(
                          section.id,
                          day.id,
                          "serverRate",
                          Number(value) || 0
                        )
                      }
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.half}>
                    <Text style={styles.label}>Ratio cuisinier</Text>
                    <TextInput
                      value={String(day.cookRate ?? 50)}
                      onChangeText={(value) =>
                        onUpdateServiceDay(
                          section.id,
                          day.id,
                          "cookRate",
                          Number(value) || 0
                        )
                      }
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.resultBox}>
                  <Text style={styles.resultTitle}>Calcul du service</Text>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Serveurs calculés</Text>
                    <Text style={styles.resultValue}>
                      {day.numberOfServers ?? 0}
                    </Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Cuisiniers calculés</Text>
                    <Text style={styles.resultValue}>
                      {day.numberOfCooks ?? 0}
                    </Text>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Coût serveurs</Text>
                    <Text style={styles.resultValue}>
                      {formatCurrency(serversCost)}
                    </Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Coût cuisiniers</Text>
                    <Text style={styles.resultValue}>
                      {formatCurrency(cooksCost)}
                    </Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Courant</Text>
                    <Text style={styles.resultValue}>
                      {formatCurrency(day.electricityDailyCost ?? 0)}
                    </Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Gaz</Text>
                    <Text style={styles.resultValue}>
                      {formatCurrency(day.gasDailyCost ?? 0)}
                    </Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Carburant</Text>
                    <Text style={styles.resultValue}>
                      {formatCurrency(day.fuelDailyCost ?? 0)}
                    </Text>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.resultRow}>
                    <Text style={styles.totalCostLabel}>Coût réel/jour</Text>
                    <Text style={styles.totalCostValue}>
                      {formatCurrency(day.totalCost ?? 0)}
                    </Text>
                  </View>

                  <View style={styles.resultRow}>
                    <Text style={styles.billedLabel}>Montant facturé/jour</Text>
                    <Text style={styles.billedValue}>
                      {formatCurrency(day.billedAmount ?? 0)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Résumé service traiteur</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total facturé</Text>
              <Text style={styles.resultValue}>
                {formatCurrency(section.total ?? 0)}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Coût total</Text>
              <Text style={styles.resultValue}>
                {formatCurrency(section.costAmount ?? 0)}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.billedLabel}>Marge</Text>
              <Text style={styles.billedValue}>
                {formatCurrency(section.margin ?? 0)}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#CCFBF1",
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
  },


  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
  },

  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusButtonActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#5EEAD4",
  },

  statusButtonInactive: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
  },

  statusButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },

  statusButtonTextActive: {
    color: "#0F766E",
  },

  statusButtonTextInactive: {
    color: "#64748B",
  },

  inactiveText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 5,
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 11,
    marginBottom: 12,
    color: "#0F172A",
  },

  toggleModeButton: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },

  toggleModeText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F766E",
  },

  toggleModeHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },

  dayCard: {
    marginTop: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },

  dayTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  half: {
    flex: 1,
  },

  resultBox: {
    marginTop: 4,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  resultTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 7,
  },

  resultLabel: {
    color: "#475569",
    fontSize: 13,
    flex: 1,
  },

  resultValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },

  separator: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 7,
  },

  totalCostLabel: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },

  totalCostValue: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "800",
  },

  billedLabel: {
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
  },

  billedValue: {
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "800",
  },

  summaryBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#064E3B",
    marginBottom: 10,
  },



  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
});