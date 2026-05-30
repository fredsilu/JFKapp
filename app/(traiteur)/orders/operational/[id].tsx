//app/(traiteur)/orders/operational/[id].tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';

import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { shareOperationalOrderPdf } from '@/src/services/operationalPdf.service';
import { MaterialIcons } from '@expo/vector-icons';

import { getOrderById } from '@/src/services/cateringOrderService';
import { shareOperationalManagementPdf } from '@/src/services/operationalManagementPdf.service';

export default function OperationalOrderSheetScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      if (!id) {
        Alert.alert('Erreur', 'Identifiant de commande manquant');
        router.replace('/(traiteur)/orders');
        return;
      }

      setLoading(true);

      const data = await getOrderById(id);

      if (!data) {
        Alert.alert('Erreur', 'Commande introuvable');
        router.replace('/(traiteur)/orders');
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('❌ load operational order error:', error);
      Alert.alert('Erreur', 'Impossible de charger la fiche équipe');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );



  const items = useMemo(() => {
    if (!order) return [];

    if (
      Array.isArray(order.operationalDishes) &&
      order.operationalDishes.length > 0
    ) {
      return order.operationalDishes;
    }

    if (
      Array.isArray(order.items) &&
      order.items.length > 0
    ) {
      return order.items;
    }

    if (
      Array.isArray(order.dishes) &&
      order.dishes.length > 0
    ) {
      return order.dishes;
    }

    return [];
  }, [order]);

  const deliveryDate =
    order?.deliveryDate ||
    order?.dateLivraison ||
    order?.eventDate ||
    '-';

  const deliveryTime =
    order?.deliveryTime ||
    order?.eventTime ||
    '-';

  const deliveryAddress =
    order?.deliveryAddress ||
    order?.address ||
    order?.eventLocation ||
    '-';

  const orderNumber =
    order?.number ||
    order?.orderNumber ||
    'CMD-XXXX';


  const additionalIngredients = useMemo(() => {
    if (
      Array.isArray(order?.operationalAdditionalIngredients) &&
      order.operationalAdditionalIngredients.length > 0
    ) {
      return order.operationalAdditionalIngredients;
    }

    if (
      Array.isArray(order?.additionalIngredients) &&
      order.additionalIngredients.length > 0
    ) {
      return order.additionalIngredients;
    }

    return [];
  }, [order]);

  const productionCostRatio = useMemo(() => {
    const billedAmount =
      order?.billedAmount ||
      order?.totals?.subtotal ||
      order?.totals?.total ||
      0;

    const productionCost =
      order?.operationalCosts?.totalProductionCost || 0;

    if (!billedAmount) return 0;

    return (productionCost / billedAmount) * 100;
  }, [order]);

  const consolidatedIngredients = useMemo(() => {
    const map = new Map<string, any>();

    const addIngredient = (
      id: string,
      name: string,
      unit: string,
      quantity: number,
      unitPrice: number = 0
    ) => {
      const key = id || `${name}-${unit}`;

      if (!map.has(key)) {
        map.set(key, {
          id,
          name,
          unit,
          quantity: 0,
          unitPrice,
          total: 0,
        });
      }

      const existing = map.get(key);

      existing.quantity = Number((existing.quantity + quantity).toFixed(2));
      existing.unitPrice = existing.unitPrice || unitPrice;
      existing.total = Number((existing.quantity * existing.unitPrice).toFixed(2));
    };

    if (Array.isArray(order?.operationalDishes)) {
      order.operationalDishes.forEach((dish: any) => {
        const dishQuantity = Number(dish.quantity || 0);

        if (Array.isArray(dish.ingredients)) {
          dish.ingredients.forEach((item: any) => {
            const ingredientQuantityPerDish = Number(item.quantity || 0);

            addIngredient(
              item.id || item.ingredientId || item.name,
              item.name || 'Ingrédient',
              item.unit || '',
              ingredientQuantityPerDish * dishQuantity,
              Number(item.unitPrice || item.price || 0)
            );
          });
        }
      });
    }

    if (Array.isArray(additionalIngredients)) {
      additionalIngredients.forEach((item: any) => {
        addIngredient(
          item.id || item.ingredientId || item.ingredient?.id || item.name,
          item.name || item.ingredient?.name || 'Ingrédient',
          item.unit || item.ingredient?.unit || '',
          Number(item.quantity || 0),
          Number(item.unitPrice || item.price || item.ingredient?.price || 0)
        );
      });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [order, additionalIngredients]);

  const formatMoney = (value: number) => {
    return `${Number(value || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} $`;
  };

  const handleSharePdf = async () => {
    if (!order) {
      Alert.alert('Erreur', 'Aucune commande à partager');
      return;
    }

    await shareOperationalOrderPdf(order);
  };
  const handleShareManagementPdf = async () => {
    if (!order) {
      Alert.alert('Erreur', 'Aucune commande à partager');
      return;
    }

    await shareOperationalManagementPdf(order);
  };

  function CostLine({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
    return (
      <View style={styles.costLine}>
        <Text style={styles.costLabel}>{label}</Text>
        <Text style={styles.costValue}>{value}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement fiche équipe...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Fiche équipe introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            if (!id) {
              router.replace('/(traiteur)/orders');
              return;
            }

            router.replace({
              pathname: '/(traiteur)/orders/[id]',
              params: { id },
            });
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleSharePdf}
        >
          <MaterialIcons name="picture-as-pdf" size={22} color="#DC2626" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleShareManagementPdf}
        >
          <MaterialIcons name="assessment" size={22} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Fiche équipe</Text>
          <Text style={styles.headerSubtitle}>{orderNumber}</Text>
        </View>
      </View>


      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.noticeCard}>
          <MaterialIcons name="info" size={20} color="#2563EB" />
          <Text style={styles.noticeText}>
            Fiche destinée aux équipes cuisine et logistique.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.mainText}>
            {order.client?.name || order.name || 'Client non défini'}
          </Text>

          {!!order.designation && (
            <Text style={styles.secondaryText}>{order.designation}</Text>
          )}

          {!!order.comment && (
            <View style={styles.commentBox}>
              <Text style={styles.commentTitle}>Commentaire</Text>
              <Text style={styles.commentText}>{order.comment}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations générales</Text>

          <InfoLine icon="event" label="Date" value={deliveryDate} />
          <InfoLine icon="schedule" label="Heure" value={deliveryTime} />
          <InfoLine icon="location-on" label="Lieu" value={deliveryAddress} />
          <InfoLine icon="groups" label="Convives" value={`${order.guestCount || '-'} personne(s)`} />
          <InfoLine icon="flag" label="Statut" value={order.status || '-'} />
        </View>



        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleInline}>Éléments à préparer</Text>
            <Text style={styles.badge}>{items.length}</Text>
          </View>

          {items.length > 0 ? (
            items.map((item: any, index: number) => {
              const label =
                item?.dish?.name ||
                item?.label ||
                item?.name ||
                'Élément';

              const quantity = item?.quantity || 0;
              const days = item?.numberOfDays || item?.days || null;

              return (
                <View key={item?.id || item?.dish?.id || index} style={styles.itemRow}>
                  <View style={styles.itemIcon}>
                    <MaterialIcons name="restaurant" size={18} color="#2563EB" />
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{label}</Text>

                    <Text style={styles.itemMeta}>
                      Quantité : {quantity}
                      {days ? ` × ${days} jour(s)` : ''}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Aucun élément renseigné.</Text>
          )}
        </View>

        {Array.isArray(additionalIngredients) &&
          additionalIngredients.length > 0 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleInline}>Ingrédients supplémentaires</Text>
                <Text style={styles.badge}>{additionalIngredients.length}</Text>
              </View>

              {additionalIngredients.map((item: any, index: number) => {
                const name =
                  item?.name ||
                  item?.ingredient?.name ||
                  'Ingrédient';

                const quantity =
                  item?.quantity || 0;

                const unit =
                  item?.unit ||
                  item?.ingredient?.unit ||
                  '';

                return (
                  <View
                    key={item?.id || item?.ingredientId || item?.ingredient?.id || index}
                    style={styles.ingredientRow}
                  >
                    <Text style={styles.ingredientName}>
                      {name}
                    </Text>

                    <Text style={styles.ingredientQty}>
                      {quantity} {unit}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        {consolidatedIngredients.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleInline}>
                Liste consolidée des ingrédients
              </Text>
              <Text style={styles.badge}>
                {consolidatedIngredients.length}
              </Text>
            </View>

            {consolidatedIngredients.map((item: any, index: number) => (
              <View key={item.id || index} style={styles.consolidatedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientMeta}>
                    {item.quantity} {item.unit} × {formatMoney(item.unitPrice)}
                  </Text>
                </View>

                <Text style={styles.ingredientTotal}>
                  {formatMoney(item.total)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {order.operationalCosts && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Coûts opérationnels
            </Text>

            <CostLine
              label="Coût des plats"
              value={formatMoney(order.operationalCosts.dishesCost)}
            />

            <CostLine
              label="Ingrédients supp."
              value={formatMoney(order.operationalCosts.additionalIngredientsCost)}
            />

            <View style={styles.totalCostBox}>
              <Text style={styles.totalCostLabel}>Total</Text>
              <Text style={styles.totalCostValue}>
                {formatMoney(order.operationalCosts.totalProductionCost)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Performance production
          </Text>

          <View
            style={[
              styles.ratioBadge,
              {
                backgroundColor:
                  productionCostRatio < 35
                    ? '#DCFCE7'
                    : productionCostRatio <= 50
                      ? '#FEF3C7'
                      : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.ratioText,
                {
                  color:
                    productionCostRatio < 35
                      ? '#166534'
                      : productionCostRatio <= 50
                        ? '#92400E'
                        : '#991B1B',
                },
              ]}
            >
              Taux coût production :
              {' '}
              {productionCostRatio.toFixed(1)}%
            </Text>
          </View>

          <Text style={styles.ratioLegend}>
            {'< 35% : bon • 35–50% : attention • > 50% : dangereux'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Instructions équipe</Text>

          <ChecklistItem text="Vérifier les quantités avant préparation." />
          <ChecklistItem text="Confirmer le lieu et l’heure de livraison." />
          <ChecklistItem text="Préparer les emballages / contenants nécessaires." />
          <ChecklistItem text="Informer le responsable en cas d’écart ou de rupture." />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoLine}>
      <MaterialIcons name={icon} size={18} color="#6B7280" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <View style={styles.checkRow}>
      <MaterialIcons name="check-circle" size={18} color="#059669" />
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  loadingText: {
    marginTop: 10,
    color: '#4B5563',
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

  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },

  noticeCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },

  noticeText: {
    flex: 1,
    color: '#1E3A8A',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },

  sectionTitleInline: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  badge: {
    minWidth: 32,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
  },

  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  infoLabel: {
    width: 80,
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },

  infoValue: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },

  mainText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  secondaryText: {
    marginTop: 6,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },

  commentBox: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },

  commentTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 4,
  },

  commentText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  itemMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
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

  checkRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 7,
  },

  checkText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },

  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },

  ratioBadge: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },

  ratioText: {
    fontSize: 15,
    fontWeight: '900',
  },

  ratioLegend: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },

  ingredientMeta: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  consolidatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },

  ingredientTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#047857',
  },

  totalCostBox: {
    marginTop: 12,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
  },

  totalCostLabel: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '700',
  },

  totalCostValue: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  costLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  costLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  costValue: {
    flexShrink: 0,
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'right',
  },
});