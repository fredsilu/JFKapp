import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'

export default function CateringCalculatorScreen() {
  const { reuseSimulation, clientName } = useLocalSearchParams()

  /** =====================
   * IDENTITÉ
   ===================== */
  const [client, setClient] = useState('')
  const [simulationName, setSimulationName] = useState('')
  const [reference, setReference] = useState('')
  const [eventType, setEventType] = useState('Séminaire')

  /** =====================
   * PARAMÈTRES ÉVÉNEMENT
   ===================== */
  const [participants, setParticipants] = useState('50')
  const [days, setDays] = useState('1')
  const [servicesPerDay, setServicesPerDay] = useState('2')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')

  /** =====================
   * TARIFICATION
   ===================== */
  const [pricePerPerson, setPricePerPerson] = useState('60')
  const [costPerPerson, setCostPerPerson] = useState('40')
  const [targetMargin, setTargetMargin] = useState('30')

  /** =====================
   * HYDRATATION
   ===================== */
  useEffect(() => {
    if (reuseSimulation) {
      const sim = JSON.parse(reuseSimulation as string)

      setClient(sim.clientName)
      setSimulationName(`${sim.name} (copie)`)
      setParticipants(String(sim.participants ?? 50))
      setDays(String(sim.days ?? 1))
      setServicesPerDay(String(sim.servicesPerDay ?? 2))
      setPricePerPerson(String(sim.pricePerPerson ?? 60))
      setCostPerPerson(String(sim.costPerPerson ?? 40))
      return
    }

    if (clientName) {
      setClient(clientName as string)
      setSimulationName('Nouvelle simulation')
    }
  }, [reuseSimulation, clientName])

  /** =====================
   * CALCULS
   ===================== */
  const revenue = useMemo(() => {
    return (
      Number(participants || 0) *
      Number(days || 0) *
      Number(pricePerPerson || 0)
    )
  }, [participants, days, pricePerPerson])

  const totalCost = useMemo(() => {
    return (
      Number(participants || 0) *
      Number(days || 0) *
      Number(costPerPerson || 0)
    )
  }, [participants, days, costPerPerson])

  const profit = revenue - totalCost
  const marginPercent =
    revenue > 0 ? (profit / revenue) * 100 : 0

  /** =====================
   * ACTIONS
   ===================== */
  function handleSave() {
    // 👉 saveSimulation(...) à brancher ici
    router.back()
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Calculateur traiteur</Text>

      {/* CLIENT */}
      <Text style={styles.section}>Client</Text>
      <Text style={styles.value}>{client}</Text>

      {/* IDENTITÉ */}
      <Text style={styles.section}>Simulation</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de la simulation"
        value={simulationName}
        onChangeText={setSimulationName}
      />

      <TextInput
        style={styles.input}
        placeholder="Référence interne"
        value={reference}
        onChangeText={setReference}
      />

      <TextInput
        style={styles.input}
        placeholder="Type d’événement (Séminaire, Cocktail…)"
        value={eventType}
        onChangeText={setEventType}
      />

      {/* PARAMÈTRES */}
      <Text style={styles.section}>Paramètres événement</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre de participants"
        keyboardType="numeric"
        value={participants}
        onChangeText={setParticipants}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombre de jours"
        keyboardType="numeric"
        value={days}
        onChangeText={setDays}
      />

      <TextInput
        style={styles.input}
        placeholder="Services par jour"
        keyboardType="numeric"
        value={servicesPerDay}
        onChangeText={setServicesPerDay}
      />

      <TextInput
        style={styles.input}
        placeholder="Lieu"
        value={location}
        onChangeText={setLocation}
      />

      <TextInput
        style={styles.input}
        placeholder="Date de début"
        value={startDate}
        onChangeText={setStartDate}
      />

      {/* TARIFICATION */}
      <Text style={styles.section}>Tarification</Text>

      <TextInput
        style={styles.input}
        placeholder="Prix par personne / jour ($)"
        keyboardType="numeric"
        value={pricePerPerson}
        onChangeText={setPricePerPerson}
      />

      <TextInput
        style={styles.input}
        placeholder="Coût par personne / jour ($)"
        keyboardType="numeric"
        value={costPerPerson}
        onChangeText={setCostPerPerson}
      />

      <TextInput
        style={styles.input}
        placeholder="Marge cible (%)"
        keyboardType="numeric"
        value={targetMargin}
        onChangeText={setTargetMargin}
      />

      {/* RÉSULTATS */}
      <View style={styles.result}>
        <Text>Chiffre d’affaires : ${revenue.toFixed(2)}</Text>
        <Text>Coût total : ${totalCost.toFixed(2)}</Text>
        <Text style={styles.profit}>
          Bénéfice : ${profit.toFixed(2)} ({marginPercent.toFixed(1)}%)
        </Text>
      </View>

      {/* ACTIONS */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Enregistrer la simulation</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.cancel}>Annuler</Text>
      </TouchableOpacity>
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
    marginBottom: 16,
  },
  section: {
    marginTop: 18,
    fontWeight: '700',
  },
  value: {
    marginTop: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  result: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f1f4f8',
    borderRadius: 10,
  },
  profit: {
    marginTop: 6,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancel: {
    textAlign: 'center',
    marginTop: 16,
    color: '#555',
  },
})
