import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import {
    getOrderById,
    updateOrder,
} from '@/src/services/cateringOrderService';

import { createInvoiceFromOrder } from '@/src/services/cateringInvoice.service';

import { formatCurrency } from '@/src/utils/costs';

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

    async function handleCreateInvoice() {
        try {
            if (!order?.id) return;

            setLoading(true);

            const invoice = await createInvoiceFromOrder(order);

            await updateOrder(order.id, {
                invoiceId: invoice.id,
                invoiceNumber: invoice.number,
            } as any);

            Alert.alert('Succès', 'Facture créée avec succès');

            router.replace('/(traiteur)/invoices');

        } catch (e) {
            console.error(e);
            Alert.alert('Erreur', 'Impossible de créer la facture');
        } finally {
            setLoading(false);
        }
    }

    function formatDate(date?: string) {
        if (!date) return '—';
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        return d.toLocaleDateString('fr-FR');
    }

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
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Détail commande</Text>

            <View style={styles.card}>
                <Text style={styles.number}>{order.number}</Text>

                <Text style={styles.line}>
                    Client : {order.client?.name || '—'}
                </Text>

                <Text style={styles.line}>
                    Proforma : {order.proformaNumber || '—'}
                </Text>

                <Text style={styles.line}>
                    Date événement : {formatDate(order.dateLivraison)}
                </Text>

                <Text style={styles.line}>
                    Invités : {order.guestCount || 0}
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Lignes</Text>

                {order.items?.map((item: any, index: number) => (
                    <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemLabel}>{item.label}</Text>
                        <Text>{formatCurrency(item.total)}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.card}>
                <Text style={styles.total}>
                    Total : {formatCurrency(order.totals?.total ?? 0)}
                </Text>
            </View>

            {/* 🔥 FACTURE POSSIBLE DÈS QU’UNE COMMANDE EXISTE */}
            {!order.invoiceId && (
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        if (Platform.OS === 'web') {
                            const confirmed = window.confirm(
                                'Confirmer la création de la facture ?'
                            );

                            if (confirmed) {
                                handleCreateInvoice();
                            }

                            return;
                        }

                        Alert.alert(
                            'Créer facture',
                            'Confirmer la création de la facture ?',
                            [
                                { text: 'Annuler', style: 'cancel' },
                                { text: 'Créer', onPress: handleCreateInvoice },
                            ]
                        );
                    }}
                >
                    <Text style={styles.buttonText}>Créer facture</Text>
                </TouchableOpacity>
            )}

            {order.invoiceNumber && (
                <Text style={styles.success}>
                    ✅ Facturée ({order.invoiceNumber})
                </Text>
            )}

            <TouchableOpacity
                style={styles.back}
                onPress={() => router.back()}
            >
                <Text>Retour</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#F4F6F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },

    card: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 10,
        marginBottom: 12,
    },

    number: { fontSize: 18, fontWeight: '900' },
    line: { marginTop: 6, color: '#444' },

    sectionTitle: { fontWeight: '800', marginBottom: 8 },

    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },

    itemLabel: { fontWeight: '600' },

    total: { fontSize: 16, fontWeight: '900' },

    button: {
        backgroundColor: '#16A34A',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },

    buttonText: { color: '#fff', fontWeight: '800' },

    success: {
        color: '#16A34A',
        marginTop: 10,
        fontWeight: '700',
    },

    back: {
        marginTop: 20,
        alignItems: 'center',
    },
});