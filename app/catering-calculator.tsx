import { useEffect, useState } from 'react';
import {
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import {
  CateringMealInput,
  CateringServiceInput,
  CateringSimulation,
  CateringSimulationDraft,
} from '../types/catering';

import { calculateSimulation } from '@/src/utils/cateringCalculations';
import {
  saveCateringSimulation,
  validateCateringSimulation,
} from '@/src/services/cateringSimulation.service';

/* ========= DEFAULT BUILDERS ========= */
const emptyMeal = (): CateringMealInput => ({
  enabled: false,
  numberOfPeople: 0,
  unitPrice: 0,
  numberOfDays: 1,
  discount: 0,
  foodCostRate: 0,
});

const emptyService = (): CateringServiceInput => ({
  enabled: false,
  numberOfPeople: 0,
  numberOfDays: 1,
  discount: 0,
  serverRate: 25,
  cookRate: 50,
});

export default function CateringCalculator() {
  const { clientId } =
    useLocalSearchParams<{ clientId?: string }>();

  const [simulation, setSimulation] =
    useState<CateringSimulationDraft>({
      breakfast: emptyMeal(),
      lunch: emptyMeal(),
      drinks: emptyMeal(),
      service: emptyService(),
      serviceCosts: {
        serverDailyCost: 15,
        cookDailyCost: 20,
        electricityDailyCost: 10,
        gasDailyCost: 8,
        fuelDailyCost: 12,
      },
      name: '',
      clientId: '',
    });

  const [saving, setSaving] = useState(false);
  const [savedSimulation, setSavedSimulation] =
    useState<CateringSimulation | null>(null);

  const isValidated = savedSimulation?.status === 'validated';

  /* 🔁 init client from previous screen */
  useEffect(() => {
    if (clientId) {
      setSimulation(prev => ({
        ...prev,
        clientId: String(clientId),
      }));
    }
  }, [clientId]);

  const result = calculateSimulation(simulation);

  /* ========= SAVE ========= */
const handleSaveSimulation = async () => {
  if (!simulation.clientId) {
    Alert.alert(
      'Client manquant',
      'Veuillez sélectionner un client avant de sauvegarder la simulation.'
    );
    return;
  }

  try {
    setSaving(true);

    const saved = await saveCateringSimulation(simulation, {
      name: simulation.name?.trim() || 'Simulation sans nom',
      clientId: simulation.clientId, // ✅ maintenant garanti string
    });

    setSavedSimulation(saved);
    Alert.alert('Succès', 'Simulation enregistrée avec succès.');
  } catch (error) {
    console.error(error);
    Alert.alert(
      'Erreur',
      "Une erreur est survenue lors de l'enregistrement."
    );
  } finally {
    setSaving(false);
  }
};



  /* ========= VALIDATE ========= */
  const handleValidateSimulation = async () => {
    if (!savedSimulation) return;

    try {
      setSaving(true);
      await validateCateringSimulation(savedSimulation);
      setSavedSimulation({
        ...savedSimulation,
        status: 'validated',
      });
      Alert.alert('Simulation validée');
    } finally {
      setSaving(false);
    }
  };

  /* ========= HELPERS ========= */
  const updateMeal = (
    key: 'breakfast' | 'lunch' | 'drinks',
    values: Partial<CateringMealInput>
  ) => {
    if (isValidated) return;
    setSimulation({
      ...simulation,
      [key]: { ...simulation[key], ...values },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simulation Catering</Text>

      {/* CLIENT (READ ONLY) */}
      <View style={styles.block}>
        <Text style={styles.label}>Client</Text>
        <Text style={styles.readonly}>
          {simulation.clientId}
        </Text>
      </View>

      {/* NAME */}
      <View style={styles.block}>
        <Text style={styles.label}>Nom de la simulation</Text>
        <TextInput
          style={styles.input}
          editable={!isValidated}
          value={simulation.name}
          onChangeText={(v) =>
            setSimulation({ ...simulation, name: v })
          }
        />
      </View>

      {/* MEALS */}
      {(['breakfast', 'lunch', 'drinks'] as const).map(k => (
        <View key={k} style={styles.block}>
          <View style={styles.row}>
            <Text style={styles.blockTitle}>{k}</Text>
            <Switch
              value={simulation[k].enabled}
              onValueChange={v =>
                updateMeal(k, { enabled: v })
              }
            />
          </View>
        </View>
      ))}

      {/* ACTIONS */}
      <TouchableOpacity
        style={styles.saveButton}
        disabled={saving || isValidated}
        onPress={handleSaveSimulation}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>
            Enregistrer la simulation
          </Text>
        )}
      </TouchableOpacity>

      {!isValidated && savedSimulation && (
        <TouchableOpacity
          style={styles.validateButton}
          onPress={handleValidateSimulation}
        >
          <Text style={styles.saveText}>
            Valider la simulation
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

/* ========= STYLES ========= */
const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  block: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  blockTitle: { fontSize: 16, fontWeight: '600' },
  label: { color: '#555', marginBottom: 6 },
  readonly: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  validateButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { color: '#fff', fontWeight: '600' },
});
