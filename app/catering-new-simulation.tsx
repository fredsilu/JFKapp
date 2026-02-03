import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'

import ClientDropdownFilter from '@/src/components/ClientDropdownFilter'
import { fetchClients } from '@/src/services/clientService'

export default function CateringNewSimulationScreen() {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [clientName, setClientName] = useState<string | null>(null)

  React.useEffect(() => {
    fetchClients().then(setClients)
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouvelle simulation</Text>

      <ClientDropdownFilter
        clients={clients}
        selectedClientName={clientName}
        onSelect={setClientName}
      />

      <TouchableOpacity
        style={[styles.button, !clientName && styles.disabled]}
        disabled={!clientName}
        onPress={() =>
          router.push({
            pathname: '/catering-calculator',
            params: { clientName },
          })
        }
      >
        <Text style={styles.buttonText}>Commencer la simulation</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  disabled: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
