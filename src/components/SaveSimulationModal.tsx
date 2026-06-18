import React, { useState } from 'react'
import { Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native'
import Modal from '@/components/Modal'
import { Client } from '@/types'
import { saveSimulation } from '@/src/services/simulationService'

interface Props {
  visible: boolean
  onClose: () => void
  client: Client | null
  ingredients: any[]
  totalCost: number
}

export default function SaveSimulationModal({
  visible,
  onClose,
  client,
  ingredients,
  totalCost,
}: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!client || !name.trim()) return

    setLoading(true)
    await saveSimulation({
      client,
      simulationName: name,
      description,
      ingredients,
      totalCost,
    })
    setLoading(false)
    onClose()
  }

  return (
    <Modal visible={visible} onClose={onClose} title="Enregistrer la simulation">
      {!client && <Text style={styles.warning}>⚠ Sélectionne un client</Text>}

      <Text style={styles.label}>Client</Text>
      <Text style={styles.client}>{client?.name ?? '—'}</Text>

      <TextInput
        placeholder="Nom de la simulation"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Description (optionnelle)"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { height: 80 }]}
        multiline
      />

      <Text style={styles.total}>Total : {totalCost.toFixed(2)} $</Text>

      <TouchableOpacity
        style={[styles.button, (!client || !name) && styles.disabled]}
        disabled={!client || !name || loading}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </Text>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  label: { marginTop: 8, fontWeight: '600' },
  client: { marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#fff',
  },
  total: { marginTop: 12, fontWeight: '700' },
  button: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontWeight: '600' },
  warning: { color: 'red', marginBottom: 6 },
})
