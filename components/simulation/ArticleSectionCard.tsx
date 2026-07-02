//components/simulation/ArticleSectionCard.tsx
import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

import { CateringSection } from "@/types/catering";
import { formatCurrency } from "@/src/utils/costs";

type Props = {
  section: CateringSection;
  onUpdate: (
    sectionId: string,
    field: keyof CateringSection,
    value: any
  ) => void;
};

export default function ArticleSectionCard({ section, onUpdate }: Props) {
  const billingMode = section.billingMode ?? "perDay";

  return (
    <View
      style={{
        padding: 14,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        marginBottom: 12,
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "700" }}>
        {section.name || "Rubrique"}
      </Text>

      <Text style={{ marginTop: 10 }}>Libellé</Text>
      <TextInput
        value={section.name}
        onChangeText={(value) => onUpdate(section.id, "name", value)}
        style={inputStyle}
      />

      <Text>Mode de facturation</Text>

      <View style={modeRowStyle}>
        <TouchableOpacity
          style={[
            modeButtonStyle,
            billingMode === "fixed" && modeButtonActiveStyle,
          ]}
          onPress={() => onUpdate(section.id, "billingMode", "fixed")}
        >
          <Text
            style={[
              modeButtonTextStyle,
              billingMode === "fixed" && modeButtonTextActiveStyle,
            ]}
          >
            Une seule fois
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            modeButtonStyle,
            billingMode === "perDay" && modeButtonActiveStyle,
          ]}
          onPress={() => onUpdate(section.id, "billingMode", "perDay")}
        >
          <Text
            style={[
              modeButtonTextStyle,
              billingMode === "perDay" && modeButtonTextActiveStyle,
            ]}
          >
            Par jour
          </Text>
        </TouchableOpacity>
      </View>

      <Text>Nombre de personnes</Text>
      <TextInput
        value={String(section.quantity ?? 0)}
        onChangeText={(value) =>
          onUpdate(section.id, "quantity", Number(value) || 0)
        }
       keyboardType="numeric"
        style={inputStyle}
      />

      <Text>Prix unitaire</Text>
      <TextInput
        value={String(section.unitPrice ?? 0)}
        onChangeText={(value) =>
          onUpdate(section.id, "unitPrice", Number(value) || 0)
        }
         keyboardType="numbers-and-punctuation"
        style={inputStyle}
      />

      {billingMode === "perDay" ? (
        <>
          <Text>Nombre de jours</Text>
          <TextInput
            value={String(section.numberOfDays ?? "")}
            onChangeText={(value) => {
              const cleanValue = value.replace(/[^0-9]/g, "");

              onUpdate(
                section.id,
                "numberOfDays",
                cleanValue === "" ? "" : Number(cleanValue)
              );
            }}
            onBlur={() => {
              if (!section.numberOfDays || Number(section.numberOfDays) < 1) {
                onUpdate(section.id, "numberOfDays", 1);
              }
            }}
            keyboardType="numeric"
            style={inputStyle}
          />
        </>
      ) : (
        <Text style={{ marginBottom: 8, color: "#6B7280", fontSize: 12 }}>
          Cette ligne sera calculée sans multiplier par le nombre de jours.
        </Text>
      )}

      <Text>Taux coût matière (%)</Text>
      <TextInput
        value={String(section.costRate ?? 0)}
        onChangeText={(value) =>
          onUpdate(section.id, "costRate", Number(value) || 0)
        }
        keyboardType="numeric"
        style={inputStyle}
      />

      <View
        style={{
          marginTop: 10,
          padding: 10,
          borderRadius: 8,
          backgroundColor: "#F3F4F6",
        }}
      >
        <Text>
          Mode : {billingMode === "fixed" ? "Une seule fois" : "Par jour"}
        </Text>
        <Text>CA : {formatCurrency(section.total ?? 0)}</Text>
        <Text>Coût : {formatCurrency(section.costAmount ?? 0)}</Text>
        <Text>Marge : {formatCurrency(section.margin ?? 0)}</Text>
      </View>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ccc",
  padding: 10,
  marginTop: 4,
  marginBottom: 8,
  borderRadius: 8,
};

const modeRowStyle = {
  flexDirection: "row" as const,
  gap: 8,
  marginTop: 6,
  marginBottom: 10,
};

const modeButtonStyle = {
  flex: 1,
  paddingVertical: 10,
  paddingHorizontal: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#D1D5DB",
  backgroundColor: "#F9FAFB",
  alignItems: "center" as const,
};

const modeButtonActiveStyle = {
  backgroundColor: "#007AFF",
  borderColor: "#007AFF",
};

const modeButtonTextStyle = {
  color: "#374151",
  fontWeight: "700" as const,
  fontSize: 13,
};

const modeButtonTextActiveStyle = {
  color: "#fff",
};