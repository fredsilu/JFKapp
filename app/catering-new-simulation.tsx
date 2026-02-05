import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import ClientDropdownFilter from '@/src/components/ClientDropdownFilter';
import { fetchClients } from '@/src/services/clientService';

type Client = {
  id: string;
  name: string;
};

export default function CateringNewSimulation() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * =========================
   * LOAD CLIENTS
   * =========================
   */
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const data = await fetchClients();

        // Sécurité : on vérifie la structure
        if (!Array.isArray(data)) {
          throw new Error('Clients invalides');
        }

        setClients(data);
      } catch (error) {
        console.error('❌ fetchClients error:', error);
        Alert.alert(
          'Erreur',
          'Impossible de charger la liste des clients.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  /**
   * =========================
   * START SIMULATION
   * =========================
   */
  const handleStartSimulation = () => {
    if (!selectedClient) {
      Alert.alert(
        'Client requis',
        'Veuillez sélectionner un client.'
      );
      return;
    }

    // On passe UNIQUEMENT les infos nécessaires
    router.push({
      pathname: '/catering-calculator',
      params: {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouvelle simulation</Text>

      {/* CLIENT SELECTION */}
      <View style={styles.card}>
        <Text style={styles.label}>Client</Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Chargement…</Text>
          </View>
        ) : (
          <ClientDropdownFilter
            clients={clients}
            selectedClientName={selectedClient?.name ?? null}
            onSelect={(clientName) => {
              const found =
                clients.find((c) => c.name === clientName) ||
                null;
              setSelectedClient(found);
            }}
          />
        )}
      </View>

      {/* ACTION */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!selectedClient || loading) && { opacity: 0.5 },
        ]}
        disabled={!selectedClient || loading}
        onPress={handleStartSimulation}
      >
        <Text style={styles.primaryButtonText}>
          Commencer la simulation
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * =========================
 * STYLES
 * =========================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F6F8',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  loadingText: {
    color: '#666',
  },

  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
