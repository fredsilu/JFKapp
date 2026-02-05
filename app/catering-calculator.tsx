import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import {
  CateringMealInput,
  CateringServiceInput,
  CateringSimulationDraft,
} from '@/types/catering';

import {
  calculateSimulation,
  CateringSimulationResult,
} from '@/src/utils/cateringCalculations';

import { saveCateringSimulation } from '@/src/services/cateringSimulation.service';

/* =========================
   DEFAULT BUILDERS
========================= */

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
  const { clientId, clientName } =
    useLocalSearchParams<{ clientId?: string; clientName?: string }>();

  const [simulation, setSimulation] =
    useState<CateringSimulationDraft>({
      name: '',
      clientId: '',
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
    });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clientId) {
      setSimulation((prev) => ({
        ...prev,
        clientId: String(clientId),
      }));
    }
  }, [clientId]);

  const result: CateringSimulationResult = useMemo(
    () => calculateSimulation(simulation),
    [simulation]
  );

  /* =========================
     SAVE
  ========================= */
  const handleSave = async () => {
    if (!simulation.clientId) {
      Alert.alert('Client requis', 'Veuillez sélectionner un client.');
      return;
    }

    try {
      setSaving(true);
      await saveCateringSimulation(simulation, {
        name: simulation.name || 'Simulation traiteur',
        clientId: simulation.clientId,
      });
      Alert.alert('Succès', 'Simulation enregistrée.');
    } catch {
      Alert.alert('Erreur', 'Échec de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     HELPERS
  ========================= */
  const updateMeal = (
    key: 'breakfast' | 'lunch' | 'drinks',
    values: Partial<CateringMealInput>
  ) => {
    setSimulation((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...values },
    }));
  };

  const updateService = (values: Partial<CateringServiceInput>) => {
    setSimulation((prev) => ({
      ...prev,
      service: { ...prev.service, ...values },
    }));
  };

  /* =========================
     RENDER MEAL BLOCK
  ========================= */
  const renderMeal = (
    title: string,
    key: 'breakfast' | 'lunch' | 'drinks'
  ) => {
    const meal = simulation[key];
    const r = result[key];

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Switch
            value={meal.enabled}
            onValueChange={(v) => updateMeal(key, { enabled: v })}
          />
        </View>

        {meal.enabled && (
          <>
            <NumberField label="Nombre de personnes" value={meal.numberOfPeople}
              onChange={(v) => updateMeal(key, { numberOfPeople: v })} />
            <NumberField label="Tarif ($ / pers / jour)" value={meal.unitPrice}
              onChange={(v) => updateMeal(key, { unitPrice: v })} />
            <NumberField label="Nombre de jours" value={meal.numberOfDays}
              onChange={(v) => updateMeal(key, { numberOfDays: v })} />
            <NumberField label="Remise ($ / jour)" value={meal.discount}
              onChange={(v) => updateMeal(key, { discount: v })} />
            <NumberField label="Taux coût matière (%)" value={meal.foodCostRate}
              onChange={(v) => updateMeal(key, { foodCostRate: v })} />

            {r && (
              <ResultBox
                title="Résultats"
                rows={[
                  ['CA journalier', r.dailyTurnover],
                  ['CA total', r.totalTurnover],
                  ['Coût matière journalier', r.dailyFoodCost],
                  ['Coût matière total', r.totalFoodCost],
                ]}
              />
            )}
          </>
        )}
      </View>
    );
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Simulation service traiteur</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>{clientName || simulation.clientId}</Text>

        <Text style={[styles.label, { marginTop: 10 }]}>
          Nom de la simulation
        </Text>
        <TextInput
          style={styles.input}
          value={simulation.name}
          onChangeText={(v) =>
            setSimulation((p) => ({ ...p, name: v }))
          }
        />
      </View>

      {renderMeal('🥐 Petit-déjeuner', 'breakfast')}
      {renderMeal('🍽️ Déjeuner', 'lunch')}
      {renderMeal('🥤 Boissons', 'drinks')}

      {/* SERVICE */}
      {/* SERVICE */}
<View style={styles.card}>
  <View style={styles.header}>
    <Text style={styles.cardTitle}>👨‍🍳 Service</Text>
    <Switch
      value={simulation.service.enabled}
      onValueChange={(v) => updateService({ enabled: v })}
    />
  </View>

  {simulation.service.enabled && (
    <>
      <NumberField
        label="Nombre de personnes"
        value={simulation.service.numberOfPeople}
        onChange={(v) => updateService({ numberOfPeople: v })}
      />
      <NumberField
        label="Nombre de jours"
        value={simulation.service.numberOfDays}
        onChange={(v) => updateService({ numberOfDays: v })}
      />
      <NumberField
        label="Taux serveur (pers / serveur)"
        value={simulation.service.serverRate}
        onChange={(v) => updateService({ serverRate: v })}
      />
      <NumberField
        label="Taux cuisinier (pers / cuisinier)"
        value={simulation.service.cookRate}
        onChange={(v) => updateService({ cookRate: v })}
      />
      <NumberField
        label="Remise ($ / jour)"
        value={simulation.service.discount}
        onChange={(v) => updateService({ discount: v })}
      />

      {result.service && (
        <ResultBox
          title="Détails service"
          rows={[
            ['Serveurs', result.service.numberOfServers],
            ['Cuisiniers', result.service.numberOfCooks],
            ['Coût serveurs / jour', result.service.serversCost],
            ['Coût cuisiniers / jour', result.service.cooksCost],
            ['Courant / jour', result.service.electricityCost],
            ['Gaz / jour', result.service.gasCost],
            ['Carburant / jour', result.service.fuelCost],
            ['Coût service journalier', result.service.dailyServiceCost],
            ['Coût service total', result.service.totalServiceCost],
          ]}
        />
      )}
    </>
  )}
</View>

      {/* GLOBAL */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Récapitulatif global</Text>
        <Text>CA total : {result.globalTurnover.toFixed(2)} $</Text>
        <Text>Coût total : {result.globalCost.toFixed(2)} $</Text>
        <Text>Marge : {result.globalMargin.toFixed(2)} $</Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        disabled={saving}
        onPress={handleSave}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(value)}
        onChangeText={(t) => onChange(Number(t) || 0)}
      />
    </View>
  );
}

function ResultBox({
  title,
  rows,
}: {
  title: string;
  rows: [string, number][];
}) {
  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultTitle}>{title}</Text>
      {rows.map(([k, v]) => (
        <Text key={k} style={styles.resultText}>
          {k} : {v.toFixed(2)}
        </Text>
      ))}
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F4F6F8' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitle: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 12, color: '#6B7280' },
  value: { fontSize: 16, fontWeight: '700' },

  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },

  resultBox: {
    marginTop: 12,
    backgroundColor: '#EEF6FF',
    padding: 12,
    borderRadius: 8,
  },

  resultTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },

  resultText: {
    fontWeight: '600',
  },

  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
