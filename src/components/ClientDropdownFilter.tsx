import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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

  return (
    <View style={styles.wrapper}>
      {/* Champ sélectionné */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setOpen(!open)}
      >
        <Text style={styles.selectorText}>
          {selectedClientName ?? 'Tous les clients'}
        </Text>
        <Text style={styles.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Liste déroulante */}
      {open && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 250 }}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                onSelect(null)
                setOpen(false)
              }}
            >
              <Text style={styles.itemText}>Tous les clients</Text>
            </TouchableOpacity>

            {clients.map(client => (
              <TouchableOpacity
                key={client.id}
                style={styles.item}
                onPress={() => {
                  onSelect(client.name)
                  setOpen(false)
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
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
