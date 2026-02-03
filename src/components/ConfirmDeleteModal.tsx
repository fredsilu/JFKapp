import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Modal from '@/components/Modal'

interface Props {
  visible: boolean
  title?: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDeleteModal({
  visible,
  title = 'Supprimer',
  message = 'Confirmer la suppression ?',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} onClose={onCancel}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancel}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onConfirm}>
            <Text style={styles.delete}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    color: '#555',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancel: {
    color: '#007AFF',
    fontWeight: '500',
  },
  delete: {
    color: '#d9534f',
    fontWeight: '600',
  },
})
