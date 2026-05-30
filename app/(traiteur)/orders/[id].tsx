// app/(traiteur)/orders/[id].tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';


import OrderDetails from '@/components/OrderDetails';
import { getOrderById } from '@/src/services/cateringOrderService';

export default function OrderDetailScreen() {
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
      console.error('❌ load order error:', error);
      Alert.alert('Erreur', 'Impossible de charger la commande');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement de la commande...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Commande introuvable</Text>
      </View>
    );
  }

  return (
    <OrderDetails
      order={order}
      onClose={() => router.replace('/(traiteur)/orders')}
      onUpdated={load}
    />
  );
}

const styles = StyleSheet.create({
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
});