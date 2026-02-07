import React, { useEffect, useMemo, useState } from 'react';
import { fetchClients } from '@/src/services/clientService';
import { useRouter, useLocalSearchParams } from 'expo-router';

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

import {
  CateringMealInput,
  CateringServiceInput,
  CateringSimulationDraft,
  CateringSimulation,
} from '@/types/catering';

import {
  calculateSimulation,
  CateringSimulationResult,
} from '@/src/utils/cateringCalculations';

import {
  saveCateringSimulation,
  getCateringSimulationById,
} from '@/src/services/cateringSimulation.service';

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

type Mode = 'new' | 'view' | 'reuse';

function paramToString(p?: string | string[]) {
  if (!p) return undefined;
  return Array.isArray(p) ? p[0] : p;
}

export default function CateringCalculator() {
  const params = useLocalSearchParams<{
    clientId?: string | string[];
    clientName?: string | string[];
    simulationId?: string | string[];
    reuseSimulationId?: string | string[];
  }>();

  const clientId = paramToString(params.clientId);
  const clientName = paramToString(params.clientName);
  const simulationId = paramToString(params.simulationId);
  const reuseSimulationId = paramToString(params.reuseSimulationId);

  const mode: Mode = simulationId ? 'view' : reuseSimulationId ? 'reuse' : 'new';
  const readOnly = mode === 'view';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [clientsById, setClientsById] = useState<Record<string, string>>({});
  const [dateLivraison, setDateLivraison] = useState('');

  const [simulation, setSimulation] = useState<CateringSimulationDraft>({
    name: '',
    clientId: '',
    dateLivraison: '',
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

  /* =========================
     LOAD CLIENTS
  ========================= */

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clients = await fetchClients();
        const map: Record<string, string> = {};
        clients.forEach((c) => {
          map[c.id] = c.name;
        });
        setClientsById(map);
      } catch (e) {
        console.error('❌ Erreur chargement clients', e);
      }
    };

    loadClients();
  }, []);

  /* =========================
     LOAD SIMULATION (VIEW / REUSE)
  ========================= */

  useEffect(() => {
    const idToLoad = simulationId || reuseSimulationId;

    // NEW: on pré-remplit le clientId si fourni
    if (!idToLoad) {
      if (clientId) {
        setSimulation((p) => ({ ...p, clientId: String(clientId) }));
      }
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await getCateringSimulationById(String(idToLoad));

        if (!data) {
          Alert.alert('Erreur', 'Simulation introuvable');
          return;
        }

        const { id, createdAt, updatedAt, isDeleted, status, ...draft } =
          data as CateringSimulation;

        setSimulation({
          ...(draft as CateringSimulationDraft),
          name:
            mode === 'reuse'
              ? `${draft.name || 'Simulation'} (copie)`
              : draft.name || '',
          clientId: draft.clientId || '',
        });

        // ✅ IMPORTANT: charger la date depuis Firebase (robuste anciennes datas)
        const loadedDate = (data as any).dateLivraison ?? '';
        setDateLivraison(loadedDate);

        // ✅ OPTION: si ancien doc sans date et mode VIEW, on affiche "Non définie"
        // (pas de crash, juste UX)
      } catch (e) {
        console.error(e);
        Alert.alert('Erreur', 'Impossible de charger la simulation');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [simulationId, reuseSimulationId, clientId, mode]);

  const result: CateringSimulationResult = useMemo(
    () => calculateSimulation(simulation),
    [simulation]
  );

  /* =========================
     SAVE
  ========================= */

  const handleSave = async () => {
    if (readOnly || saving) return;

    if (!simulation.clientId) {
      Alert.alert('Client requis', 'Veuillez sélectionner un client.');
      return;
    }

    if (!dateLivraison) {
      Alert.alert('Date requise', 'Veuillez saisir la date de livraison.');
      return;
    }

    try {
      setSaving(true);

      // ✅ IMPORTANT: inclure dateLivraison dans l’objet sauvegardé
      await saveCateringSimulation(
        {
          ...simulation,
          dateLivraison,
        } as any,
        {
          name: simulation.name || 'Simulation traiteur',
          clientId: simulation.clientId,
        }
      );

      Alert.alert('Succès', 'Simulation enregistrée avec succès.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (e) {
      console.error('❌ save error:', e);
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
    if (readOnly) return;
    setSimulation((p) => ({
      ...p,
      [key]: { ...(p as any)[key], ...values },
    }));
  };

  const updateService = (values: Partial<CateringServiceInput>) => {
    if (readOnly) return;
    setSimulation((p) => ({
      ...p,
      service: { ...p.service, ...values },
    }));
  };

  /* =========================
     UI
  ========================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Chargement de la simulation…</Text>
      </View>
    );
  }

  const displayedClientLabel =
    clientName
      ? decodeURIComponent(String(clientName))
      : simulation.clientId && clientsById[simulation.clientId]
      ? clientsById[simulation.clientId]
      : simulation.clientId
      ? simulation.clientId
      : 'Client inconnu';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {mode === 'view'
          ? 'Détails de la simulation'
          : mode === 'reuse'
          ? 'Réutiliser une simulation'
          : 'Nouvelle simulation'}
      </Text>

      {/* CLIENT + META */}
      <View style={styles.card}>
        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>{displayedClientLabel}</Text>

        <Text style={[styles.label, { marginTop: 10 }]}>Nom de la simulation</Text>
        <TextInput
          style={[styles.input, readOnly && { backgroundColor: '#eee' }]}
          editable={!readOnly}
          value={simulation.name}
          onChangeText={(v) => setSimulation((p) => ({ ...p, name: v }))}
          placeholder="Ex: Buffet séminaire Equity"
        />

        {/* DATE LIVRAISON */}
        <Text style={[styles.label, { marginTop: 12 }]}>Date de livraison</Text>

        {readOnly ? (
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>
              📅 {dateLivraison || 'Non définie'}
            </Text>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={dateLivraison}
            onChangeText={setDateLivraison}
          />
        )}
      </View>

      {/* BLOCS REPAS */}
      {(['breakfast', 'lunch', 'drinks'] as const).map((k, i) =>
        renderMealBlock({
          key: k,
          title: ['🥐 Petit-déjeuner', '🍽️ Déjeuner', '🥤 Boissons'][i],
          simulation,
          result,
          updateMeal,
          readOnly,
        })
      )}

      {/* SERVICE */}
      {renderServiceBlock({
        simulation,
        result,
        updateService,
        readOnly,
      })}

      {/* RÉCAP FINANCIER */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💰 Récapitulatif financier</Text>

        {result.breakfast && (
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>🥐 Petit-déjeuner</Text>
            <Text style={styles.recapValue}>
              CA : {result.breakfast.totalTurnover.toFixed(2)} $
            </Text>
            <Text style={styles.recapSub}>
              Coût matière : {result.breakfast.totalFoodCost.toFixed(2)} $
            </Text>
          </View>
        )}

        {result.lunch && (
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>🍽️ Déjeuner</Text>
            <Text style={styles.recapValue}>
              CA : {result.lunch.totalTurnover.toFixed(2)} $
            </Text>
            <Text style={styles.recapSub}>
              Coût matière : {result.lunch.totalFoodCost.toFixed(2)} $
            </Text>
          </View>
        )}

        {result.drinks && (
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>🥤 Boissons</Text>
            <Text style={styles.recapValue}>
              CA : {result.drinks.totalTurnover.toFixed(2)} $
            </Text>
            <Text style={styles.recapSub}>
              Coût matière : {result.drinks.totalFoodCost.toFixed(2)} $
            </Text>
          </View>
        )}

        {result.service && (
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>👨‍🍳 Service</Text>
            <Text style={styles.recapValue}>
              Coût total service : {result.service.totalServiceCost.toFixed(2)} $
            </Text>
          </View>
        )}
      </View>

      {/* GLOBAL */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Récapitulatif global</Text>
        <Text>CA total : {result.globalTurnover.toFixed(2)} $</Text>
        <Text>Coût total : {result.globalCost.toFixed(2)} $</Text>
        <Text>Marge : {result.globalMargin.toFixed(2)} $</Text>
      </View>

      {!readOnly && (
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
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* =========================
   SUB COMPONENTS
========================= */

function NumberField({
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
    <View style={{ marginTop: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, disabled && { backgroundColor: '#eee' }]}
        editable={!disabled}
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
   RENDER BLOCK HELPERS
========================= */

function renderMealBlock({
  key,
  title,
  simulation,
  result,
  updateMeal,
  readOnly,
}: any) {
  const meal = simulation[key];
  const r = result[key];

  return (
    <View style={styles.card} key={key}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Switch
          value={meal.enabled}
          onValueChange={(v) => !readOnly && updateMeal(key, { enabled: v })}
        />
      </View>

      {meal.enabled && (
        <>
          <NumberField
            label="Nombre de personnes"
            value={meal.numberOfPeople}
            onChange={(v) => updateMeal(key, { numberOfPeople: v })}
            disabled={readOnly}
          />
          <NumberField
            label="Tarif ($ / pers / jour)"
            value={meal.unitPrice}
            onChange={(v) => updateMeal(key, { unitPrice: v })}
            disabled={readOnly}
          />
          <NumberField
            label="Nombre de jours"
            value={meal.numberOfDays}
            onChange={(v) => updateMeal(key, { numberOfDays: v })}
            disabled={readOnly}
          />
          <NumberField
            label="Remise ($ / jour)"
            value={meal.discount}
            onChange={(v) => updateMeal(key, { discount: v })}
            disabled={readOnly}
          />
          <NumberField
            label="Taux coût matière (%)"
            value={meal.foodCostRate}
            onChange={(v) => updateMeal(key, { foodCostRate: v })}
            disabled={readOnly}
          />

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
}

function renderServiceBlock({
  simulation,
  result,
  updateService,
  readOnly,
}: any) {
  const service = simulation.service;
  const r = result.service;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>👨‍🍳 Service</Text>
        <Switch
          value={service.enabled}
          onValueChange={(v) => !readOnly && updateService({ enabled: v })}
        />
      </View>

      {service.enabled && (
        <>
          <NumberField
            label="Nombre de personnes"
            value={service.numberOfPeople}
            onChange={(v) => updateService({ numberOfPeople: v })}
            disabled={readOnly}
          />
          <NumberField
            label="Nombre de jours"
            value={service.numberOfDays}
            onChange={(v) => updateService({ numberOfDays: v })}
            disabled={readOnly}
          />
          <NumberField
            label="Taux serveur (pers / serveur)"
            value={service.serverRate}
            onChange={(v) => updateService({ serverRate: v })}
            disabled={readOnly}
          />
          <NumberField
            label="Taux cuisinier (pers / cuisinier)"
            value={service.cookRate}
            onChange={(v) => updateService({ cookRate: v })}
            disabled={readOnly}
          />
          <NumberField
            label="Remise ($ / jour)"
            value={service.discount}
            onChange={(v) => updateService({ discount: v })}
            disabled={readOnly}
          />

          {r && (
            <ResultBox
              title="Détails service"
              rows={[
                ['Serveurs', r.numberOfServers],
                ['Cuisiniers', r.numberOfCooks],
                ['Coût serveurs / jour', r.serversCost],
                ['Coût cuisiniers / jour', r.cooksCost],
                ['Courant / jour', r.electricityCost],
                ['Gaz / jour', r.gasCost],
                ['Carburant / jour', r.fuelCost],
                ['Coût service journalier', r.dailyServiceCost],
                ['Coût service total', r.totalServiceCost],
              ]}
            />
          )}
        </>
      )}
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F4F6F8' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

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

  readOnlyField: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  readOnlyText: {
    color: '#333',
    fontWeight: '700',
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

  recapRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  recapLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  recapValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  recapSub: {
    fontSize: 13,
    color: '#6B7280',
  },
});
