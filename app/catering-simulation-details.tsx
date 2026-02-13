import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { formatCurrency } from '@/src/utils/costs'

export default function CateringSimulationDetailsScreen() {
  const { simulation } = useLocalSearchParams()

  if (!simulation) {
    return (
      <View style={styles.container}>
        <Text>Simulation introuvable</Text>
      </View>
    )
  }

  const sim = JSON.parse(simulation as string)

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {sim.name || 'Simulation sans nom'}
      </Text>

      <Text style={styles.client}>
        Client : {sim.clientName ?? '—'}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingrédients</Text>

        {sim.ingredients?.length ? (
          sim.ingredients.map((ing: any, index: number) => (
            <View key={index} style={styles.row}>
              <Text>{ing.name || ing.ingredientName}</Text>
              <Text>
                {ing.quantity} {ing.unit}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Aucun ingrédient</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résultats</Text>

        <Text>
          Chiffre d’affaires :{' '}
          {formatCurrency(sim.results?.totals?.totalRevenue ?? 0)}
        </Text>

        <Text>
          Bénéfice :{' '}
          {formatCurrency(sim.results?.totals?.totalProfit ?? 0)}
        </Text>
      </View>

      <View style={styles.actions}>
        {/* 🔵 BOUTON CRÉER COMMANDE */}
        {sim?.id && (
          <TouchableOpacity
            style={styles.createOrderBtn}
            onPress={() =>
              router.push(`/all-orders?fromSimulation=${sim.id}`)
            }
          >
            <Text style={styles.createOrderText}>Créer commande</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/catering-calculator',
              params: {
                reuseSimulation: JSON.stringify(sim),
              },
            })
          }
        >
          <Text style={styles.link}>Réutiliser cette simulation</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.link, styles.close]}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  client: {
    color: '#555',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  empty: {
    color: '#777',
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 20,
  },
  createOrderBtn: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  createOrderText: {
    color: '#fff',
    fontWeight: '600',
  },
  link: {
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 12,
  },
  close: {
    color: '#555',
  },
})
