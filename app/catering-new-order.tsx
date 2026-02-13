import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import OrderForm from '@/components/OrderForm';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';

import { getSimulationById } from '@/src/services/cateringSimulation.service';
import { addOrder } from '@/src/services/firestore';

import { Order } from '@/types';
import { CateringSimulation } from '@/types/catering';

export default function CateringNewOrderScreen() {
  const router = useRouter();
  const { fromSimulationId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<Order | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      try {
        if (!fromSimulationId || typeof fromSimulationId !== 'string') {
          setLoading(false);
          return;
        }

        const sim: CateringSimulation | null =
          await getSimulationById(fromSimulationId);

        if (!sim) {
          setError('Simulation introuvable');
          setLoading(false);
          return;
        }

        // 🎯 MODE A : Pré-remplissage minimal
        const draft: Order = {
          id: '',
          clientId: sim.clientId,
          client: undefined as any, // sera choisi dans le form
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
  }, [fromSimulationId]);

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
