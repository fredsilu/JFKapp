import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import OrderDetails from '@/components/OrderDetails';
import { getOrderById } from '@/src/services/cateringOrderService';

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        try {
            setLoading(true);

            const data = await getOrderById(id);

            if (!data) {
                Alert.alert('Erreur', 'Commande introuvable');
                router.back();
                return;
            }

            setOrder(data);
        } catch (e) {
            console.error(e);
            Alert.alert('Erreur', 'Impossible de charger la commande');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
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
            onClose={() => router.back()}
            onUpdated={load}
        />
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});