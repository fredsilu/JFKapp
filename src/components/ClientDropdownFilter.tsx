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

export type ClientFilterValue = 'ALL' | string;

type Props = {
  clients: Client[];
  selectedClientId: ClientFilterValue | null;
  onSelect: (clientId: ClientFilterValue) => void;
  onOpenChange?: (open: boolean) => void;
  labelAll?: string;
  placeholder?: string;
};

export default function ClientDropdownFilter({
  clients,
  selectedClientId,
  onSelect,
  onOpenChange,
  labelAll = 'Tous les clients',
  placeholder = 'Sélectionner un client',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  const close = () => {
    setOpen(false);
    onOpenChange?.(false);
    setQuery('');
  };

  const selectedLabel = useMemo(() => {
    if (!selectedClientId) return placeholder;
    if (selectedClientId === 'ALL') return labelAll;
    const found = clients.find(c => c.id === selectedClientId);
    return found?.name ?? 'Client inconnu';
  }, [selectedClientId, clients, labelAll, placeholder]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(q)
    );
  }, [clients, query]);

  return (
    <View style={styles.wrapper}>
      {/* SELECTOR */}
      <TouchableOpacity
        style={styles.selector}
        onPress={toggle}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.selectorText,
            !selectedClientId && styles.placeholderText,
          ]}
        >
          {selectedLabel}
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
            value={query}
            onChangeText={setQuery}
            autoFocus
          />

          {/* LIST */}
          <View style={styles.listWrapper}>
  <ScrollView
    nestedScrollEnabled
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator
  >
    {/* ALL */}
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onSelect('ALL');
        close();
      }}
    >
      <Text style={styles.itemText}>{labelAll}</Text>
    </TouchableOpacity>

    {filteredClients.map(client => (
      <TouchableOpacity
        key={client.id}
        style={styles.item}
        onPress={() => {
          onSelect(client.id);
          close();
        }}
      >
        <Text style={styles.itemText}>{client.name}</Text>
      </TouchableOpacity>
    ))}

    {filteredClients.length === 0 && (
      <Text style={styles.empty}>Aucun client trouvé</Text>
    )}
  </ScrollView>
</View>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1000,
  },

  selector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },

  selectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  placeholderText: {
    color: '#9CA3AF',
  },

  dropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    zIndex: 2000,
    elevation: 12,
    overflow: 'hidden',
  },

  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },

  scroll: {
    maxHeight: 260, // ✅ SCROLL GARANTI
  },

  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  itemText: {
    fontSize: 14,
    color: '#111827',
  },

  empty: {
    padding: 12,
    textAlign: 'center',
    color: '#9CA3AF',
  },
  listWrapper: {
  maxHeight: 300,
  overflow: 'hidden',
},

});
