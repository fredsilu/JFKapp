import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
//import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { useOrders } from '@/src/hooks/useFirestore';
import { calculateOrderTotalCost, formatCurrency } from '@/src/utils/costs';
import Modal from '@/components/Modal';
import OrderDetails from '@/components/OrderDetails';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Order } from '@/types';

type FilterStatus = 'all' | 'En cours' | 'En préparation' | 'Livré';

export default function AllOrdersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const { data: orders = [], loading, error } = useOrders({
    orderBy: ['createdAt', 'desc']
  });

  // Get the current order from the updated list
  const selectedOrder = selectedOrderId 
    ? orders.find(o => o.id === selectedOrderId) || null
    : null;

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.client?.name && order.client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.address && order.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Order['status']) => {
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

  const calculateStats = () => {
    const total = filteredOrders.reduce((acc, order) => acc + calculateOrderTotalCost(order), 0);
    const averagePerOrder = total / (filteredOrders.length || 1);
    const delivered = filteredOrders.filter(order => order.status === 'Livré').length;
    const inProgress = filteredOrders.filter(order => order.status !== 'Livré').length;

    return {
      total,
      averagePerOrder,
      delivered,
      inProgress
    };
  };

  const stats = calculateStats();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Erreur lors du chargement des commandes" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.title}>Historique des commandes</Text>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une commande..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filters}>
          {(['all', 'En cours', 'En préparation', 'Livré'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                selectedStatus === status && styles.filterChipSelected
              ]}
              onPress={() => setSelectedStatus(status)}>
              <Text style={[
                styles.filterChipText,
                selectedStatus === status && styles.filterChipTextSelected
              ]}>
                {status === 'all' ? 'Toutes' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView >
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(stats.total)}</Text>
            <Text style={styles.statLabel}>Total des commandes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(stats.averagePerOrder)}</Text>
            <Text style={styles.statLabel}>Moyenne par commande</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.delivered}</Text>
            <Text style={styles.statLabel}>Commandes livrées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>Commandes en cours</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
      
        {filteredOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => setSelectedOrderId(order.id)}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.clientName}>{order.client.name}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(order.status)}15` }
              ]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status}
                </Text>
              </View>
            </View>

            <View style={styles.orderContent}>
              <View style={styles.orderItems}>
                {order.dishes.map(({ dish, quantity }) => (
                  <Text key={dish.id} style={styles.itemText}>
                    • {quantity}x {dish.name}
                  </Text>
                ))}
                {order.additionalIngredients.map(({ ingredient, quantity }) => (
                  <Text key={ingredient.id} style={styles.itemText}>
                    • {quantity} {ingredient.unit} {ingredient.name}
                  </Text>
                ))}
                {/* Facturation */}
                {order.designation && (
                  <Text style={styles.itemText}>• Désignation : {order.designation}</Text>
                )}
                {order.billedAmount !== undefined && (
                  <Text style={styles.itemText}>• Montant facturé : {formatCurrency(order.billedAmount)}</Text>
                )}
                {order.invoiceDate && (
                  <Text style={styles.itemText}>• Date de facture : {order.invoiceDate}</Text>
                )}
                {order.paymentDate && (
                  <Text style={styles.itemText}>• Date de paiement : {order.paymentDate}</Text>
                )}
              </View>

              <View style={styles.orderMeta}>
                <View style={styles.metaItem}>
                  <Icon name="event" size={16} color="#666" />
                  <Text style={styles.metaText}>{order.deliveryDate}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="access-time" size={16} color="#666" />
                  <Text style={styles.metaText}>à {order.deliveryTime}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="location-on" size={16} color="#666" />
                  <Text style={styles.metaText}>{order.address}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="attach-money" size={16} color="#007AFF" />
                  <Text style={[styles.metaText, styles.priceText]}>
                    {formatCurrency(calculateOrderTotalCost(order))}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        </View>
      </ScrollView>

      <Modal visible={!!selectedOrder}>
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#1a1a1a',
  },
  filtersContainer: {
    marginTop: 16,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e6e6e6',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderContent: {
    marginTop: 8,
  },
  orderItems: {
    marginBottom: 8,
  },
  itemText: {
    fontSize: 12,
    color: '#1a1a1a',
  },
  orderMeta: {
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  priceText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
