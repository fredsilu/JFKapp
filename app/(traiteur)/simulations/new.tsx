//app/(traiteur)/simulations/new.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import ClientDropdownFilter, {
  ClientFilterValue,
} from '@/src/components/ClientDropdownFilter';
import { fetchClients } from '@/src/services/clientService';

type Client = {
  id: string;
  name: string;
};

export default function CateringNewSimulation() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] =
    useState<ClientFilterValue | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedClient = useMemo(() => {
    if (!selectedClientId || selectedClientId === 'ALL') return null;

    return clients.find((client) => client.id === selectedClientId) || null;
  }, [selectedClientId, clients]);

  useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true);

        const data = await fetchClients();
        setClients(data);
      } catch (e) {
        console.error('❌ fetchClients:', e);
        Alert.alert('Erreur', 'Impossible de charger les clients');
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, []);

  function handleStart() {
    if (!selectedClient) {
      Alert.alert('Client requis', 'Veuillez sélectionner un client.');
      return;
    }

    router.push({
      pathname: '/tools/calculator-v2',
      params: {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
      },
    } as any);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouvelle simulation</Text>

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
            selectedClientId={selectedClientId}
            onSelect={(id) => {
              if (id === 'ALL') return;
              setSelectedClientId(id);
            }}
            onOpenChange={setDropdownOpen}
            placeholder="Sélectionner un client"
            showAllOption={false}
          />
        )}
      </View>

      {!dropdownOpen && (
        <TouchableOpacity
          style={[styles.button, !selectedClient && styles.buttonDisabled]}
          disabled={!selectedClient}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>Commencer la simulation</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F6F8',
    overflow: 'visible',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
  },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    zIndex: 10,
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

  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});