import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { useClients, useOrders } from '@/src/hooks/useFirestore';
import { addClient } from '@/src/services/firestore';
import Modal from '@/components/Modal';
import ClientForm from '@/components/ClientForm';
import ClientDetails from '@/components/ClientDetails';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Client } from '@/types';
import { normalizeText } from '@/src/utils/search';


export default function ClientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

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
      alert('Client added successfully');
      setIsFormModalVisible(false);
    } catch (err) {
      console.error('Error creating client:', err);
    }
  };

  if (loadingClients || loadingOrders) {
    return <LoadingSpinner />;
  }

  if (clientsError || ordersError) {
    return <ErrorMessage message="Error loading clients" />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#665" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a client..."
            placeholderTextColor="#665"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsFormModalVisible(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Clients list */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.grid}>
          {filteredClients.map(client => {
            // ✅ CORRECTION CLÉ : toutes les commandes, tous statuts confondus
            const clientOrdersCount = orders.filter(
              o => o.client?.id === client.id
            ).length;

            return (
              <TouchableOpacity
                key={client.id}
                style={styles.clientCard}
                onPress={() => setSelectedClientId(client.id)}
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
                  <Text style={styles.clientName}>{client.name}</Text>
                  {client.rccm ? (
                    <Text style={styles.legalText}>RCCM : {client.rccm}</Text>
                  ) : null}

                  {client.idnat ? (
                    <Text style={styles.legalText}>IDNAT : {client.idnat}</Text>
                  ) : null}

                  <View style={styles.contactInfo}>
                    {client.email && (
                      <View style={styles.contactItem}>
                        <Icon name="email" size={14} color="#665" />
                        <Text style={styles.contactText}>{client.email}</Text>
                      </View>
                    )}
                    <View style={styles.contactItem}>
                      <Icon name="phone" size={14} color="#665" />
                      <Text style={styles.contactText}>
                        {client.phone ? client.phone.toString() : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsContainer}>
                    <View style={styles.stat}>
                      <Icon
                        name="shopping-bag"
                        size={16}
                        color="#007AFF"
                      />
                      <Text style={styles.statNumber}>
                        {clientOrdersCount}
                      </Text>
                      <Text style={styles.statLabel}>
                        {clientOrdersCount === 1 ? 'order' : 'orders'}
                      </Text>
                    </View>

                    {client.lastOrderDate && (
                      <Text style={styles.lastOrder}>
                        Last order:{' '}
                        {new Date(
                          client.lastOrderDate
                        ).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
        {selectedClientId && (
          <ClientDetails
            clientId={selectedClientId}
            clients={clients}
            onClose={() => setSelectedClientId(null)}
          />
        )}
      </Modal>
    </View>
  );
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
});
