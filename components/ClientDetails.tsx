import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { Client } from '@/types';
import { useOrders } from '@/src/hooks/useFirestore';
import { updateClient } from '@/src/services/firestore';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import Modal from '@/components/Modal';
import ClientForm from '@/components/ClientForm';

interface ClientDetailsProps {
  clientId: string;
  clients: Client[];
  onClose: () => void;
}

export default function ClientDetails({
  clientId,
  clients,
  onClose,
}: ClientDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);

  const client = useMemo(
    () => clients.find(c => c.id === clientId),
    [clients, clientId]
  );

  if (!client) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Client introuvable</Text>
      </View>
    );
  }

  const { data: rawOrders = [], loading, error } = useOrders({
    where: ['clientId', '==', client.id],
  });

  const clientOrders = [...rawOrders].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return '#007AFF';
      case 'En préparation':
        return '#FF9500';
      case 'Livré':
        return '#34C759';
      default:
        return '#666';
    }
  };

  const handleUpdateClient = async (updatedData: Partial<Client>) => {
    await updateClient(client.id, updatedData);
    setShowEditForm(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Détails du client</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowEditForm(true)}>
            <Icon name="edit" size={22} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={26} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {/* Profil */}
        <View style={styles.profile}>
          <Image
            source={
              client.profilePicture
                ? { uri: client.profilePicture }
                : require('@/assets/images/no_client_picture.jpg')
            }
            style={styles.profileImage}
          />

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{client.name}</Text>
            <Text style={styles.info}>{client.email}</Text>
            <Text style={styles.info}>{client.phone}</Text>
            <Text style={styles.info}>{client.address}</Text>
          </View>
        </View>

        {/* Historique commandes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des commandes</Text>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message="Erreur lors du chargement" />
          ) : clientOrders.length === 0 ? (
            <Text style={styles.empty}>Aucune commande</Text>
          ) : (
            clientOrders.map(order => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(order.status) },
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>

                  <View style={styles.amount}>
                    <Icon name="attach-money" size={16} color="#007AFF" />
                    <Text style={styles.amountText}>
                      {order.billedAmount !== undefined
                        ? order.billedAmount.toFixed(2)
                        : '—'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.date}>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : '—'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showEditForm}>
        <ClientForm
          client={client}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdateClient}
        />
      </Modal>
    </View>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  profile: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
  },
  orderCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  date: {
    marginTop: 6,
    fontSize: 13,
    color: '#666',
  },
});
