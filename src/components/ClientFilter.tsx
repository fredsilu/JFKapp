import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Client } from '@/src/services/clientService'

interface Props {
  clients: Client[]
  selectedClientId: string | null
  onSelect: (clientId: string | null) => void
}

export default function ClientFilter({
  clients,
  selectedClientId,
  onSelect,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onSelect(null)}>
        <Text
          style={[
            styles.item,
            !selectedClientId && styles.active,
          ]}
        >
          Tous
        </Text>
      </TouchableOpacity>

      {clients.map(client => (
        <TouchableOpacity
          key={client.id}
          onPress={() => onSelect(client.id)}
        >
          <Text
            style={[
              styles.item,
              selectedClientId === client.id && styles.active,
            ]}
          >
            {client.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  item: {
    marginRight: 12,
    marginBottom: 8,
    color: '#555',
  },
  active: {
    fontWeight: '600',
    color: '#007AFF',
  },
})
