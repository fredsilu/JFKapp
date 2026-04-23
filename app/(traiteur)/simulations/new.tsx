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

import ClientDropdownFilter, { ClientFilterValue } from '@/src/components/ClientDropdownFilter';
import { fetchClients } from '@/src/services/clientService';

type Client = { id: string; name: string };

export default function CateringNewSimulation() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<ClientFilterValue | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const selectedClient = useMemo(() => {
    if (!selectedClientId || selectedClientId === 'ALL') return null;
    return clients.find(c => c.id === selectedClientId) || null;
  }, [selectedClientId, clients]);

  useEffect(() => {
    const loadClients = async () => {
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
    };
    loadClients();
  }, []);

  const handleStart = () => {
    if (!selectedClient) {
      Alert.alert('Client requis', 'Veuillez sélectionner un client.');
      return;
    }

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
              // On interdit ALL sur cet écran
              if (id === 'ALL') return;
              setSelectedClientId(id);
            }}
            onOpenChange={setDropdownOpen}
            labelAll="Tous les clients"
          />
        )}
      </View>

      {/* ✅ BUG 4 FIX : si dropdown ouvert, on masque le bouton */}
      {!dropdownOpen && (
        <TouchableOpacity
          style={[styles.button, !selectedClient && { opacity: 0.5 }]}
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
  container: { flex: 1, padding: 16, backgroundColor: '#F4F6F8' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },

  label: { fontSize: 13, color: '#555', marginBottom: 8 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: '#666' },

  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
