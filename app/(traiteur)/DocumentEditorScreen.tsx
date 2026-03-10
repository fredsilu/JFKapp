// app/(traiteur)/DocumentEditorScreen.tsx

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
  CateringDocument,
  CateringDocumentItem,
  CateringDocumentType,
} from "@/types/documents";
import { createEmptyDocumentItem } from "@/src/utils/createEmptyDocumentItem";
import { calculateDocumentTotals } from "@/src/utils/calculateDocumentTotals";
import { buildDocumentHTML } from "@/src/services/buildDocumentHTML";
import { generateDocumentPDF } from "@/src/services/generateDocumentPDF";

function createFallbackDocument(type: CateringDocumentType): CateringDocument {
  const items = [
    createEmptyDocumentItem(),
    createEmptyDocumentItem(),
    createEmptyDocumentItem(),
  ];

  const { items: calculatedItems, totals } = calculateDocumentTotals(items);

  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();

  return {
    id: "",
    orderId: "",
    type,
    meta: {
      number: "",
      sequence: 0,
      year,
      createdAt: Date.now(),
      issueDate: today,
      eventDate: today,
      validUntil: type === "proforma" ? today : undefined,
    },
    seller: {
      name: "CREPOLIA",
      addressLine1: "54, Avenue de la Justice",
      addressLine2: "C/Gombe",
      cityCountry: "Kinshasa / RDC",
    },
    client: {
      name: "",
      rccm: "",
      idnat: "",
      addressLine1: "",
      addressLine2: "",
      cityCountry: "Kinshasa / RDC",
    },
    eventName: "",
    guestCount: 0,
    items: calculatedItems,
    totals,
    custom: {
      comments: type === "invoice" ? "Aucun" : undefined,
      introText:
        type === "proforma"
          ? "Vous trouverez ci-dessous pro-forma :"
          : undefined,
      depositPercentage: type === "proforma" ? 70 : undefined,
    },
    assets: {},
    status: "draft",
  };
}

export default function DocumentEditorScreen() {
  const params = useLocalSearchParams<{
    type?: string;
    clientName?: string;
    eventName?: string;
    eventDate?: string;
    guestCount?: string;
  }>();

  const initialDocument = useMemo(() => {
    const type: CateringDocumentType =
      params.type === "invoice" ? "invoice" : "proforma";

    const base = createFallbackDocument(type);

    return {
      ...base,
      client: {
        ...base.client,
        name:
          typeof params.clientName === "string" ? params.clientName : "",
      },
      eventName:
        typeof params.eventName === "string" ? params.eventName : "",
      guestCount:
        typeof params.guestCount === "string"
          ? Number(params.guestCount) || 0
          : 0,
      meta: {
        ...base.meta,
        eventDate:
          typeof params.eventDate === "string"
            ? params.eventDate
            : base.meta.eventDate,
        validUntil:
          type === "proforma"
            ? typeof params.eventDate === "string"
              ? params.eventDate
              : base.meta.validUntil
            : undefined,
      },
    };
  }, [params]);

  const [document, setDocument] = useState<CateringDocument>(initialDocument);

  function updateItem(
    index: number,
    field: keyof CateringDocumentItem,
    value: string
  ) {
    const newItems = [...document.items];
    const numericFields: Array<keyof CateringDocumentItem> = [
      "days",
      "quantity",
      "unitPrice",
    ];

    newItems[index] = {
      ...newItems[index],
      [field]: numericFields.includes(field)
        ? Number(value) || 0
        : value,
    };

    const { items, totals } = calculateDocumentTotals(newItems);

    setDocument((prev) => ({
      ...prev,
      items,
      totals,
    }));
  }

  function addLine() {
    const newItems = [...document.items, createEmptyDocumentItem()];
    const { items, totals } = calculateDocumentTotals(newItems);

    setDocument((prev) => ({
      ...prev,
      items,
      totals,
    }));
  }

  function removeLine(index: number) {
    const newItems = document.items.filter((_, i) => i !== index);
    const { items, totals } = calculateDocumentTotals(newItems);

    setDocument((prev) => ({
      ...prev,
      items,
      totals,
    }));
  }

  async function handleGeneratePDF() {
    try {
      const html = buildDocumentHTML(document);
      const uri = await generateDocumentPDF(html);
      Alert.alert("PDF généré", uri);
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de générer le PDF.");
    }
  }

  function renderItem({
    item,
    index,
  }: {
    item: CateringDocumentItem;
    index: number;
  }) {
    return (
      <View style={styles.row}>
        <TextInput
          style={styles.designation}
          value={item.label}
          placeholder="Désignation"
          onChangeText={(text) => updateItem(index, "label", text)}
        />

        <TextInput
          style={styles.smallInput}
          value={String(item.days)}
          keyboardType="numeric"
          onChangeText={(text) => updateItem(index, "days", text)}
        />

        <TextInput
          style={styles.smallInput}
          value={String(item.quantity)}
          keyboardType="numeric"
          onChangeText={(text) => updateItem(index, "quantity", text)}
        />

        <TextInput
          style={styles.smallInput}
          value={String(item.unitPrice)}
          keyboardType="numeric"
          onChangeText={(text) => updateItem(index, "unitPrice", text)}
        />

        <Text style={styles.total}>{item.totalPrice.toFixed(2)}</Text>

        <TouchableOpacity onPress={() => removeLine(index)}>
          <Text style={styles.delete}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {document.type === "proforma" ? "Proforma" : "Facture"}
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Client</Text>
        <TextInput
          style={styles.input}
          value={document.client.name}
          onChangeText={(text) =>
            setDocument((prev) => ({
              ...prev,
              client: { ...prev.client, name: text },
            }))
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Evénement</Text>
        <TextInput
          style={styles.input}
          value={document.eventName ?? ""}
          onChangeText={(text) =>
            setDocument((prev) => ({
              ...prev,
              eventName: text,
            }))
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date événement</Text>
        <TextInput
          style={styles.input}
          value={document.meta.eventDate}
          onChangeText={(text) =>
            setDocument((prev) => ({
              ...prev,
              meta: {
                ...prev.meta,
                eventDate: text,
              },
            }))
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Nombre de personnes</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(document.guestCount)}
          onChangeText={(text) =>
            setDocument((prev) => ({
              ...prev,
              guestCount: Number(text) || 0,
            }))
          }
        />
      </View>

      <Text style={styles.tableHeader}>Désignation | Jrs | Qté | PU | PT</Text>

      <FlatList
        data={document.items}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        scrollEnabled={false}
      />

      <TouchableOpacity style={styles.addButton} onPress={addLine}>
        <Text style={styles.addText}>+ Ajouter ligne</Text>
      </TouchableOpacity>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Sous-total :</Text>
        <Text style={styles.totalValue}>
          {document.totals.subtotal.toFixed(2)} $
        </Text>
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total :</Text>
        <Text style={styles.totalValue}>
          {document.totals.total.toFixed(2)} $
        </Text>
      </View>

      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGeneratePDF}
      >
        <Text style={styles.generateText}>Générer PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#FFF",
  },
  tableHeader: {
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  designation: {
    flex: 2,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#FFF",
  },
  smallInput: {
    width: 55,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 8,
    padding: 8,
    marginLeft: 5,
    backgroundColor: "#FFF",
    textAlign: "center",
  },
  total: {
    width: 72,
    marginLeft: 6,
    textAlign: "right",
    fontWeight: "600",
  },
  delete: {
    color: "red",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "700",
  },
  addButton: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  addText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  totalLabel: {
    fontWeight: "700",
  },
  totalValue: {
    fontWeight: "700",
  },
  generateButton: {
    marginTop: 24,
    backgroundColor: "#1F3A5F",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  generateText: {
    color: "#FFF",
    fontWeight: "700",
  },
});