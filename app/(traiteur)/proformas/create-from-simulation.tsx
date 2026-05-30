//app/(traiteur)/proformas/create-form-simulation.tsx
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
import { collection, getDocs } from 'firebase/firestore';

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

function calculateServiceUnitPriceFromCost(cost: number): number {
  if (cost <= 0) return 0;

  if (cost < 100) {
    return 100;
  }

  return Math.ceil(cost / 50) * 50;
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
  const [menuNotesByDishId, setMenuNotesByDishId] = useState<Record<string, string>>({});

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

    const mealMap = [
      { key: 'breakfast', label: 'Petit-déjeuner' },
      { key: 'lunch', label: 'Déjeuner' },
      { key: 'dinner', label: 'Dîner' },
      { key: 'drinks', label: 'Boissons' },
    ];

    mealMap.forEach(({ key, label }) => {
      const item = simulation[key];

      if (item?.enabled) {
        const numberOfPeople = Number(item.numberOfPeople || 0);
        const numberOfDays = Number(item.numberOfDays || 1);
        const unitPrice = Number(item.unitPrice || 0);
        const quantity = numberOfPeople;
        const total = numberOfDays * quantity * unitPrice;

        if (quantity > 0 && unitPrice > 0) {
          result.push({
            label,
            numberOfDays,
            quantity,
            unitPrice,
            total,
          });
        }
      }
    });

    const service = simulation.service;

    if (service?.enabled) {
      const numberOfPeople = Number(service.numberOfPeople || 0);
      const numberOfDays = Number(service.numberOfDays || 1);

      const serverRate = Number(service.serverRate || 1);
      const cookRate = Number(service.cookRate || 1);

      const serviceCosts = simulation.serviceCosts || {};

      const serverDailyCost = Number(serviceCosts.serverDailyCost || 0);
      const cookDailyCost = Number(serviceCosts.cookDailyCost || 0);
      const electricityDailyCost = Number(serviceCosts.electricityDailyCost || 0);
      const gasDailyCost = Number(serviceCosts.gasDailyCost || 0);
      const fuelDailyCost = Number(serviceCosts.fuelDailyCost || 0);

      const numberOfServers = Math.ceil(numberOfPeople / serverRate);
      const numberOfCooks = Math.ceil(numberOfPeople / cookRate);

      const realDailyServiceCost =
        numberOfServers * serverDailyCost +
        numberOfCooks * cookDailyCost +
        electricityDailyCost +
        gasDailyCost +
        fuelDailyCost;

      const unitPrice =
        calculateServiceUnitPriceFromCost(realDailyServiceCost);

      const quantity = 1;
      const total = numberOfDays * quantity * unitPrice;

      if (numberOfDays > 0 && unitPrice > 0) {
        result.push({
          label: 'Service traiteur',
          numberOfDays,
          quantity,
          unitPrice,
          total,
        });
      }
    }

    return result;
  }, [simulation]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }, [items]);

  const generalDiscount = Number(simulation?.discount || 0);

  const totalAfterDiscount = Math.max(subtotal - generalDiscount, 0);

  function getClientName() {
    return client?.name || client?.clientName || simulation?.clientName || 'Client';
  }

  function getClientRccm() {
    return (
      client?.rccm ??
      client?.RCCM ??
      simulation?.clientRccm ??
      ''
    );
  }

  function getClientIdNat() {
    return (
      client?.idNat ??
      client?.idnat ??
      client?.idNAT ??
      simulation?.clientIdNat ??
      ''
    );
  }

  function getClientNif() {
    return (
      client?.nif ??
      client?.NIF ??
      simulation?.clientNif ??
      ''
    );
  }

  function getClientAddress() {
    return client?.address || simulation?.clientAddress || '';
  }

  function getClientCity() {
    return (
      client?.city ??
      simulation?.clientCity ??
      'Kinshasa'
    );
  }

  function getEventDate() {
    return simulation?.dateLivraison || simulation?.eventDate || '';
  }

  function getValidityDate() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
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

    try {
      setSaving(true);

      console.log('🧾 PROFORMA ITEMS:', JSON.stringify(items, null, 2));

      const proformaId = await createCateringProforma({
        simulationId: simulation.id,
        clientId: simulation.clientId,
        clientName: getClientName(),
        clientRccm: getClientRccm(),
        clientIdNat: getClientIdNat(),
        clientNif: getClientNif(),
        clientAddress: getClientAddress(),
        clientCity: getClientCity(),

        issueDate: new Date().toISOString().slice(0, 10),
        validityDate: getValidityDate(),

        eventDate: getEventDate(),
        eventName:
          simulation.name ||
          simulation.eventName ||
          'Évènement sans nom',

        status: 'draft',

        service:
          simulation.serviceType ||
          simulation.typeService ||
          simulation.serviceName ||
          (simulation.service?.enabled ? 'Service traiteur' : ''),

        serviceType:
          simulation.serviceType ||
          simulation.typeService ||
          simulation.serviceName ||
          (simulation.service?.enabled ? 'Service traiteur' : ''),

        items,
        menu: selectedMenu,

        totals: {
          subtotal,
          discount: generalDiscount,
          total: totalAfterDiscount,
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
                Jrs : {item.numberOfDays || 1} | Qté : {item.quantity} ×{' '}
                {formatCurrency(item.unitPrice)}
              </Text>
            </View>

            <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Sous-total</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>

        {generalDiscount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Remise</Text>
            <Text style={styles.totalValue}>
              -{formatCurrency(generalDiscount)}
            </Text>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total final</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(totalAfterDiscount)}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Menu des plats</Text>

        <Text style={styles.helperText}>
          Ajoute les plats à inclure dans la proforma.
        </Text>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedDishId}
            onValueChange={(value) => setSelectedDishId(value)}
          >
            <Picker.Item label="Sélectionner un plat..." value="" />

            {dishes.map((dish) => (
              <Picker.Item key={dish.id} label={dish.name} value={dish.id} />
            ))}
          </Picker>
        </View>

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
        onPress={() => router.replace('/(traiteur)/simulations')}
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

  dishName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
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