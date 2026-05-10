//components/OrderDetails.tsx

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { Order } from '@/types';
import { updateOrder, updateOrderStatus } from '@/src/services/firestore';
import { calculateOrderTotalCost, formatCurrency } from '@/src/utils/costs';
import Modal from '@/components/Modal';
import OrderForm from '@/components/OrderForm';
import OrderIngredientsModal from '@/components/OrderIngredientsModal';
import {
  createDocumentFromOrder,
  DocumentType,
} from '@/src/services/cateringDocumentService';
import { useState } from 'react';

interface OrderDetailsProps {

  order: Order;
  onClose: () => void;
  onUpdated?: () => void;
}


export default function OrderDetails({ order, onClose, onUpdated }: OrderDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [loadingDocument, setLoadingDocument] = useState<DocumentType | null>(null);

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
    try {
      const nextStatus = STATUS_TRANSITIONS[order.status];
      if (nextStatus !== order.status) {
        await updateOrderStatus(order.id, nextStatus);
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut.');
    }
  };

  const handleUpdateOrder = async (
    updatedOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await updateOrder(order.id, updatedOrder);

      setShowEditForm(false);

      Alert.alert('Succès', 'Commande modifiée avec succès.');

      onUpdated?.();
    } catch (error) {
      console.error('Erreur mise à jour commande:', error);
      Alert.alert('Erreur', 'Impossible de modifier la commande.');
    }
  };

  const calculateDishUnitPrice = (dish: any) => {
    if (!dish?.ingredients || dish.ingredients.length === 0) return 0;

    return dish.ingredients.reduce((sum: number, item: any) => {
      const ingredientPrice = Number(item.ingredient?.price || 0);
      const quantity = Number(item.quantity || 0);

      return sum + ingredientPrice * quantity;
    }, 0);
  };
  const handleCreateDocument = async (type: DocumentType) => {
    try {
      setLoadingDocument(type);

      const items = (order.dishes || []).map((d) => {
        const unitPrice = calculateDishUnitPrice(d.dish);
        const quantity = Number(d.quantity || 0);
        const total = quantity * unitPrice;

        return {
          label: d.dish?.name || d.name || 'Plat',
          quantity,
          unitPrice,
          total,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const additionalCost = calculateOrderTotalCost({
        ...order,
        dishes: [],
        additionalIngredients: order.additionalIngredients || [],
      });

      const total = subtotal + additionalCost;

      const orderForDocument = {
        ...order,
        items,
        totals: {
          subtotal: total,
          discount: 0,
          total,
          currency: 'USD',
        },
      };

      console.log('ORDER FOR DOCUMENT:', orderForDocument);

      await createDocumentFromOrder(orderForDocument as any, type);

      Alert.alert(
        'Succès',
        type === 'proforma'
          ? 'Proforma générée avec succès'
          : 'Facture générée avec succès'
      );
    } catch (error) {
      console.error('Erreur génération document:', error);
      Alert.alert('Erreur', 'Erreur génération document');
    } finally {
      setLoadingDocument(null);
    }
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
          <View style={[styles.sectionCard, styles.bgBlue]}>
            <Text style={styles.sectionTitle}>Facturation</Text>

            {order.designation ? (
              <Text style={styles.line}>• {order.designation}</Text>
            ) : (
              <Text style={styles.line}>• Aucune désignation</Text>
            )}

            {order.billedAmount !== undefined ? (
              <Text style={styles.billedAmount}>
                • Montant facturé : {formatCurrency(order.billedAmount)}
              </Text>
            ) : null}

            <View style={styles.documentsRow}>
              <TouchableOpacity
                style={[styles.docButton, styles.proformaButton]}
                onPress={() => {
                  console.log("CLICK PROFORMA");
                  handleCreateDocument('proforma');
                }}
                disabled={loadingDocument !== null}
              >
                {loadingDocument === 'proforma' ? (
                  <ActivityIndicator size="small" color="#0b5ed7" />
                ) : (
                  <>
                    <MaterialIcons name="description" size={18} color="#0b5ed7" />
                    <Text style={styles.proformaButtonText}>Proforma</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.docButton, styles.invoiceButton]}
                onPress={() => handleCreateDocument('invoice')}
                disabled={loadingDocument !== null}
              >
                {loadingDocument === 'invoice' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="receipt-long" size={18} color="#fff" />
                    <Text style={styles.invoiceButtonText}>Facture</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* STATUT */}
          <View style={[styles.sectionCard, styles.bgGray]}>
            <Text style={styles.sectionTitle}>Statut</Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(order.status)}20` },
                ]}
              >
                <Text
                  style={{
                    color: getStatusColor(order.status),
                    fontWeight: '600',
                  }}
                >
                  {order.status}
                </Text>
              </View>

              {order.status !== 'Livré' && (
                <TouchableOpacity
                  style={[
                    styles.updateBtn,
                    {
                      backgroundColor: getStatusColor(
                        STATUS_TRANSITIONS[order.status]
                      ),
                    },
                  ]}
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
                  order.client?.profilePicture
                    ? { uri: order.client.profilePicture }
                    : require('@/assets/images/no_client_picture.jpg')
                }
                style={styles.clientImage}
              />

              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{order.client?.name || '-'}</Text>
                {!!order.client?.phone && (
                  <Text style={styles.clientMeta}>{order.client.phone}</Text>
                )}
                {!!order.client?.email && (
                  <Text style={styles.clientMeta}>{order.client.email}</Text>
                )}
              </View>
            </View>
          </View>

          {/* LIVRAISON */}
          <View style={[styles.sectionCard, styles.bgGray]}>
            <Text style={styles.sectionTitle}>Livraison</Text>
            <Text style={styles.line}>📅 {order.deliveryDate || '-'}</Text>
            <Text style={styles.line}>⏰ {order.deliveryTime || '-'}</Text>
            <Text style={styles.line}>📍 {order.address || '-'}</Text>
          </View>

          {/* PLATS */}
          <View style={[styles.sectionCard, styles.bgWhite]}>
            <Text style={styles.sectionTitle}>Plats commandés</Text>

            {order.dishes && order.dishes.length > 0 ? (
              order.dishes.map(({ dish, quantity }) => (
                <Text key={dish.id} style={styles.line}>
                  • {quantity} × {dish.name}
                </Text>
              ))
            ) : (
              <Text style={styles.line}>Aucun plat sélectionné</Text>
            )}
          </View>

          {/* TOTAL */}
          <View style={[styles.sectionCard, styles.bgGreen]}>
            <Text style={styles.totalLabel}>Coût de la commande</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(calculateOrderTotalCost(order))}
            </Text>
          </View>
        </ScrollView>
      </View>

      <Modal visible={showEditForm}>
        <OrderForm
          order={order}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdateOrder}
        />
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  scrollContent: {
    padding: 16,
    gap: 16,
  },

  sectionCard: {
    borderRadius: 12,
    padding: 16,
  },

  bgWhite: {
    backgroundColor: '#fff',
  },

  bgGray: {
    backgroundColor: '#f0f0f0',
  },

  bgBlue: {
    backgroundColor: '#e9f2ff',
  },

  bgGreen: {
    backgroundColor: '#e9f7ef',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },

  line: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },

  billedAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b5ed7',
    marginTop: 4,
    marginBottom: 12,
  },

  documentsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    flexWrap: 'wrap',
  },

  docButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  proformaButton: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },

  invoiceButton: {
    backgroundColor: '#0b5ed7',
  },

  proformaButtonText: {
    color: '#0b5ed7',
    fontWeight: '700',
  },

  invoiceButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  updateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  updateBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  clientRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  clientInfo: {
    flex: 1,
  },

  clientImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  clientName: {
    fontSize: 16,
    fontWeight: '600',
  },

  clientMeta: {
    fontSize: 14,
    color: '#666',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },

  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2e7d32',
  },
});