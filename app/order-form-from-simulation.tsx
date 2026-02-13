import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';

import OrderForm from '@/components/OrderForm';
import { getSimulationById } from '@/src/services/cateringSimulation.service';
import { addOrder } from '@/src/services/firestore';

import { Order } from '@/types';

export default function OrderFromSimulationScreen() {
  const router = useRouter();
  const { fromSimulation } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<Order | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      try {
        if (!fromSimulation || typeof fromSimulation !== 'string') {
          setLoading(false);
          return;
        }

        const sim = await getSimulationById(fromSimulation);
        if (!sim) {
          setError('Simulation introuvable');
          setLoading(false);
          return;
        }

        // Draft compatible OrderForm
        const draft: Order = {
          id: '',
          clientId: sim.clientId,
          client: undefined as any,
          dishes: [],
          additionalIngredients: [],
          deliveryDate: sim.dateLivraison || '',
          deliveryTime: '',
          address: '',
          deliveryAddress: '',
          designation: sim.name || '',
          status: 'En cours',
          createdAt: new Date().toISOString(),
        };

        setOrderDraft(draft);
      } catch (e) {
        console.error(e);
        setError('Erreur lors du chargement de la simulation');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fromSimulation]);

  const handleSubmit = async (
    values: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await addOrder(values);
      router.replace('/all-orders');
    } catch (e) {
      console.error(e);
      setError('Erreur lors de la création de la commande');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <View style={{ flex: 1 }}>
      <OrderForm
        order={orderDraft}
        onClose={() => router.back()}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
