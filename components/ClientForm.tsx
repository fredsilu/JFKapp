//components/ClientForm.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import ErrorMessage from '@/src/components/ErrorMessage';
import { Client } from '@/types';

interface ClientFormProps {
  client?: Client;
  onClose: () => void;
  onSubmit: (values: Partial<Client>) => void | Promise<void>;
}

export default function ClientForm({
  client,
  onClose,
  onSubmit,
}: ClientFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [rccm, setRccm] = useState('');
  const [idNat, setidNat] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nif, setNif] = useState('');

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setEmail(client.email || '');
      setPhone(client.phone ? String(client.phone) : '');
      setAddress(client.address || '');
      setRccm(client.rccm || '');
      setidNat(client.idNat || '');
      setCity(client.city || '');
      setNotes((client as any).notes || '');
      setProfilePicture(client.profilePicture || '');
      setNif(client.nif || '');
    }
  }, [client]);

  const validateForm = () => {
    if (!name.trim()) {
      setError('Le nom est obligatoire');
      return false;
    }

    if (!phone.trim()) {
      setError('Le téléphone est obligatoire');
      return false;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        setError('Adresse email invalide');
        return false;
      }
    }

    if (profilePicture.trim()) {
      try {
        new URL(profilePicture.trim());
      } catch {
        setError('URL de la photo invalide');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setError(null);

    if (!validateForm()) return;

    const payload: Partial<Client> = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      rccm: rccm.trim(),
      idNat: idNat.trim(),
      city: city.trim(),
      notes: notes.trim(),
      nif: nif.trim(),
      profilePicture: profilePicture.trim(),
    } as Partial<Client>;

    try {
      setSubmitting(true);

      console.log('CLIENT FORM PAYLOAD:', payload);

      await onSubmit(payload);
    } catch (err) {
      console.error('ClientForm submit error:', err);
      Alert.alert(
        'Erreur',
        client
          ? 'Impossible de modifier le client.'
          : 'Impossible de créer le client.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {client ? 'Modifier le client' : 'Nouveau client'}
        </Text>

        <TouchableOpacity onPress={onClose} disabled={submitting}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <ErrorMessage message={error} />
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.formField}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nom du client"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="client@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Téléphone *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+243..."
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Adresse du client"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Kinshasa"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>RCCM</Text>
            <Text style={styles.helperText}>
              Registre de Commerce et du Crédit Mobilier.
              Exemple : CD/KIN/RCCM/24-B-1234
            </Text>
            <TextInput
              style={styles.input}
              value={rccm}
              onChangeText={setRccm}
              placeholder="CD/KIN/RCCM/..."
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>idNat</Text>
            <Text style={styles.helperText}>
              Numéro d’identification nationale de l’entreprise.
              Exemple : 01-83-N12345P
            </Text>
            <TextInput
              style={styles.input}
              value={idNat}
              onChangeText={setidNat}
              placeholder="ID.NAT..."
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>NIF</Text>

            <Text style={styles.helperText}>
              Numéro d’Identification Fiscale attribué par la DGI.
              Exemple : A0700001X
            </Text>

            <TextInput
              style={styles.input}
              value={nif}
              onChangeText={setNif}
              placeholder="A0700001X"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>URL photo de profil</Text>
            <TextInput
              style={styles.input}
              value={profilePicture}
              onChangeText={setProfilePicture}
              placeholder="https://..."
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes complémentaires..."
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {client ? 'Mettre à jour' : 'Ajouter'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    zIndex: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
  },

  errorContainer: {
    marginBottom: 20,
  },

  form: {
    gap: 20,
  },

  formField: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  input: {
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    color: '#1a1a1a',
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
    backgroundColor: '#fff',
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },

  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});