import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  cancelCateringInvoice,
} from '@/src/services/cateringInvoice.service';

export default function CancelInvoiceScreen() {
  const params = useLocalSearchParams<{ id?: string }>();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCancelInvoice() {
    if (!id) {
      Alert.alert('Erreur', 'Facture invalide');
      return;
    }

    if (reason.trim().length < 3) {
      Alert.alert(
        'Erreur',
        "Veuillez saisir un motif d'annulation"
      );
      return;
    }

    try {
      setLoading(true);

      await cancelCateringInvoice(
        id,
        reason.trim()
      );

      Alert.alert(
        'Succès',
        'Facture annulée',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace(
                '/(traiteur)/invoices'
              );
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        'Erreur',
        e?.message ||
          "Impossible d'annuler la facture"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Annuler la facture
      </Text>

      <Text style={styles.label}>
        Motif d'annulation
      </Text>

      <TextInput
        style={styles.input}
        multiline
        numberOfLines={5}
        placeholder="Exemple : erreur client, doublon, annulation commande..."
        value={reason}
        onChangeText={setReason}
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        disabled={loading}
        onPress={handleCancelInvoice}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Confirmer annulation
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>
          Retour
        </Text>
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
    opacity: 0.7,
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