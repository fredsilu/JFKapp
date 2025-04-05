import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useClients } from '@/src/hooks/useFirestore';
import { addClient } from '@/src/services/firestore';
import Modal from '@/components/Modal';
import ClientForm from '@/components/ClientForm';
import ClientDetails from '@/components/ClientDetails';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Client } from '@/types';

export default function ClientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const { data: clients = [], loading, error } = useClients({
    orderBy: ['name', 'asc']
  });

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof client.phone === 'string' && client.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateClient = async (values: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders'>) => {
    try {
      await addClient(values);
      setIsFormModalVisible(false);
    } catch (err) {
      console.error('Error creating client:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Error loading clients" />;
  }

  return (
    <View style={styles.container}>
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
          onPress={() => setIsFormModalVisible(true)}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}
        contentContainerStyle={styles.contentContainer}>
        <View style={styles.grid}>
          {filteredClients.map((client) => (
            <TouchableOpacity 
              key={client.id} 
              style={styles.clientCard}
              onPress={() => setSelectedClient(client)}>
              <Image 
              source={client.profilePicture 
                ? { uri: client.profilePicture } 
                : require('@/assets/images/no_client_picture.jpg')} 
              style={styles.clientImage} 
              />
              <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                <Icon name="email" size={14} color="#665" />
                <Text style={styles.contactText}>{client.email}</Text>
                </View>
                <View style={styles.contactItem}>
                <Icon name="phone" size={14} color="#665" />
                <Text style={styles.contactText}> 
                {typeof client.phone === 'number' || typeof client.phone === 'string' ? client.phone.toString() : 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                <Icon name="shopping-bag" size={16} color="#007AFF" />
                <Text style={styles.statNumber}>{client.totalOrders}</Text>
                <Text style={styles.statLabel}>orders</Text>
                </View>
                {client.lastOrderDate && (
                <Text style={styles.lastOrder}>
                  Last order: {new Date(client.lastOrderDate).toLocaleDateString()}
                </Text>
                )}
              </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={isFormModalVisible}>
        <ClientForm
          onClose={() => setIsFormModalVisible(false)}
          onSubmit={handleCreateClient}
        />
      </Modal>

      <Modal visible={!!selectedClient}>
        {selectedClient && (
          <ClientDetails
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
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
    fontFamily: 'Inter_400Regular',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
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
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#007AFF',
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  lastOrder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
  },
});
