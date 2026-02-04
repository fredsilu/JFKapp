import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

import ClientDropdownFilter from '@/src/components/ClientDropdownFilter';
import { fetchClients } from '@/src/services/clientService';

export default function CateringNewSimulation() {
  const router = useRouter();

  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientName, setSelectedClientName] =
    useState<string | null>(null);

  useState(() => {
    fetchClients().then(setClients);
  });

  const handleStart = () => {
    if (!selectedClientName) return;

    router.push({
      pathname: '/catering-calculator',
      params: { clientId: selectedClientName },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouvelle simulation traiteur</Text>

      <ClientDropdownFilter
        clients={clients}
        selectedClientName={selectedClientName}
        onSelect={setSelectedClientName}
      />

      <TouchableOpacity
        style={[
          styles.button,
          !selectedClientName && { opacity: 0.5 },
        ]}
        disabled={!selectedClientName}
        onPress={handleStart}
      >
        <Text style={styles.buttonText}>
          Commencer la simulation
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
  button: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
