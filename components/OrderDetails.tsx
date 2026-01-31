import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Order } from '@/types';
import { updateOrder, updateOrderStatus } from '@/src/services/firestore';
import { calculateOrderTotalCost, formatCurrency } from '@/src/utils/costs';
import Modal from '@/components/Modal';
import OrderForm from '@/components/OrderForm';
import OrderIngredientsModal from '@/components/OrderIngredientsModal';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
}

export default function OrderDetails({ order, onClose }: OrderDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);

  const STATUS_TRANSITIONS: Record<Order['status'], Order['status']> = {
    'En cours': 'En préparation',
    'En préparation': 'Livré',
    'Livré': 'Livré',
  };

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

  const handleUpdateStatus = async () => {
    const nextStatus = STATUS_TRANSITIONS[order.status];
    if (nextStatus !== order.status) {
      await updateOrderStatus(order.id, nextStatus);
    }
  };

  const handleUpdateOrder = async (updatedOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    await updateOrder(order.id, updatedOrder);
    setShowEditForm(false);
  };

  return (
    <>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Détails de la commande</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowIngredientsModal(true)}>
              <MaterialIcons name="list" size={22} color="#34C759" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEditForm(true)}>
              <MaterialIcons name="edit" size={22} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* FACTURATION */}
          {(order.designation || order.billedAmount) && (
            <View style={[styles.sectionCard, styles.bgBlue]}>
              <Text style={styles.sectionTitle}>Facturation</Text>
              {order.designation && <Text style={styles.line}>• {order.designation}</Text>}
              {order.billedAmount !== undefined && (
                <Text style={styles.line}>• Montant facturé : {formatCurrency(order.billedAmount)}</Text>
              )}
            </View>
          )}

          {/* STATUT */}
          <View style={[styles.sectionCard, styles.bgGray]}>
            <Text style={styles.sectionTitle}>Statut</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                <Text style={{ color: getStatusColor(order.status), fontWeight: '600' }}>
                  {order.status}
                </Text>
              </View>
              {order.status !== 'Livré' && (
                <TouchableOpacity
                  style={[styles.updateBtn, { backgroundColor: getStatusColor(STATUS_TRANSITIONS[order.status]) }]}
                  onPress={handleUpdateStatus}
                >
                  <Text style={styles.updateBtnText}>
                    → {STATUS_TRANSITIONS[order.status]}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* CLIENT */}
          <View style={[styles.sectionCard, styles.bgWhite]}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.clientRow}>
              <Image
                source={
                  order.client.profilePicture
                    ? { uri: order.client.profilePicture }
                    : require('@/assets/images/no_client_picture.jpg')
                }
                style={styles.clientImage}
              />
              <View>
                <Text style={styles.clientName}>{order.client.name}</Text>
                <Text style={styles.clientMeta}>{order.client.phone}</Text>
                <Text style={styles.clientMeta}>{order.client.email}</Text>
              </View>
            </View>
          </View>

          {/* LIVRAISON */}
          <View style={[styles.sectionCard, styles.bgGray]}>
            <Text style={styles.sectionTitle}>Livraison</Text>
            <Text style={styles.line}>📅 {order.deliveryDate}</Text>
            <Text style={styles.line}>⏰ {order.deliveryTime}</Text>
            <Text style={styles.line}>📍 {order.address}</Text>
          </View>

          {/* PLATS */}
          <View style={[styles.sectionCard, styles.bgWhite]}>
            <Text style={styles.sectionTitle}>Plats commandés</Text>
            {order.dishes.map(({ dish, quantity }) => (
              <Text key={dish.id} style={styles.line}>
                • {quantity} × {dish.name}
              </Text>
            ))}
          </View>

          {/* TOTAL */}
          <View style={[styles.sectionCard, styles.bgGreen]}>
            <Text style={styles.totalLabel}>Total de la commande</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(calculateOrderTotalCost(order))}
            </Text>
          </View>
        </ScrollView>
      </View>

      <Modal visible={showEditForm}>
        <OrderForm order={order} onClose={() => setShowEditForm(false)} onSubmit={handleUpdateOrder} />
      </Modal>

      <OrderIngredientsModal
        visible={showIngredientsModal}
        order={order}
        onClose={() => setShowIngredientsModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 16 },
  scrollContent: { padding: 16, gap: 16 },

  sectionCard: {
    borderRadius: 12,
    padding: 16,
  },
  bgWhite: { backgroundColor: '#fff' },
  bgGray: { backgroundColor: '#f0f0f0' },
  bgBlue: { backgroundColor: '#e9f2ff' },
  bgGreen: { backgroundColor: '#e9f7ef' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  line: { fontSize: 14, color: '#333', marginBottom: 4 },

  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  updateBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  updateBtnText: { color: '#fff', fontWeight: '600' },

  clientRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  clientImage: { width: 56, height: 56, borderRadius: 28 },
  clientName: { fontSize: 16, fontWeight: '600' },
  clientMeta: { fontSize: 14, color: '#666' },

  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#2e7d32' },
});
