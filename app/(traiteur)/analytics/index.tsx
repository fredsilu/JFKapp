//app/(traiteur)/analytics/index.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useOrders, useDishes, useClients } from '@/src/hooks/useFirestore';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import { KPIGrid } from '@/components/KPICards';
import { RevenueChart, TopDishesChart, StatusDistributionChart } from '@/components/AnalyticsCharts';
import { TopDishesList, TopClientsList, IngredientUsageList } from '@/components/AnalyticsLists';
import {
  calculateKPIs,
  getTopDishes,
  getTopClients,
  getDailyRevenueData,
  getStatusDistribution,
  getIngredientUsageData,
} from '@/src/utils/analytics';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { data: orders = [], loading: ordersLoading, error: ordersError } = useOrders();
  const { data: dishes = [], loading: dishesLoading, error: dishesError } = useDishes();
  const { data: clients = [], loading: clientsLoading, error: clientsError } = useClients();

  const loading = ordersLoading || dishesLoading || clientsLoading;
  const error = ordersError || dishesError || clientsError;

  // Calculate all analytics data
  const analytics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        kpis: [],
        topDishes: [],
        topClients: [],
        dailyRevenue: [],
        statusDistribution: [],
        ingredientUsage: [],
      };
    }

    return {
      kpis: calculateKPIs(orders),
      topDishes: getTopDishes(orders),
      topClients: getTopClients(orders),
      dailyRevenue: getDailyRevenueData(orders, 7),
      statusDistribution: getStatusDistribution(orders),
      ingredientUsage: getIngredientUsageData(orders),
    };
  }, [orders]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Erreur lors du chargement des analytics" />;
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="analytics" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Aucune commande pour afficher les analytics</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(traiteur)/sales')}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Tableau de bord des performances</Text>
          </View>
          <TouchableOpacity onPress={() => router.replace('/(traiteur)/sales')}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* KPI Grid */}
        <View style={styles.section}>
          <KPIGrid kpis={analytics.kpis} />
        </View>

        {/* Revenue Chart */}
        {analytics.dailyRevenue.length > 0 && (
          <View style={styles.section}>
            <RevenueChart data={analytics.dailyRevenue} />
          </View>
        )}

        {/* Charts Row */}
        <View style={styles.section}>
          {analytics.topDishes.length > 0 && (
            <TopDishesChart data={analytics.topDishes} />
          )}

          {analytics.statusDistribution.length > 0 && (
            <StatusDistributionChart data={analytics.statusDistribution} />
          )}
        </View>

        {/* Top Dishes List */}
        {analytics.topDishes.length > 0 && (
          <View style={styles.section}>
            <TopDishesList dishes={analytics.topDishes} />
          </View>
        )}

        {/* Top Clients List */}
        {analytics.topClients.length > 0 && (
          <View style={styles.section}>
            <TopClientsList clients={analytics.topClients} />
          </View>
        )}

        {/* Ingredient Usage List */}
        {analytics.ingredientUsage.length > 0 && (
          <View style={styles.section}>
            <IngredientUsageList ingredients={analytics.ingredientUsage} />
          </View>
        )}

        {/* Footer Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
