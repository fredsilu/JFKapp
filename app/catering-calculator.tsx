import React, { useEffect, useState } from 'react'
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

  /** 👤 Client */
  const [client, setClient] = useState<string>('')

  /** 🧾 Simulation */
  const [simulationName, setSimulationName] = useState('')
  const [eventType, setEventType] = useState('Séminaire')
  const [people, setPeople] = useState('30')
  const [days, setDays] = useState('1')
  const [pricePerPerson, setPricePerPerson] = useState('50')

  /** 🔢 Calcul */
  const totalRevenue =
    Number(people || 0) * Number(days || 0) * Number(pricePerPerson || 0)

  /** 🔁 Hydratation */
  useEffect(() => {
    if (reuseSimulation) {
      const sim = JSON.parse(reuseSimulation as string)
      setClient(sim.clientName)
      setSimulationName(`${sim.name} (copie)`)
      setPeople(String(sim.people ?? 30))
      setDays(String(sim.days ?? 1))
      setPricePerPerson(String(sim.pricePerPerson ?? 50))
      return
    }

    if (clientName) {
      setClient(clientName as string)
      setSimulationName('Nouvelle simulation')
    }
  }, [reuseSimulation, clientName])

  /** 💾 Enregistrement */
  function handleSave() {
    // 👉 ici tu appelleras saveSimulation(...)
    router.back()
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Calculateur traiteur</Text>

      {/* CLIENT */}
      <Text style={styles.label}>Client</Text>
      <Text style={styles.value}>{client}</Text>

      {/* NOM SIMULATION */}
      <Text style={styles.label}>Nom de la simulation</Text>
      <TextInput
        style={styles.input}
        value={simulationName}
        onChangeText={setSimulationName}
      />

      {/* TYPE ÉVÉNEMENT */}
      <Text style={styles.label}>Type d’événement</Text>
      <TextInput
        style={styles.input}
        value={eventType}
        onChangeText={setEventType}
      />

      {/* PERSONNES */}
      <Text style={styles.label}>Nombre de personnes</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={people}
        onChangeText={setPeople}
      />

      {/* JOURS */}
      <Text style={styles.label}>Durée (jours)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={days}
        onChangeText={setDays}
      />

      {/* PRIX */}
      <Text style={styles.label}>Prix par personne ($)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={pricePerPerson}
        onChangeText={setPricePerPerson}
      />

      {/* RÉSULTAT */}
      <View style={styles.result}>
        <Text style={styles.resultLabel}>Chiffre d’affaires</Text>
        <Text style={styles.resultValue}>
          ${totalRevenue.toFixed(2)}
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
  label: {
    marginTop: 12,
    fontWeight: '600',
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
    marginTop: 6,
  },
  result: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f1f4f8',
    borderRadius: 10,
  },
  resultLabel: {
    color: '#555',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
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
