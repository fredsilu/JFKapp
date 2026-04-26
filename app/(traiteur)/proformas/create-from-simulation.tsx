import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  collection,
  getDocs,

} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { getCateringSimulations } from '@/src/services/cateringSimulation.service';
import {
  createCateringProforma,
  CateringProformaMenuItem,
} from '@/src/services/cateringProforma.service';
import { fetchClients } from '@/src/services/clientService';
import { formatCurrency } from '@/src/utils/costs';
import { Picker } from '@react-native-picker/picker';

type CateringDish = {
  id: string;
  name: string;
  category?: string;
  notes?: string;
  isDeleted?: boolean;
};

async function fetchCateringDishes(): Promise<CateringDish[]> {
  const snap = await getDocs(collection(db, 'dishes'));

  return snap.docs
    .map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CateringDish, 'id'>),
    }))
    .filter((dish) => dish.name && dish.isDeleted !== true)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export default function CreateProformaFromSimulationScreen() {
  const params = useLocalSearchParams<{ simulationId?: string }>();
  const simulationId = Array.isArray(params.simulationId)
    ? params.simulationId[0]
    : params.simulationId;

  const [simulation, setSimulation] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [dishes, setDishes] = useState<CateringDish[]>([]);
  const [selectedDishId, setSelectedDishId] = useState<string>('');
  const [selectedMenu, setSelectedMenu] = useState<CateringProformaMenuItem[]>([]);
  const [menuNotesByDishId, setMenuNotesByDishId] = useState<Record<string, string>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [sims, clients, dishesData] = await Promise.all([
          getCateringSimulations(),
          fetchClients(),
          fetchCateringDishes(),
        ]);

        const foundSimulation = sims.find((s) => s.id === simulationId);

        if (!foundSimulation) {
          setSimulation(null);
          return;
        }

        const foundClient = clients.find(
          (c: any) => c.id === foundSimulation.clientId
        );

        setSimulation(foundSimulation);
        setClient(foundClient || null);
        setDishes(dishesData);
        setSelectedMenu([]);
        setMenuNotesByDishId({});


      } catch (e) {
        console.error('❌ load simulation proforma error:', e);
        Alert.alert('Erreur', 'Impossible de charger la simulation');
      } finally {
        setLoading(false);
      }
    }

    if (simulationId) {
      load();
    } else {
      setLoading(false);
    }
  }, [simulationId]);

  const items = useMemo(() => {
    if (!simulation) return [];

    const result: any[] = [];

    const map = [
      { key: 'breakfast', label: 'Petit-déjeuner' },
      { key: 'lunch', label: 'Déjeuner' },
      { key: 'dinner', label: 'Dîner' },
      { key: 'drinks', label: 'Boissons' },
      { key: 'service', label: 'Service traiteur' },
    ];

    map.forEach(({ key, label }) => {
      const item = simulation[key];

      if (item?.enabled) {
        const numberOfPeople = Number(item.numberOfPeople || 0);
        const numberOfDays = Number(item.numberOfDays || 1);
        const unitPrice = Number(item.unitPrice || 0);

        let quantity = numberOfPeople * numberOfDays;

        if (key === 'service') {
          quantity = Number(item.quantity || 1);
        }

        const total = quantity * unitPrice;

        if (quantity > 0 && unitPrice > 0) {
          result.push({
            label,
            quantity,
            unitPrice,
            total,
          });
        }
      }
    });

    return result;
  }, [simulation]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }, [items]);

  function getClientName() {
    return client?.name || client?.clientName || simulation?.clientName || 'Client';
  }

  function getClientRccm() {
    return client?.rccm || '';
  }

  function getClientIdnat() {
    return client?.idnat || '';
  }

  function getClientAddress() {
    return client?.address || simulation?.clientAddress || '';
  }

  function getClientCity() {
    return client?.city || simulation?.clientCity || '';
  }

  function getEventDate() {
    return simulation?.dateLivraison || simulation?.eventDate || '';
  }

  function getValidityDate() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }

  function isDishSelected(dishId: string) {
    return selectedMenu.some((item) => item.dishId === dishId);
  }

  function toggleDish(dish: CateringDish) {
    const selected = isDishSelected(dish.id);

    if (selected) {
      setSelectedMenu((prev) => prev.filter((item) => item.dishId !== dish.id));
      return;
    }

    setSelectedMenu((prev) => [
      ...prev,
      {
        dishId: dish.id,
        name: dish.name,
        category: dish.category || '',
        notes: menuNotesByDishId[dish.id] || dish.notes || '',
      },
    ]);
  }

  function updateDishNote(dishId: string, notes: string) {
    setMenuNotesByDishId((prev) => ({
      ...prev,
      [dishId]: notes,
    }));

    setSelectedMenu((prev) =>
      prev.map((item) =>
        item.dishId === dishId
          ? {
            ...item,
            notes,
          }
          : item
      )
    );
  }

  async function handleCreate() {
    if (!simulation) return;

    if (items.length === 0) {
      Alert.alert(
        'Erreur',
        'Impossible de créer une proforma sans lignes commerciales.'
      );
      return;
    }

    if (selectedMenu.length === 0) {
      Alert.alert(
        'Menu requis',
        'Veuillez sélectionner au moins un plat pour le menu de la proforma.'
      );
      return;
    }

    try {
      setSaving(true);

      const proformaId = await createCateringProforma({
        simulationId: simulation.id,
        clientId: simulation.clientId,
        clientName: getClientName(),
        clientRccm: getClientRccm(),
        clientIdnat: getClientIdnat(),
        clientAddress: getClientAddress(),
        clientCity: getClientCity(),

        issueDate: new Date().toISOString().slice(0, 10),
        validityDate: getValidityDate(),
        eventDate: getEventDate(),

        status: 'draft',

        items,
        menu: selectedMenu,

        totals: {
          subtotal,
          total: subtotal,
          currency: 'USD',
        },
      });

      Alert.alert('Succès', 'Proforma créée avec succès');

      router.replace({
        pathname: '/(traiteur)/proformas/[id]',
        params: { id: proformaId },
      });
    } catch (e: any) {
      console.error('❌ create proforma error:', e);
      Alert.alert('Erreur', e?.message || 'Impossible de créer la proforma');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!simulation) {
    return (
      <View style={styles.center}>
        <Text>Simulation introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer une proforma</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Simulation</Text>
        <Text style={styles.line}>{simulation.name || 'Simulation sans nom'}</Text>
        <Text style={styles.line}>Client : {getClientName()}</Text>
        <Text style={styles.line}>Date événement : {getEventDate() || '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lignes proforma</Text>

        {items.map((item, index) => (
          <View key={`${item.label}-${index}`} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemSub}>
                Qté : {item.quantity} × {formatCurrency(item.unitPrice)}
              </Text>
            </View>

            <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total proforma</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Menu des plats</Text>

        <Text style={styles.helperText}>
          Ajoute les plats à inclure dans la proforma.
        </Text>

        {/* Dropdown */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedDishId}
            onValueChange={(value) => setSelectedDishId(value)}
          >
            <Picker.Item label="Sélectionner un plat..." value="" />

            {dishes.map((dish) => (
              <Picker.Item
                key={dish.id}
                label={dish.name}
                value={dish.id}
              />
            ))}
          </Picker>
        </View>

        {/* Bouton ajouter */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            const dish = dishes.find((d) => d.id === selectedDishId);

            if (!dish) return;

            if (selectedMenu.some((m) => m.dishId === dish.id)) {
              Alert.alert('Déjà ajouté', 'Ce plat est déjà dans le menu.');
              return;
            }

            setSelectedMenu((prev) => [
              ...prev,
              {
                dishId: dish.id,
                name: dish.name,
                category: dish.category || '',
                notes: '',
              },
            ]);

            setSelectedDishId('');
          }}
        >
          <Text style={styles.addButtonText}>Ajouter le plat</Text>
        </TouchableOpacity>

        {/* Liste des plats sélectionnés */}
        {selectedMenu.map((item) => (
          <View key={item.dishId} style={styles.selectedDish}>
            <Text style={styles.dishName}>{item.name}</Text>

            <TextInput
              placeholder="Note..."
              value={item.notes}
              onChangeText={(text) => updateDishNote(item.dishId, text)}
              style={styles.notesInput}
            />

            <TouchableOpacity
              onPress={() =>
                setSelectedMenu((prev) =>
                  prev.filter((d) => d.dishId !== item.dishId)
                )
              }
            >
              <Text style={styles.removeText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, saving && styles.disabledButton]}
        onPress={handleCreate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Créer la proforma</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(traiteur)/simulations')}
      >
        <Text style={styles.backButtonText}>Retour aux simulations</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F6F8',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#4B5563',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
  },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 2,
  },

  sectionTitle: {
    fontWeight: '800',
    marginBottom: 10,
    fontSize: 16,
    color: '#111827',
  },

  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },

  line: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
  },

  itemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  itemSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },

  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 10,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  dishBlock: {
    marginBottom: 10,
  },

  dishRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
  },

  dishRowSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },

  dishName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  dishNameSelected: {
    color: '#005BBB',
  },

  dishCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  selectBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    marginLeft: 10,
  },

  selectBadgeSelected: {
    color: '#fff',
    backgroundColor: '#007AFF',
  },

  notesInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 10,
    minHeight: 44,
    color: '#111827',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },

  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },

  menuSummary: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },

  menuSummaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },

  backButton: {
    backgroundColor: '#E5E7EB',
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    marginBottom: 10,
  },

  addButton: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },

  addButtonText: {
    color: '#fff',
    fontWeight: '800',
  },

  selectedDish: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },

  removeText: {
    color: '#EF4444',
    fontWeight: '700',
    marginTop: 5,
  },

  backButtonText: {
    color: '#111827',
    fontWeight: '800',
  },
});