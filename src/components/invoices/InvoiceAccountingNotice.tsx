import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  status?: string;
};

export default function InvoiceAccountingNotice({ status }: Props) {
  const isDraft = status === "draft";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Règle comptable importante</Text>

      {isDraft ? (
        <Text style={styles.text}>
          Cette facture est encore en brouillon. Elle peut être modifiée avant
          son émission officielle.
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            Une facture émise ne peut plus être modifiée, supprimée ou
            renumérotée.
          </Text>

          <Text style={styles.text}>
            En cas d’erreur :
          </Text>

          <Text style={styles.bullet}>
            • Si elle n’est pas payée : utiliser “Annule et remplace”.
          </Text>

          <Text style={styles.bullet}>
            • Si elle est déjà payée : créer une facture d’avoir.
          </Text>

          <Text style={styles.text}>
            Toutes les actions sont conservées dans l’historique.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F0C36A",
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7A4E00",
    marginBottom: 8,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    color: "#5C4300",
    marginBottom: 4,
  },
  bullet: {
    fontSize: 13,
    lineHeight: 19,
    color: "#5C4300",
    marginLeft: 6,
    marginBottom: 4,
  },
});