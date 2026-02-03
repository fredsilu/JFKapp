import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Client {
  id: string
  name: string
}

interface Props {
  clients: Client[]
  selectedClientName: string | null
  onSelect: (clientName: string | null) => void
}

export default function ClientFilter({
  clients,
  selectedClientName,
  onSelect,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Tous */}
      <TouchableOpacity onPress={() => onSelect(null)}>
        <Text
          style={[
            styles.item,
            !selectedClientName && styles.active,
          ]}
        >
          Tous
        </Text>
      </TouchableOpacity>

      {/* Liste des clients */}
      {clients.map(client => (
        <TouchableOpacity
          key={client.id}
          onPress={() => onSelect(client.name)}
        >
          <Text
            style={[
              styles.item,
              selectedClientName === client.name && styles.active,
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
