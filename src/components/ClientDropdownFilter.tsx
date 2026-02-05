import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';

type Client = {
  id: string;
  name: string;
};

export type ClientFilterValue = 'ALL' | string;

type Props = {
  clients: Client[];

  // ✅ on travaille avec l’ID (plus robuste)
  selectedClientId: ClientFilterValue | null;

  // ✅ retourne 'ALL' ou l'id du client
  onSelect: (clientId: ClientFilterValue) => void;

  // ✅ optionnel : permet à l’écran parent de savoir si la liste est ouverte
  onOpenChange?: (open: boolean) => void;

  // ✅ label optionnel
  labelAll?: string;
};

export default function ClientDropdownFilter({
  clients,
  selectedClientId,
  onSelect,
  onOpenChange,
  labelAll = 'Tous les clients',
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (!selectedClientId) return 'Sélectionner un client';
    if (selectedClientId === 'ALL') return labelAll;
    const found = clients.find((c) => c.id === selectedClientId);
    return found?.name ?? 'Client inconnu';
  }, [selectedClientId, clients, labelAll]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  const close = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.selector}
        onPress={toggle}
        accessibilityRole="button"
      >
        <Text style={styles.selectorText}>{selectedLabel}</Text>
      </TouchableOpacity>

      {open && (
        <View
          style={styles.dropdown}
          {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingVertical: 6 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* ✅ OPTION ALL */}
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                onSelect('ALL');
                close();
              }}
            >
              <Text style={styles.itemText}>{labelAll}</Text>
            </TouchableOpacity>

            {clients.map((client) => (
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

            {clients.length === 0 && (
              <Text style={styles.empty}>Aucun client</Text>
            )}
          </ScrollView>
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
    color: '#111827',
    fontWeight: '600',
  },

  dropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    zIndex: 2000,
    elevation: 12,
    overflow: 'hidden',
  },

  scroll: {
    maxHeight: 260, // ✅ scroll OK sur Android
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
});
