import React, { useEffect, useState } from 'react'
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { fetchClients } from '@/src/services/clientService'
import { Client } from '@/types'


interface Props {
  value?: Client | null
  onSelect: (client: Client) => void
}

export default function ClientSelect({ value, onSelect }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchClients().then(setClients)
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.phone?.includes(query)
  )

  return (
    <View>
      <TextInput
        placeholder="Client (nom ou téléphone)"
        value={value ? `${value.name}` : query}
        onChangeText={text => {
          setQuery(text)
        }}
        style={styles.input}
      />

      {query.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                onSelect(item)
                setQuery('')
              }}
            >
              <Text style={styles.item}>
                {item.name}
                {item.phone ? ` • ${item.phone}` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  list: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
})
