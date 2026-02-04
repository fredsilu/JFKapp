import { useState } from 'react';
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

/**
 * =========================
 * DEFAULT BUILDERS
 * =========================
 */
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

/**
 * =========================
 * SCREEN
 * =========================
 */
export default function CateringCalculator() {
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

  const result = calculateSimulation(simulation);

  /**
   * =========================
   * SAVE SIMULATION
   * =========================
   */
  const handleSaveSimulation = async () => {
    try {
      setSaving(true);

      const saved = await saveCateringSimulation(simulation, {
        name: simulation.name || 'Simulation sans nom',
        clientId: simulation.clientId || 'unknown-client',
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

  /**
   * =========================
   * VALIDATE SIMULATION
   * =========================
   */
  const handleValidateSimulation = async () => {
    if (!savedSimulation) return;

    try {
      setSaving(true);
      await validateCateringSimulation(savedSimulation);

      setSavedSimulation({
        ...savedSimulation,
        status: 'validated',
      });

      Alert.alert(
        'Simulation validée',
        'La simulation est maintenant verrouillée.'
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de valider la simulation.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * =========================
   * HELPERS
   * =========================
   */
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

  const updateService = (
    values: Partial<CateringServiceInput>
  ) => {
    if (isValidated) return;
    setSimulation({
      ...simulation,
      service: { ...simulation.service, ...values },
    });
  };

  const renderMealBlock = (
    title: string,
    keyName: 'breakfast' | 'lunch' | 'drinks'
  ) => {
    const meal = simulation[keyName];
    const mealResult = result[keyName];

    return (
      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>{title}</Text>
          <Switch
            value={meal.enabled}
            disabled={isValidated}
            onValueChange={(v) =>
              updateMeal(keyName, { enabled: v })
            }
          />
        </View>

        {meal.enabled && (
          <>
            <NumberInputField label="Nombre de personnes" value={meal.numberOfPeople}
              disabled={isValidated}
              onChange={(v) => updateMeal(keyName, { numberOfPeople: v })} />
            <NumberInputField label="Tarif ($ / pers / jour)" value={meal.unitPrice}
              disabled={isValidated}
              onChange={(v) => updateMeal(keyName, { unitPrice: v })} />
            <NumberInputField label="Nombre de jours" value={meal.numberOfDays}
              disabled={isValidated}
              onChange={(v) => updateMeal(keyName, { numberOfDays: v })} />
            <NumberInputField label="Remise ($)" value={meal.discount}
              disabled={isValidated}
              onChange={(v) => updateMeal(keyName, { discount: v })} />
            <NumberInputField label="Taux coût matière (%)" value={meal.foodCostRate}
              disabled={isValidated}
              onChange={(v) => updateMeal(keyName, { foodCostRate: v })} />

            {mealResult && (
              <ResultBox
                data={[
                  ['Chiffre d’affaires', mealResult.turnover],
                  ['Coût matière journalier', mealResult.dailyFoodCost],
                  ['Coût matière total', mealResult.totalFoodCost],
                ]}
              />
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simulation Catering</Text>

      {/* INFORMATIONS GÉNÉRALES */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>🧾 Informations générales</Text>

        <TextInputField
          label="Nom de la simulation"
          value={simulation.name || ''}
          disabled={isValidated}
          onChangeText={(v) =>
            setSimulation({ ...simulation, name: v })
          }
        />

        <TextInputField
          label="Client"
          value={simulation.clientId || ''}
          disabled={isValidated}
          onChangeText={(v) =>
            setSimulation({ ...simulation, clientId: v })
          }
        />
      </View>

      {renderMealBlock('🥐 Petit-déjeuner', 'breakfast')}
      {renderMealBlock('🍽️ Déjeuner', 'lunch')}
      {renderMealBlock('🥤 Boissons', 'drinks')}

      {/* SERVICE */}
      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>👨‍🍳 Service</Text>
          <Switch
            value={simulation.service.enabled}
            disabled={isValidated}
            onValueChange={(v) =>
              updateService({ enabled: v })
            }
          />
        </View>

        {simulation.service.enabled && (
          <>
            <NumberInputField label="Nombre de personnes"
              value={simulation.service.numberOfPeople}
              disabled={isValidated}
              onChange={(v) => updateService({ numberOfPeople: v })} />
            <NumberInputField label="Nombre de jours"
              value={simulation.service.numberOfDays}
              disabled={isValidated}
              onChange={(v) => updateService({ numberOfDays: v })} />
            <NumberInputField label="Taux serveur (1 / X)"
              value={simulation.service.serverRate}
              disabled={isValidated}
              onChange={(v) => updateService({ serverRate: v })} />
            <NumberInputField label="Taux cuisinier (1 / X)"
              value={simulation.service.cookRate}
              disabled={isValidated}
              onChange={(v) => updateService({ cookRate: v })} />
            <NumberInputField label="Remise ($)"
              value={simulation.service.discount}
              disabled={isValidated}
              onChange={(v) => updateService({ discount: v })} />

            {result.service && (
              <ResultBox
                data={[
                  ['Serveurs', result.service.numberOfServers],
                  ['Cuisiniers', result.service.numberOfCooks],
                  ['Coût service total', result.service.totalServiceCost],
                ]}
              />
            )}
          </>
        )}
      </View>

      {/* ACTIONS */}
      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveSimulation}
          disabled={saving || isValidated}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              Enregistrer la simulation
            </Text>
          )}
        </TouchableOpacity>

        {!isValidated && savedSimulation && (
          <TouchableOpacity
            style={[styles.validateButton, { marginTop: 10 }]}
            onPress={handleValidateSimulation}
            disabled={saving}
          >
            <Text style={styles.validateButtonText}>
              Valider la simulation
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SYNTHÈSE FINANCIÈRE */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>📊 Synthèse financière</Text>

        <View style={styles.tableRowHeader}>
          <Text style={styles.tableCell}>Catégorie</Text>
          <Text style={styles.tableCell}>CM ($)</Text>
          <Text style={styles.tableCell}>CA ($)</Text>
        </View>

        {result.breakfast && (
          <TableRow label="PDJ" cost={result.breakfast.totalFoodCost} revenue={result.breakfast.turnover} />
        )}
        {result.lunch && (
          <TableRow label="DJ" cost={result.lunch.totalFoodCost} revenue={result.lunch.turnover} />
        )}
        {result.drinks && (
          <TableRow label="Boissons" cost={result.drinks.totalFoodCost} revenue={result.drinks.turnover} />
        )}
        {result.service && (
          <TableRow label="Service" cost={result.service.totalServiceCost} revenue={0} />
        )}

        <View style={styles.tableRowTotal}>
          <Text style={styles.tableCellTotal}>TOTAL</Text>
          <Text style={styles.tableCellTotal}>{result.globalCost.toFixed(2)}</Text>
          <Text style={styles.tableCellTotal}>{result.globalTurnover.toFixed(2)}</Text>
        </View>
      </View>

      {/* GLOBAL */}
      <View style={styles.global}>
        <Text style={styles.globalText}>CA Global : {result.globalTurnover.toFixed(2)} $</Text>
        <Text style={styles.globalText}>Coût Global : {result.globalCost.toFixed(2)} $</Text>
        <Text style={styles.globalText}>Marge : {result.globalMargin.toFixed(2)} $</Text>
      </View>
    </ScrollView>
  );
}

/**
 * =========================
 * UI COMPONENTS
 * =========================
 */
function TextInputField({
  label,
  value,
  onChangeText,
  disabled,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, disabled && { opacity: 0.6 }]}
        editable={!disabled}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function NumberInputField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, disabled && { opacity: 0.6 }]}
        editable={!disabled}
        keyboardType="numeric"
        value={String(value)}
        onChangeText={(t) => onChange(Number(t) || 0)}
      />
    </View>
  );
}

function TableRow({
  label,
  cost,
  revenue,
}: {
  label: string;
  cost: number;
  revenue: number;
}) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{label}</Text>
      <Text style={styles.tableCell}>{cost.toFixed(2)}</Text>
      <Text style={[styles.tableCell, { color: '#2e7d32' }]}>
        {revenue ? revenue.toFixed(2) : '-'}
      </Text>
    </View>
  );
}

function ResultBox({
  data,
}: {
  data: [string, number][];
}) {
  return (
    <View style={styles.resultBox}>
      {data.map(([label, value]) => (
        <Text key={label} style={styles.resultText}>
          {label} : {value.toFixed(2)}
        </Text>
      ))}
    </View>
  );
}

/**
 * =========================
 * STYLES
 * =========================
 */
const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },

  block: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockTitle: { fontSize: 18, fontWeight: '600' },

  inputGroup: { marginTop: 10 },
  label: { fontSize: 13, color: '#555' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 4,
  },

  resultBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#eef6ff',
    borderRadius: 8,
  },
  resultText: { fontSize: 14 },

  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  validateButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  tableRowHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  tableRowTotal: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#000',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
  },
  tableCellTotal: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
  },

  global: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#0a2540',
    borderRadius: 10,
  },
  globalText: { color: '#fff', fontSize: 16 },
});
