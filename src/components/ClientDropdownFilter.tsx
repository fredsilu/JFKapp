import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';

type Client = {
  id: string;
  name: string;
};

type Props = {
  clients: Client[];
  selectedClientName: string | null;
  onSelect: (name: string) => void;
};

export default function ClientDropdownFilter({
  clients,
  selectedClientName,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    return clients.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  return (
    <View style={styles.wrapper}>
      {/* SELECTOR */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
      >
        <Text style={styles.selectorText}>
          {selectedClientName ?? 'Sélectionner un client'}
        </Text>
      </TouchableOpacity>

      {/* DROPDOWN */}
      {open && (
        <View
          style={styles.dropdown}
          {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
        >
          {/* SEARCH */}
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client…"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 240 }}
          >
            {filteredClients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={styles.item}
                onPress={() => {
                  onSelect(client.name);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <Text style={styles.itemText}>{client.name}</Text>
              </TouchableOpacity>
            ))}

            {filteredClients.length === 0 && (
              <Text style={styles.empty}>
                Aucun client trouvé
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1000,
  },

  selector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },

  selectorText: {
    fontSize: 15,
    color: '#111827',
  },

  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    zIndex: 2000,
    elevation: 10,
    paddingBottom: 6,
  },

  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontSize: 14,
  },

  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  itemText: {
    fontSize: 14,
    color: '#111827',
  },

  empty: {
    padding: 14,
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
