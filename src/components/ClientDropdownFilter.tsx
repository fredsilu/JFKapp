import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native'

interface Client {
  id: string
  name: string
}

interface Props {
  clients: Client[]
  selectedClientName: string | null
  onSelect: (clientName: string | null) => void
}

export default function ClientDropdownFilter({
  clients,
  selectedClientName,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredClients = useMemo(() => {
    if (!search) return clients
    return clients.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [clients, search])

  return (
    <View style={styles.wrapper}>
      {/* Sélecteur */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setOpen(!open)}
      >
        <Text style={styles.selectorText}>
          {selectedClientName ?? 'Tous les clients'}
        </Text>
        <Text style={styles.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {/* Recherche */}
          <TextInput
            placeholder="Rechercher un client…"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />

          <ScrollView style={{ maxHeight: 260 }}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                onSelect(null)
                setOpen(false)
                setSearch('')
              }}
            >
              <Text style={styles.itemText}>Tous les clients</Text>
            </TouchableOpacity>

            {filteredClients.map(client => (
              <TouchableOpacity
                key={client.id}
                style={styles.item}
                onPress={() => {
                  onSelect(client.name)
                  setOpen(false)
                  setSearch('')
                }}
              >
                <Text style={styles.itemText}>{client.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    zIndex: 10,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f4f8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  arrow: {
    fontSize: 12,
    color: '#555',
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  search: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
})
