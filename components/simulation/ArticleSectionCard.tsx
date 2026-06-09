import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";

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

export default function ArticleSectionCard({
    section,
    onUpdate,
}: Props) {
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
                {section.name}
            </Text>

            <TouchableOpacity
                onPress={() =>
                    onUpdate(section.id, "enabled", !section.enabled)
                }
                style={{
                    marginTop: 10,
                    marginBottom: 10,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: section.enabled ? "#111" : "#ddd",
                    alignItems: "center",
                }}
            >
                <Text style={{ color: section.enabled ? "#fff" : "#111" }}>
                    {section.enabled ? "Ligne activée" : "Activer cette ligne"}
                </Text>
            </TouchableOpacity>

            <Text>Libellé</Text>
            <TextInput
                value={section.name}
                onChangeText={(value) =>
                    onUpdate(section.id, "name", value)
                }
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
                value={String(section.numberOfDays ?? 1)}
                onChangeText={(value) =>
                    onUpdate(section.id, "numberOfDays", Number(value) || 1)
                }
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