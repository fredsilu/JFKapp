import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  SafeAreaView,
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
  showAllOption?: boolean;
};

export default function ClientDropdownFilter({
  clients,
  selectedClientId,
  onSelect,
  onOpenChange,
  labelAll = 'Tous les clients',
  placeholder = 'Sélectionner un client',
  showAllOption = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = useMemo(() => {
    if (!selectedClientId) return placeholder;
    if (selectedClientId === 'ALL') return labelAll;
    const found = clients.find((c) => c.id === selectedClientId);
    return found?.name ?? 'Client inconnu';
  }, [selectedClientId, clients, labelAll, placeholder]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, query]);

  const openModal = () => {
    setOpen(true);
    onOpenChange?.(true);
  };

  const closeModal = () => {
    setOpen(false);
    setQuery('');
    onOpenChange?.(false);
  };

  const handleSelect = (id: ClientFilterValue) => {
    onSelect(id);
    closeModal();
  };

  return (
    <View>
      <TouchableOpacity style={styles.selector} onPress={openModal}>
        <Text
          numberOfLines={1}
          style={[
            styles.selectorText,
            !selectedClientId && styles.placeholderText,
          ]}
        >
          {selectedLabel}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Sélectionner un client</Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.close}>Fermer</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client…"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />

          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {showAllOption && (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect('ALL')}
              >
                <Text style={styles.itemText}>{labelAll}</Text>
              </TouchableOpacity>
            )}

            {filteredClients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={styles.item}
                onPress={() => handleSelect(client.id)}
              >
                <Text style={styles.itemText}>{client.name}</Text>
              </TouchableOpacity>
            ))}

            {filteredClients.length === 0 && (
              <Text style={styles.empty}>Aucun client trouvé</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },

  placeholderText: {
    color: '#9CA3AF',
  },

  chevron: {
    fontSize: 12,
    color: '#6B7280',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  close: {
    color: '#007AFF',
    fontWeight: '700',
  },

  searchInput: {
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
  },

  list: {
    flex: 1,
  },

  item: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  itemText: {
    fontSize: 15,
    color: '#111827',
  },

  empty: {
    padding: 20,
    textAlign: 'center',
    color: '#9CA3AF',
  },
});