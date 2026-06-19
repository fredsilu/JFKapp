import React from "react";
import { View, Text, TextInput } from "react-native";

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
        keyboardType="numeric"
        style={inputStyle}
      />

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