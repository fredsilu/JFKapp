import React, { useState } from 'react';
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

  const filteredClients = clients.filter(client =>
    (client.name &&
      normalizeText(client.name).includes(normalizedQuery)) ||
    (client.email &&
      normalizeText(client.email).includes(normalizedQuery)) ||
    (client.phone &&
      normalizeText(client.phone.toString()).includes(normalizedQuery)) ||
    (client.rccm &&
      normalizeText(client.rccm).includes(normalizedQuery)) ||
    (client.idnat &&
      normalizeText(client.idnat).includes(normalizedQuery))
  );

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

  const getClientOrdersCount = (clientId: string) => {
    return orders.filter(order => {
      return order.clientId === clientId || order.client?.id === clientId;
    }).length;
  };

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

      {/* Header */}
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

      {/* Clients list */}
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
              const clientOrdersCount = getClientOrdersCount(client.id);

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

                    {client.idnat ? (
                      <Text style={styles.legalText}>
                        IDNAT : {client.idnat}
                      </Text>
                    ) : null}

                    <View style={styles.contactInfo}>
                      {client.email ? (
                        <View style={styles.contactItem}>
                          <Icon name="email" size={14} color="#666" />
                          <Text style={styles.contactText}>
                            {client.email}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.contactItem}>
                        <Icon name="phone" size={14} color="#666" />
                        <Text style={styles.contactText}>
                          {client.phone ? client.phone.toString() : 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statsContainer}>
                      <View style={styles.stat}>
                        <Icon name="shopping-bag" size={16} color="#007AFF" />
                        <Text style={styles.statNumber}>
                          {clientOrdersCount}
                        </Text>
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

      {/* Add client modal */}
      <Modal visible={isFormModalVisible}>
        <ClientForm
          onClose={() => setIsFormModalVisible(false)}
          onSubmit={handleCreateClient}
        />
      </Modal>

      {/* Client details modal */}
      <Modal visible={!!selectedClientId}>
        {selectedClientId ? (
          <ClientDetails
            clientId={selectedClientId}
            clients={clients}
            onClose={() => setSelectedClientId(null)}
            onOpenOrder={(orderId: string) => setSelectedOrderId(orderId)}
          />
        ) : null}
      </Modal>

      {/* Order details modal */}
      {/* Order details modal */}
      <Modal visible={!!selectedOrderId}>
        {selectedOrderId && orders.find(order => order.id === selectedOrderId) ? (
          <OrderDetails
            order={orders.find(order => order.id === selectedOrderId)!}
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