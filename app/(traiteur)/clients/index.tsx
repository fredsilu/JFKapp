//app/(traiteur)/clients/index.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useClients, useOrders } from '@/src/hooks/useFirestore';
import { addClient } from '@/src/services/firestore';
import Modal from '@/components/Modal';
import ClientForm from '@/components/ClientForm';
import ClientDetails from '@/components/ClientDetails';
import OrderDetails from '@/components/OrderDetails';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Client } from '@/types';
import { normalizeText } from '@/src/utils/search';

export default function ClientsScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const {
    data: clients = [],
    loading: loadingClients,
    error: clientsError,
  } = useClients({
    orderBy: ['name', 'asc'],
  });

  const {
    data: orders = [],
    loading: loadingOrders,
    error: ordersError,
  } = useOrders();

  const normalizedQuery = normalizeText(searchQuery);

  const filteredClients = useMemo(() => {
    if (!normalizedQuery) return clients;

    return clients.filter(client =>
      normalizeText(client.name ?? '').includes(normalizedQuery) ||
      normalizeText(client.email ?? '').includes(normalizedQuery) ||
      normalizeText(String(client.phone ?? '')).includes(normalizedQuery) ||
      normalizeText(client.rccm ?? '').includes(normalizedQuery) ||
      normalizeText(client.idNat ?? '').includes(normalizedQuery) ||
      normalizeText(client.nif ?? '').includes(normalizedQuery)
    );
  }, [clients, normalizedQuery]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find(order => order.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const handleCreateClient = async (values: Partial<Client>) => {
    try {
      await addClient(
        values as Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders'>
      );

      Alert.alert('Succès', 'Client ajouté avec succès');
      setIsFormModalVisible(false);
    } catch (err) {
      console.error('Error creating client:', err);
      Alert.alert('Erreur', 'Impossible de créer le client.');
    }
  };

  const ordersCountByClientId = useMemo(() => {
    return orders.reduce<Record<string, number>>((acc, order) => {
      const clientId = order.clientId ?? order.client?.id;

      if (clientId) {
        acc[clientId] = (acc[clientId] ?? 0) + 1;
      }

      return acc;
    }, {});
  }, [orders]);

  if (loadingClients || loadingOrders) {
    return <LoadingSpinner />;
  }

  if (clientsError || ordersError) {
    return <ErrorMessage message="Erreur lors du chargement des clients" />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.replace('/(traiteur)/config')}
        style={styles.backPill}
        activeOpacity={0.75}
      >
        <Icon name="arrow-back" size={18} color="#0F4C81" />
        <Text style={styles.backPillText}>Configuration</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />

          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsFormModalVisible(true)}
          activeOpacity={0.85}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {filteredClients.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="person-search" size={42} color="#9CA3AF" />
              <Text style={styles.emptyText}>Aucun client trouvé</Text>
            </View>
          ) : (
            filteredClients.map(client => {
              const clientOrdersCount = ordersCountByClientId[client.id] ?? 0;

              return (
                <TouchableOpacity
                  key={client.id}
                  style={styles.clientCard}
                  onPress={() => setSelectedClientId(client.id)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={
                      client.profilePicture
                        ? { uri: client.profilePicture }
                        : require('@/assets/images/no_client_picture.jpg')
                    }
                    style={styles.clientImage}
                  />

                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>
                      {client.name || 'Sans nom'}
                    </Text>

                    {client.rccm ? (
                      <Text style={styles.legalText}>RCCM : {client.rccm}</Text>
                    ) : null}

                    {client.idNat ? (
                      <Text style={styles.legalText}>idNat : {client.idNat}</Text>
                    ) : null}

                    {client.nif ? (
                      <Text style={styles.legalText}>NIF : {client.nif}</Text>
                    ) : null}

                    <View style={styles.contactInfo}>
                      {client.email ? (
                        <View style={styles.contactItem}>
                          <Icon name="email" size={14} color="#666" />
                          <Text style={styles.contactText}>{client.email}</Text>
                        </View>
                      ) : null}

                      <View style={styles.contactItem}>
                        <Icon name="phone" size={14} color="#666" />
                        <Text style={styles.contactText}>
                          {client.phone ? String(client.phone || '') : 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statsContainer}>
                      <View style={styles.stat}>
                        <Icon name="shopping-bag" size={16} color="#007AFF" />
                        <Text style={styles.statNumber}>{clientOrdersCount}</Text>
                        <Text style={styles.statLabel}>
                          {clientOrdersCount === 1 ? 'commande' : 'commandes'}
                        </Text>
                      </View>

                      {client.lastOrderDate ? (
                        <Text style={styles.lastOrder}>
                          Dernière : {formatDate(client.lastOrderDate)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={isFormModalVisible}>
        <ClientForm
          onClose={() => setIsFormModalVisible(false)}
          onSubmit={handleCreateClient}
        />
      </Modal>

      <Modal visible={!!selectedClientId}>
        {selectedClientId ? (
          <ClientDetails
            clientId={selectedClientId}
            clients={clients}
            onClose={() => setSelectedClientId(null)}
            onOpenOrder={(orderId: string) => {
              setSelectedClientId(null);
              setSelectedOrderId(orderId);
            }}
          />
        ) : null}
      </Modal>

      <Modal visible={!!selectedOrderId}>
        {selectedOrder ? (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

function formatDate(value: any): string {
  if (!value) return '—';

  if (value?.toDate) {
    return value.toDate().toLocaleDateString('fr-FR');
  }

  return new Date(value).toLocaleDateString('fr-FR');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 40,
  },

  header: {
    padding: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 20,
  },

  grid: {
    gap: 16,
  },

  clientCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },

  clientImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#E5E7EB',
  },

  clientInfo: {
    flex: 1,
    gap: 12,
  },

  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  contactInfo: {
    gap: 8,
  },

  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  contactText: {
    fontSize: 14,
    color: '#666',
  },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  statLabel: {
    fontSize: 14,
    color: '#666',
  },

  lastOrder: {
    fontSize: 12,
    color: '#666',
  },

  legalText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  backPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
    marginLeft: 20,
  },

  backPillText: {
    color: '#0F4C81',
    fontSize: 14,
    fontWeight: '700',
  },

  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },

  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});