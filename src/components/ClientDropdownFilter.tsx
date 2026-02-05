import { useState } from 'react';
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

  return (
    <View style={styles.wrapper}>
      {/* Selector */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
      >
        <Text style={styles.selectorText}>
          {selectedClientName ?? 'Sélectionner un client'}
        </Text>
      </TouchableOpacity>

      {/* Dropdown */}
      {open && (
        <View
          style={styles.dropdown}
          // ⚠️ clé : empêche le aria-hidden de casser le focus
          {...(Platform.OS === 'web'
            ? { tabIndex: -1 }
            : {})}
        >
          <ScrollView>
            {clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={styles.item}
                onPress={() => {
                  onSelect(client.name);
                  setOpen(false);
                }}
              >
                <Text>{client.name}</Text>
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
    zIndex: 1000, // 🔥 essentiel
  },

  selector: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },

  selectorText: {
    fontSize: 15,
    color: '#333',
  },

  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    maxHeight: 240,
    zIndex: 2000, // 🔥 passe au-dessus d’Expo Router
    elevation: 10, // Android
  },

  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  empty: {
    padding: 12,
    textAlign: 'center',
    color: '#999',
  },
});
