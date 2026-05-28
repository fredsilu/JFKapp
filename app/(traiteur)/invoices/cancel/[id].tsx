// app/(traiteur)/invoices/cancel/[id].tsx
import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { cancelCateringInvoice } from '@/src/services/cateringInvoice.service';

export default function CancelInvoiceScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanReason = useMemo(() => reason.trim(), [reason]);
  const canSubmit = !!id && cleanReason.length >= 3 && !loading;

  async function cancelInvoiceConfirmed() {
    if (!id) {
      Alert.alert('Erreur', 'Facture invalide');
      return;
    }

    try {
      setLoading(true);

      await cancelCateringInvoice(id, cleanReason);

      Alert.alert('Succès', 'Facture annulée avec succès.', [
        {
          text: 'OK',
          onPress: () => {
            router.replace({
              pathname: '/(traiteur)/invoices/[id]',
              params: { id },
            });
          },
        },
      ]);
    } catch (e: any) {
      console.error('❌ cancel invoice error:', e);

      Alert.alert(
        'Erreur',
        e?.message || "Impossible d'annuler la facture."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCancelInvoice() {
    if (!id) {
      Alert.alert('Erreur', 'Facture invalide');
      return;
    }

    if (cleanReason.length < 3) {
      Alert.alert('Erreur', "Veuillez saisir un motif d'annulation.");
      return;
    }

    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment annuler cette facture ? Cette action ne doit être faite que pour une raison valable.',
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: cancelInvoiceConfirmed,
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Annuler la facture</Text>

      <Text style={styles.warningText}>
        Cette action va marquer la facture comme annulée. Le motif sera conservé dans l’historique.
      </Text>

      <Text style={styles.label}>Motif d'annulation</Text>

      <TextInput
        style={styles.input}
        multiline
        numberOfLines={5}
        placeholder="Exemple : erreur client, doublon, annulation commande..."
        placeholderTextColor="#9CA3AF"
        value={reason}
        onChangeText={setReason}
        maxLength={250}
        editable={!loading}
      />

      <Text style={styles.counter}>{cleanReason.length}/250 caractères</Text>

      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.disabledButton]}
        disabled={!canSubmit}
        onPress={handleCancelInvoice}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirmer annulation</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    padding: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12,
  },

  warningText: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#374151',
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: '#111827',
  },

  counter: {
    textAlign: 'right',
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#DC2626',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },

  disabledButton: {
    opacity: 0.5,
  },

  backButton: {
    marginTop: 12,
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  backButtonText: {
    color: '#111827',
    fontWeight: '800',
  },
});