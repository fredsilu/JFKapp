//app/(traiteur)/config/help.tsx

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function AccountingRulesScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Aide & règles comptables
      </Text>

      <Text style={styles.subtitle}>
        Cette section explique les règles importantes utilisées dans JFKApp
        pour la gestion des proformas, commandes, factures et avoirs.
      </Text>

      {/* FACTURE EMISE */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Facture émise
        </Text>

        <Text style={styles.cardText}>
          Une facture émise devient une pièce comptable officielle.
          Elle est verrouillée et ne doit plus être modifiée directement.
        </Text>
      </View>

      {/* ANNULATION */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Annulation de facture
        </Text>

        <Text style={styles.cardText}>
          Une facture annulée reste conservée dans l’historique.
          L’annulation ne supprime jamais la facture originale.
        </Text>
      </View>

      {/* ANNULER ET REMPLACER */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Annule et remplace
        </Text>

        <Text style={styles.cardText}>
          Cette opération crée une nouvelle facture corrigée avec un nouveau
          numéro. L’ancienne facture reste archivée avec le statut remplacé.
        </Text>
      </View>

      {/* AVOIR */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Facture d’avoir
        </Text>

        <Text style={styles.cardText}>
          Un avoir permet de réduire partiellement ou totalement une facture.
          Il ne supprime jamais la facture initiale.
        </Text>
      </View>

      {/* HISTORIQUE */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Historique
        </Text>

        <Text style={styles.cardText}>
          Toutes les opérations importantes sont enregistrées :
          émission, annulation, remplacement et création d’avoir.
        </Text>
      </View>

      {/* NUMEROTATION */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Numérotation
        </Text>

        <Text style={styles.cardText}>
          Les numéros de factures sont uniques et ne sont jamais réutilisés,
          même après annulation.
        </Text>
      </View>

      {/* V1 */}

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>
          JFKApp V1
        </Text>

        <Text style={styles.noticeText}>
          Cette première version met en place les règles essentielles de
          gestion commerciale et comptable pour les opérations de Crepolia.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4B5563",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },

  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
  },

  notice: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#93C5FD",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },

  noticeTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1D4ED8",
    marginBottom: 6,
  },

  noticeText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#1E40AF",
  },
});