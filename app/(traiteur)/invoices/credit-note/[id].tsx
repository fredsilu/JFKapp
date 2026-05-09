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
  createCreditNote,
} from '@/src/services/creditNote.service';

export default function CreditNoteScreen() {
  const params = useLocalSearchParams<{ id?: string }>();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);

  async function handleCreateCreditNote() {
    if (!id) {
      Alert.alert('Erreur', 'Facture invalide');
      return;
    }

    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert(
        'Erreur',
        'Veuillez saisir un montant valide'
      );
      return;
    }

    if (reason.trim().length < 3) {
      Alert.alert(
        'Erreur',
        'Veuillez saisir un motif'
      );
      return;
    }

    try {
      setLoading(true);

      await createCreditNote(
        id,
        parsedAmount,
        reason.trim()
      );

      Alert.alert(
        'Succès',
        'Avoir créé avec succès',
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
          "Impossible de créer l'avoir"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Créer un avoir
      </Text>

      <Text style={styles.label}>
        Montant de l'avoir
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="0"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>
        Motif
      </Text>

      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={5}
        placeholder="Exemple : réduction exceptionnelle, erreur facturation..."
        value={reason}
        onChangeText={setReason}
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        disabled={loading}
        onPress={handleCreateCreditNote}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Confirmer avoir
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },

  textArea: {
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
    backgroundColor: '#D97706',
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