// components/OrderDetails.tsx

import { useMemo, useState } from 'react';
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

import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Order } from '@/types';

import {
  updateOrder,
  updateOrderStatus,
} from '@/src/services/cateringOrderService';
import { formatCurrency } from '@/src/utils/costs';

import Modal from '@/components/Modal';
import OrderForm from '@/components/OrderForm';
import OrderIngredientsModal from '@/components/OrderIngredientsModal';

import { createInvoiceFromOrder } from '@/src/services/cateringInvoice.service';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function OrderDetails({
  order,
  onClose,
  onUpdated,
}: OrderDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);



  /**
   * =========================
   * NORMALISATION DES ITEMS
   * =========================
   */

  const items = useMemo(() => {
    if (!order) return [];

    // Nouveau format
    if (Array.isArray((order as any).items)) {
      return (order as any).items;
    }

    // Ancien format
    if (Array.isArray((order as any).dishes)) {
      return (order as any).dishes;
    }

    return [];
  }, [order]);



  const openInvoice = () => {
    const invoiceId = (order as any)?.invoiceId;

    if (!invoiceId) {
      Alert.alert('Information', 'Aucune facture liée à cette commande.');
      return;
    }

    router.push({
      pathname: '/(traiteur)/invoices/[id]',
      params: { id: invoiceId },
    } as any);
  };

  /**
   * =========================
   * INGREDIENTS
   * =========================
   */

  const additionalIngredients =
    order.additionalIngredients || [];

  const hasIngredientsData =
    items.length > 0 ||
    additionalIngredients.length > 0;

  /**
   * =========================
   * TOTALS
   * =========================
   */

  const calculatedTotal = useMemo(() => {
    if ((order as any)?.billedAmount > 0) {
      return (order as any).billedAmount;
    }

    const totals = (order as any)?.totals;

    if (totals?.subtotal && totals.subtotal > 0) {
      return totals.subtotal;
    }

    if (totals?.total && totals.total > 0) {
      return totals.total;
    }

    return items.reduce((sum: number, item: any) => {
      const itemTotal =
        item?.total ||
        (
          (item?.quantity || 0) *
          (item?.numberOfDays || 1) *
          (item?.unitPrice || 0)
        );

      return sum + itemTotal;
    }, 0);
  }, [items, order]);

  const billedAmount = useMemo(() => {
    // priorité au montant brut venant des totals
    if ((order as any)?.totals?.subtotal) {
      return (order as any).totals.subtotal;
    }

    // fallback calcul manuel avant remise
    return items.reduce((sum: number, item: any) => {
      const quantity = item?.quantity || 0;
      const unitPrice = item?.unitPrice || 0;

      return (
        sum +
        (
          quantity *
          (item?.numberOfDays || 1) *
          unitPrice
        )
      );
    }, 0);
  }, [items, order]);

  const deliveryDate =
    order.deliveryDate ||
    (order as any).eventDate ||
    (order as any).dateLivraison ||
    (order as any).proforma?.deliveryDate ||
    '-';

  const deliveryTime =
    order.deliveryTime ||
    (order as any).eventTime ||
    (order as any).proforma?.deliveryTime ||
    '-';

  const deliveryAddress =
    order.deliveryAddress ||
    order.address ||
    (order as any).eventLocation ||
    (order as any).proforma?.deliveryAddress ||
    '-';

  /**
   * =========================
   * STATUS COLOR
   * =========================
   */

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'En cours':
        return '#2563EB';

      case 'En préparation':
        return '#D97706';

      case 'Livré':
        return '#059669';

      default:
        return '#6B7280';
    }
  };

  const statusColor = getStatusColor(order.status);

  /**
   * =========================
   * UPDATE STATUS
   * =========================
   */

  const getNextStatus = (status?: string) => {
    switch (status) {
      case 'draft':
      case 'confirmed':
      case 'En cours':
        return 'En préparation';

      case 'En préparation':
        return 'Livré';

      case 'Livré':
        return null;

      default:
        return 'En préparation';
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const nextStatus = getNextStatus(order.status as any);

      if (!nextStatus) {
        Alert.alert(
          'Information',
          'Cette commande est déjà livrée.'
        );
        return;
      }

      Alert.alert(
        'Confirmation',
        `Voulez-vous vraiment passer la commande au statut : "${nextStatus}" ?`,
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Confirmer',
            style: 'default',
            onPress: async () => {
              try {
                await updateOrderStatus(
                  order.id,
                  nextStatus as any
                );

                Alert.alert(
                  'Succès',
                  `Commande passée à : ${nextStatus}`
                );

                await onUpdated?.();
              } catch (error) {
                console.error(error);

                Alert.alert(
                  'Erreur',
                  'Impossible de modifier le statut.'
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Erreur',
        'Impossible de modifier le statut.'
      );
    }
  };

  /**
   * =========================
   * UPDATE ORDER
   * =========================
   */

  const handleUpdateOrder = async (
    updatedOrder: Omit<
      Order,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    try {
      await updateOrder(order.id, updatedOrder as any);

      setShowEditForm(false);

      Alert.alert(
        'Succès',
        'Commande modifiée avec succès.'
      );

      await onUpdated?.();
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Erreur',
        'Impossible de modifier la commande.'
      );
    }
  };

  /**
   * =========================
   * CREATE INVOICE
   * =========================
   */

  const handleCreateInvoice = async () => {
    try {
      setLoadingInvoice(true);

      if (!order?.id) {
        Alert.alert(
          'Erreur',
          'Commande invalide.'
        );

        return;
      }

      if (items.length === 0) {
        Alert.alert(
          'Erreur',
          'Aucun élément à facturer.'
        );

        return;
      }
      if ((order as any)?.invoiceId) {
        Alert.alert(
          'Information',
          'Une facture existe déjà pour cette commande.'
        );

        return;
      }
      const invoice =
        await createInvoiceFromOrder(order as any);

      Alert.alert(
        'Succès',
        `Facture ${invoice.number} créée avec succès.`
      );

      await onUpdated?.();
    } catch (error: any) {
      console.error(error);

      Alert.alert(
        'Erreur',
        error?.message ||
        'Impossible de générer la facture.'
      );
    } finally {
      setLoadingInvoice(false);
    }
  };

  /**
   * =========================
   * OPEN PROFORMA
   * =========================
   */

  const openSourceProforma = () => {
    const proformaId =
      (order as any)?.proformaId ||
      (order as any)?.sourceProformaId;

    if (!proformaId) {
      Alert.alert(
        'Information',
        'Aucune proforma liée.'
      );

      return;
    }

    router.push({
      pathname: '/(traiteur)/proformas/[id]',
      params: {
        id: proformaId,
      },
    });
  };

  return (
    <>
      <View style={styles.container}>
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onClose}
          >
            <MaterialIcons
              name="arrow-back"
              size={22}
              color="#111827"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Détails commande
            </Text>

            <Text style={styles.headerSubtitle}>
              {(order as any).number ||
                (order as any).orderNumber ||
                'CMD-XXXX'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              setShowEditForm(true)
            }
          >
            <MaterialIcons
              name="edit"
              size={22}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* HERO */}

          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>
                  {order.designation ||
                    'Commande traiteur'}
                </Text>

                <Text style={styles.heroSmallLabel}>
                  Montant facturé
                </Text>

                <Text style={styles.heroAmount}>
                  {formatCurrency(billedAmount)}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      `${statusColor}18`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: statusColor,
                    },
                  ]}
                >
                  {order.status}
                </Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroGrid}>
              <View style={styles.heroItem}>
                <MaterialIcons
                  name="event"
                  size={18}
                  color="#9CA3AF"
                />

                <Text style={styles.heroItemText}>
                  {deliveryDate}
                </Text>
              </View>

              <View style={styles.heroItem}>
                <MaterialIcons
                  name="schedule"
                  size={18}
                  color="#9CA3AF"
                />

                <Text style={styles.heroItemText}>
                  {deliveryTime}
                </Text>
              </View>
            </View>
          </View>

          {/* ACTIONS */}

          <View style={styles.actionsGrid}>
            {(order as any)?.invoiceId ? (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={openInvoice}
              >
                <MaterialIcons
                  name="receipt-long"
                  size={20}
                  color="#059669"
                />

                <Text style={styles.secondaryActionText}>
                  Voir facture
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={handleCreateInvoice}
                disabled={loadingInvoice}
              >
                {loadingInvoice ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons
                      name="receipt-long"
                      size={20}
                      color="#fff"
                    />

                    <Text style={styles.primaryActionText}>
                      Créer facture
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={
                openSourceProforma
              }
            >
              <MaterialIcons
                name="visibility"
                size={20}
                color="#2563EB"
              />

              <Text
                style={
                  styles.secondaryActionText
                }
              >
                Voir proforma
              </Text>
            </TouchableOpacity>



            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() =>
                router.push({
                  pathname: '/(traiteur)/orders/operational/[id]',
                  params: { id: order.id },
                } as any)
              }
            >
              <MaterialIcons name="assignment" size={20} color="#7C3AED" />
              <Text style={styles.secondaryActionText}>Fiche équipe</Text>
            </TouchableOpacity>
          </View>

          {/* STATUS BUTTON */}

          {order.status !== 'Livré' && (
            <TouchableOpacity
              style={[
                styles.nextStatusButton,
                {
                  backgroundColor:
                    getStatusColor(
                      getNextStatus(order.status as any) as any
                    ),
                },
              ]}
              onPress={
                handleUpdateStatus
              }
            >
              <Text
                style={
                  styles.nextStatusText
                }
              >
                Passer à :
                {' '}
                {
                  getNextStatus(order.status as any) as any
                }
              </Text>

              <MaterialIcons
                name="arrow-forward"
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          )}

          {/* CLIENT */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Client
            </Text>

            <View style={styles.clientRow}>
              <Image
                source={
                  order.client
                    ?.profilePicture
                    ? {
                      uri: order.client
                        .profilePicture,
                    }
                    : require('@/assets/images/no_client_picture.jpg')
                }
                style={styles.clientImage}
              />

              <View style={styles.clientInfo}>
                <Text
                  style={
                    styles.clientName
                  }
                >
                  {order.client?.name ||
                    'Client non défini'}
                </Text>

                {!!order.client
                  ?.phone && (
                    <Text
                      style={
                        styles.clientMeta
                      }
                    >
                      {
                        order.client
                          .phone
                      }
                    </Text>
                  )}

                {!!order.client
                  ?.email && (
                    <Text
                      style={
                        styles.clientMeta
                      }
                    >
                      {
                        order.client
                          .email
                      }
                    </Text>
                  )}
              </View>
            </View>
          </View>

          {/* LIVRAISON */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Livraison
            </Text>

            <View style={styles.infoLine}>
              <MaterialIcons
                name="location-on"
                size={18}
                color="#6B7280"
              />

              <Text style={styles.infoText}>
                {deliveryAddress}
              </Text>
            </View>

            <View style={styles.infoLine}>
              <MaterialIcons
                name="event"
                size={18}
                color="#6B7280"
              />

              <Text style={styles.infoText}>
                {deliveryDate}
              </Text>
            </View>

            <View style={styles.infoLine}>
              <MaterialIcons
                name="schedule"
                size={18}
                color="#6B7280"
              />

              <Text style={styles.infoText}>
                {deliveryTime}
              </Text>
            </View>
          </View>

          {/* ITEMS */}

          <View style={styles.card}>
            <View
              style={
                styles.sectionHeaderRow
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Éléments commandés
              </Text>

              <Text
                style={
                  styles.countBadge
                }
              >
                {items.length}
              </Text>
            </View>

            {items.length > 0 ? (
              items.map(
                (
                  item: any,
                  index: number
                ) => {
                  const itemName =
                    item?.dish?.name ||
                    item?.label ||
                    item?.name ||
                    'Élément';

                  const quantity =
                    item?.quantity || 0;

                  const total =
                    item?.total ||
                    (
                      quantity *
                      (item?.numberOfDays || 1) *
                      (item?.unitPrice || 0)
                    );

                  return (
                    <View
                      key={
                        item?.id ||
                        item?.dish?.id ||
                        index
                      }
                      style={
                        styles.dishRow
                      }
                    >
                      <View
                        style={
                          styles.dishIcon
                        }
                      >
                        <MaterialIcons
                          name="restaurant"
                          size={18}
                          color="#2563EB"
                        />
                      </View>

                      <View
                        style={
                          styles.dishInfo
                        }
                      >
                        <Text
                          style={
                            styles.dishName
                          }
                        >
                          {itemName}
                        </Text>

                        <Text style={styles.dishMeta}>
                          Qté : {quantity}
                          {' • '}
                          Jours : {item?.numberOfDays || 1}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.itemAmount
                        }
                      >
                        {formatCurrency(
                          total
                        )}
                      </Text>
                    </View>
                  );
                }
              )
            ) : (
              <Text style={styles.emptyText}>
                Aucun élément
              </Text>
            )}
          </View>
          {/* PLATS COMMANDES */}
          {Array.isArray((order as any).operationalDishes) &&
            (order as any).operationalDishes.length > 0 && (
              <View style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Plats à produire
                  </Text>

                  <Text style={styles.countBadge}>
                    {(order as any).operationalDishes.length}
                  </Text>
                </View>

                {(order as any).operationalDishes.map((dish: any, index: number) => (
                  <View
                    key={dish?.dishId || dish?.id || index}
                    style={styles.dishRow}
                  >
                    <View style={styles.dishIcon}>
                      <MaterialIcons
                        name="restaurant-menu"
                        size={18}
                        color="#059669"
                      />
                    </View>

                    <View style={styles.dishInfo}>
                      <Text style={styles.dishName}>
                        {dish?.name || 'Plat'}
                      </Text>

                     
                    </View>

                    <Text style={styles.quantityBadge}>
                       x {dish?.quantity || 0}
                    </Text>
                  </View>
                ))}
              </View>
            )}


          {/* INGREDIENTS */}

          {additionalIngredients.length >
            0 && (
              <View style={styles.card}>
                <View
                  style={
                    styles.sectionHeaderRow
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Ingrédients
                    supplémentaires
                  </Text>

                  <Text
                    style={
                      styles.countBadge
                    }
                  >
                    {
                      additionalIngredients.length
                    }
                  </Text>
                </View>

                {additionalIngredients.map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <View
                      key={
                        item?.ingredient
                          ?.id || index
                      }
                      style={
                        styles.ingredientRow
                      }
                    >
                      <Text
                        style={
                          styles.ingredientName
                        }
                      >
                        {item?.ingredient
                          ?.name ||
                          'Ingrédient'}
                      </Text>

                      <Text
                        style={
                          styles.ingredientQty
                        }
                      >
                        {item?.quantity || 0}
                        {' '}
                        {item?.ingredient
                          ?.unit || ''}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}

          {/* TOTAL */}

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>
              Montant facturé
            </Text>

            <Text style={styles.totalValue}>
              {formatCurrency(
                calculatedTotal
              )}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* EDIT MODAL */}

      <Modal visible={showEditForm}>
        <OrderForm
          order={order}
          onClose={() =>
            setShowEditForm(false)
          }
          onSubmit={handleUpdateOrder}
        />
      </Modal>

      {/* INGREDIENTS MODAL */}

      <OrderIngredientsModal
        visible={showIngredientsModal}
        order={order as any}
        onClose={() => setShowIngredientsModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
  },

  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  heroLabel: {
    color: '#D1D5DB',
    fontSize: 13,
  },

  heroAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  statusText: {
    fontWeight: '800',
    fontSize: 12,
  },

  heroDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 16,
  },

  heroGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },

  heroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },

  heroItemText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  primaryAction: {
    flexGrow: 1,
    minWidth: 150,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  secondaryAction: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  secondaryActionText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 14,
  },

  nextStatusButton: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  nextStatusText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    color: '#3730A3',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },

  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  clientImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E5E7EB',
  },

  clientInfo: {
    flex: 1,
  },

  clientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  clientMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },

  infoLine: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  dishIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dishInfo: {
    flex: 1,
  },

  dishName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  dishMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  heroSmallLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    marginBottom: 4,
  },

  itemAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },

  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  ingredientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  ingredientQty: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },

  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },

  totalCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },

  totalLabel: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '700',
    marginBottom: 4,
  },

  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#047857',
  },
  quantityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
  },
});