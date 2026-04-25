import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import {
    CateringProforma,
    deleteCateringProforma,
    getCateringProformas,
} from '@/src/services/cateringProforma.service';
import { formatCurrency } from '@/src/utils/costs';

export default function ProformasScreen() {
    const [proformas, setProformas] = useState<CateringProforma[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProformas = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCateringProformas();

            const sortedData = [...data].sort((a, b) => {
                const dateA = a.issueDate || '';
                const dateB = b.issueDate || '';
                return dateB.localeCompare(dateA);
            });

            setProformas(sortedData);
        } catch (e) {
            console.error('❌ load proformas error:', e);
            Alert.alert('Erreur', 'Impossible de charger les proformas');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadProformas();
        }, [loadProformas])
    );

    const totalAmount = useMemo(() => {
        return proformas
            .filter((p) => {
                const isRejected = p.status === 'rejected';
                const isExpired = p.status === 'expired';
                const isConverted = p.status === 'converted';

                return !isRejected && !isExpired && !isConverted;
            })
            .reduce((sum, p) => {
                return sum + (p.totals?.total ?? 0);
            }, 0);
    }, [proformas]);
    const totalCount = useMemo(() => {
        return proformas.filter((p) => {
            const isRejected = p.status === 'rejected';
            const isExpired = p.status === 'expired';
            const isConverted = p.status === 'converted';

            return !isRejected && !isExpired && !isConverted;
        }).length;
    }, [proformas]);

    function formatDate(date?: string) {
        if (!date) return '—';

        const d = new Date(date);

        if (Number.isNaN(d.getTime())) {
            return date;
        }

        return d.toLocaleDateString('fr-FR');
    }

    function getStatusLabel(status?: string) {
        switch (status) {
            case 'draft':
                return 'Brouillon';
            case 'sent':
                return 'Envoyée';
            case 'accepted':
                return 'Acceptée';
            case 'rejected':
                return 'Rejetée';
            case 'converted':
                return 'Convertie en commande';
            default:
                return status || 'Brouillon';
        }
    }

    const handleDelete = async (id?: string) => {
        if (!id) return;

        Alert.alert(
            'Supprimer proforma',
            'Voulez-vous vraiment supprimer cette proforma ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCateringProforma(id);
                            await loadProformas();
                        } catch (e) {
                            console.error('❌ delete proforma error:', e);
                            Alert.alert('Erreur', 'Impossible de supprimer la proforma');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Chargement des proformas...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Proformas en cours</Text>
                <Text style={styles.summaryValue}>{totalCount}</Text>

                <Text style={styles.summaryLabel}>Total en cours</Text>
                <Text style={styles.summaryAmount}>
                    {formatCurrency(totalAmount)}
                </Text>
            </View>

            {proformas.length === 0 ? (
                <Text style={styles.empty}>Aucune proforma créée</Text>
            ) : (
                proformas.map((p) => (
                    <View key={p.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>
                                    {p.number || 'Proforma sans numéro'}
                                </Text>

                                <Text style={styles.client}>
                                    {p.clientName || p.clientId || 'Client non défini'}
                                </Text>
                            </View>

                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>
                                    {getStatusLabel(p.status)}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.line}>Date : {formatDate(p.issueDate)}</Text>

                        {p.eventDate ? (
                            <Text style={styles.line}>
                                Événement : {formatDate(p.eventDate)}
                            </Text>
                        ) : null}

                        <Text style={styles.amount}>
                            Total : {formatCurrency(p.totals?.total ?? 0)}
                        </Text>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.primaryAction}
                                onPress={() => {
                                    if (!p.id) return;

                                    router.push({
                                        pathname: '/(traiteur)/proformas/[id]',
                                        params: { id: p.id },
                                    });
                                }}
                            >
                                <Text style={styles.primaryActionText}>Voir</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryAction}
                                onPress={() => {
                                    if (!p.id) return;

                                    router.push({
                                        pathname: '/(traiteur)/proformas/[id]',
                                        params: { id: p.id },
                                    });
                                }}
                            >
                                <Text style={styles.secondaryActionText}>Modifier</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteAction}
                                onPress={() => handleDelete(p.id)}
                            >
                                <Text style={styles.deleteActionText}>Supprimer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F8',
        padding: 16,
    },

    center: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },

    loadingText: {
        marginTop: 10,
        color: '#4B5563',
    },

    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 16,
        color: '#111827',
    },

    summaryCard: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
    },

    summaryLabel: {
        color: '#D1D5DB',
        fontSize: 13,
        marginBottom: 2,
    },

    summaryValue: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 10,
    },

    summaryAmount: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
    },

    empty: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 40,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        elevation: 2,
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 8,
    },

    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },

    client: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 3,
    },

    statusBadge: {
        backgroundColor: '#E8F0FE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },

    statusText: {
        color: '#1A73E8',
        fontSize: 11,
        fontWeight: '700',
    },

    line: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
    },

    amount: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginTop: 6,
    },

    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 14,
        gap: 8,
    },

    primaryAction: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 9,
        borderRadius: 8,
        alignItems: 'center',
    },

    primaryActionText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 13,
    },

    secondaryAction: {
        flex: 1,
        backgroundColor: '#E5E7EB',
        paddingVertical: 9,
        borderRadius: 8,
        alignItems: 'center',
    },

    secondaryActionText: {
        color: '#111827',
        fontWeight: '800',
        fontSize: 13,
    },

    deleteAction: {
        flex: 1,
        backgroundColor: '#FEE2E2',
        paddingVertical: 9,
        borderRadius: 8,
        alignItems: 'center',
    },

    deleteActionText: {
        color: '#DC2626',
        fontWeight: '800',
        fontSize: 13,
    },
});