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
  const params = useLocalSearchParams<{ fromSimulationId?: string | string[] }>();

  const fromSimulationId = Array.isArray(params.fromSimulationId)
    ? params.fromSimulationId[0]
    : params.fromSimulationId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<Order | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      try {
        if (!fromSimulationId) {
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

        // 🔥 PRÉ-REMPLISSAGE PROPRE
        const draft: Order = {
          id: '',
          clientId: sim.clientId,
          client: undefined as any, // sera sélectionné via dropdown dans OrderForm
          dishes: [],
          additionalIngredients: [],
          deliveryDate: sim.dateLivraison || '',
          deliveryTime: '',
          address: '',
          deliveryAddress: '',
          designation: sim.name || '',
          status: 'En cours',
          createdAt: new Date().toISOString(),

          // 🔥 Traçabilité simulation
          fromSimulationId: sim.id,
          simulatedAmount: sim.globalTurnover ?? 0,
          billedAmount: sim.globalTurnover ?? 0,
        };

        setOrderDraft(draft);
      } catch (e) {
        console.error('❌ load simulation error:', e);
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
      console.error('❌ create order error:', e);
      setError('Erreur lors de la création de la commande');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <View style={{ flex: 1 }}>
      <OrderForm
        key={
          orderDraft?.fromSimulationId ||
          orderDraft?.clientId ||
          'new-order'
        }
        order={orderDraft}
        onClose={() => router.back()}
        onSubmit={handleSubmit}
      />
    </View>
  );
}