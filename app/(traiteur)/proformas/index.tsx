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

type ProformaView = 'active' | 'invoiced' | 'all';

export default function ProformasScreen() {
    const [proformas, setProformas] = useState<CateringProforma[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ProformaView>('active');

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

    const activeProformas = useMemo(() => {
        return proformas.filter((p) => {
            const isActiveStatus =
                p.status === 'draft' || p.status === 'sent' || p.status === 'approved';

            return isActiveStatus && !p.isInvoiced;
        });
    }, [proformas]);

    const invoicedProformas = useMemo(() => {
        return proformas.filter((p) => p.isInvoiced);
    }, [proformas]);

    const displayedProformas = useMemo(() => {
        if (view === 'active') return activeProformas;
        if (view === 'invoiced') return invoicedProformas;
        return proformas;
    }, [view, activeProformas, invoicedProformas, proformas]);

    const activeTotal = useMemo(() => {
        return activeProformas.reduce((sum, p) => sum + (p.totals?.total ?? 0), 0);
    }, [activeProformas]);

    const approvedTotal = useMemo(() => {
        return proformas
            .filter((p) => p.status === 'approved')
            .filter((p) => !p.isInvoiced)
            .reduce((sum, p) => sum + (p.totals?.total ?? 0), 0);
    }, [proformas]);

    const invoicedTotal = useMemo(() => {
        return invoicedProformas.reduce((sum, p) => sum + (p.totals?.total ?? 0), 0);
    }, [invoicedProformas]);

    function formatDate(date?: string) {
        if (!date) return '—';

        const d = new Date(date);

        if (Number.isNaN(d.getTime())) {
            return date;
        }

        return d.toLocaleDateString('fr-FR');
    }

    function getStatusLabel(status?: string, isInvoiced?: boolean) {
        if (isInvoiced) return 'Facturée';

        switch (status) {
            case 'draft':
                return 'Brouillon';
            case 'sent':
                return 'Envoyée';
            case 'approved':
                return 'Acceptée';
            case 'rejected':
                return 'Rejetée';
            case 'converted':
                return 'Convertie';
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

            <TouchableOpacity
                onPress={() => router.replace('/(traiteur)/sales')}
                style={styles.backButton}
            >
                <Text style={styles.backIcon}>←</Text>
                <Text style={styles.backText}>Ventes</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Proformas</Text>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Proformas en cours</Text>
                <Text style={styles.summaryValue}>{activeProformas.length}</Text>

                <Text style={styles.summaryLabel}>Total en cours</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(activeTotal)}</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#92400E' }]}>
                <Text style={styles.summaryLabel}>Proformas acceptées non facturées</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(approvedTotal)}</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#065F46' }]}>
                <Text style={styles.summaryLabel}>Chiffre d’affaires facturé</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(invoicedTotal)}</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, view === 'active' && styles.activeTab]}
                    onPress={() => setView('active')}
                >
                    <Text style={[styles.tabText, view === 'active' && styles.activeTabText]}>
                        En cours
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, view === 'invoiced' && styles.activeTab]}
                    onPress={() => setView('invoiced')}
                >
                    <Text style={[styles.tabText, view === 'invoiced' && styles.activeTabText]}>
                        Facturées
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, view === 'all' && styles.activeTab]}
                    onPress={() => setView('all')}
                >
                    <Text style={[styles.tabText, view === 'all' && styles.activeTabText]}>
                        Toutes
                    </Text>
                </TouchableOpacity>
            </View>

            {displayedProformas.length === 0 ? (
                <Text style={styles.empty}>Aucune proforma dans cette vue</Text>
            ) : (
                displayedProformas.map((p) => (
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

                            <View style={[
                                styles.statusBadge,
                                p.isInvoiced && styles.invoicedBadge,
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    p.isInvoiced && styles.invoicedBadgeText,
                                ]}>
                                    {getStatusLabel(p.status, p.isInvoiced)}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.line}>Date : {formatDate(p.issueDate)}</Text>

                        {p.eventDate ? (
                            <Text style={styles.line}>
                                Événement : {formatDate(p.eventDate)}
                            </Text>
                        ) : null}

                        {p.invoiceNumber ? (
                            <Text style={styles.line}>Facture : {p.invoiceNumber}</Text>
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

                            {!p.isInvoiced && (
                                <>
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
                                </>
                            )}
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

    tabs: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        padding: 4,
        marginBottom: 14,
        gap: 4,
    },

    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 9,
        alignItems: 'center',
    },

    activeTab: {
        backgroundColor: '#111827',
    },

    tabText: {
        color: '#374151',
        fontWeight: '800',
        fontSize: 13,
    },

    activeTabText: {
        color: '#fff',
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

    invoicedBadge: {
        backgroundColor: '#DCFCE7',
    },

    invoicedBadgeText: {
        color: '#166534',
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
    backButton: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},

backIcon: {
  fontSize: 24,
  marginRight: 10,
  color: '#111827',
},

backText: {
  fontSize: 16,
  fontWeight: '700',
  color: '#111827',
},
});