//app/(traiteur)/orders/operational/[id].tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { getOrderById } from '@/src/services/cateringOrderService';
import app from '@/lib/firebase';

export default function OperationalOrderSheetScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      if (!id) {
        Alert.alert('Erreur', 'Identifiant de commande manquant');
        router.back();
        return;
      }

      setLoading(true);

      const data = await getOrderById(id);

      if (!data) {
        Alert.alert('Erreur', 'Commande introuvable');
        router.back();
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

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => {
    if (!order) return [];
    if (Array.isArray(order.items)) return order.items;
    if (Array.isArray(order.dishes)) return order.dishes;
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
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
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
            Fiche destinée aux équipes cuisine et logistique. Aucun montant financier n’est affiché.
          </Text>
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
          <Text style={styles.sectionTitle}>Client / événement</Text>

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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Éléments à préparer</Text>
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

        {Array.isArray(order.additionalIngredients) &&
          order.additionalIngredients.length > 0 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ingrédients supplémentaires</Text>
                <Text style={styles.badge}>{order.additionalIngredients.length}</Text>
              </View>

              {order.additionalIngredients.map((item: any, index: number) => (
                <View key={item?.ingredient?.id || index} style={styles.ingredientRow}>
                  <Text style={styles.ingredientName}>
                    {item?.ingredient?.name || 'Ingrédient'}
                  </Text>

                  <Text style={styles.ingredientQty}>
                    {item?.quantity || 0} {item?.ingredient?.unit || ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

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
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  badge: {
    backgroundColor: '#EEF2FF',
    color: '#2563EB',
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
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
});