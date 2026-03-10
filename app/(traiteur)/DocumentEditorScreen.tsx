import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

import {
  CateringDocument,
  CateringDocumentItem,
} from "@/types/documents";

import { createEmptyDocumentItem } from "@/src/utils/createEmptyDocumentItem";
import { calculateDocumentTotals } from "@/src/utils/calculateDocumentTotals";

interface Props {
  initialDocument: CateringDocument;
}

export default function DocumentEditorScreen({ initialDocument }: Props) {
  const [document, setDocument] = useState<CateringDocument>(initialDocument);

  function updateItem(
    index: number,
    field: keyof CateringDocumentItem,
    value: string
  ) {
    const newItems = [...document.items];

    const numericFields = ["days", "quantity", "unitPrice"];

    newItems[index] = {
      ...newItems[index],
      [field]: numericFields.includes(field)
        ? Number(value)
        : value,
    };

    const { items, totals } = calculateDocumentTotals(newItems);

    setDocument({
      ...document,
      items,
      totals,
    });
  }

  function addLine() {
    const newItems = [...document.items, createEmptyDocumentItem()];

    const { items, totals } = calculateDocumentTotals(newItems);

    setDocument({
      ...document,
      items,
      totals,
    });
  }

  function removeLine(index: number) {
    const newItems = document.items.filter((_, i) => i !== index);

    const { items, totals } = calculateDocumentTotals(newItems);

    setDocument({
      ...document,
      items,
      totals,
    });
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
          placeholder="Designation"
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

        <Text style={styles.total}>
          {item.totalPrice.toFixed(2)}
        </Text>

        <TouchableOpacity onPress={() => removeLine(index)}>
          <Text style={styles.delete}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {document.type === "proforma" ? "Proforma" : "Facture"}
      </Text>

      <View style={styles.section}>
        <Text>Evénement</Text>

        <TextInput
          style={styles.input}
          value={document.eventName}
          onChangeText={(text) =>
            setDocument({
              ...document,
              eventName: text,
            })
          }
        />
      </View>

      <View style={styles.section}>
        <Text>Nombre de personnes</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(document.guestCount)}
          onChangeText={(text) =>
            setDocument({
              ...document,
              guestCount: Number(text),
            })
          }
        />
      </View>

      <Text style={styles.tableHeader}>
        Designation | Jrs | Qté | PU | PT
      </Text>

      <FlatList
        data={document.items}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
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

      <TouchableOpacity style={styles.generateButton}>
        <Text style={styles.generateText}>
          Générer PDF
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  section: { marginBottom: 15 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
  },

  tableHeader: {
    fontWeight: "bold",
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
    borderColor: "#ccc",
    padding: 5,
  },

  smallInput: {
    width: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 5,
    marginLeft: 5,
  },

  total: {
    width: 70,
    marginLeft: 5,
  },

  delete: {
    color: "red",
    marginLeft: 10,
  },

  addButton: {
    marginTop: 15,
  },

  addText: {
    color: "#007AFF",
  },

  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  totalLabel: {
    fontWeight: "bold",
  },

  totalValue: {
    fontWeight: "bold",
  },

  generateButton: {
    marginTop: 25,
    backgroundColor: "#2c3e50",
    padding: 12,
    alignItems: "center",
  },

  generateText: {
    color: "white",
    fontWeight: "bold",
  },
});