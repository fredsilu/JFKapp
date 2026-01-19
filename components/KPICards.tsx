import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { KPI } from '@/src/utils/analytics';

interface KPICardProps {
  kpi: KPI;
}

const kpiIcons: Record<string, string> = {
  'Revenus du jour': 'attach-money',
  'Revenus de la semaine': 'attach-money',
  'Revenus du mois': 'attach-money',
  'Commandes du jour': 'shopping-bag',
  'Commandes de la semaine': 'shopping-bag',
  'Commandes du mois': 'shopping-bag',
  'Panier moyen': 'trending-up',
  'Taux de livraison': 'local-shipping',
};

const kpiColors: Record<string, { bg: string; icon: string }> = {
  'Revenus du jour': { bg: '#FFE5B4', icon: '#FF9500' },
  'Revenus de la semaine': { bg: '#D0F5D0', icon: '#34C759' },
  'Revenus du mois': { bg: '#B4D7FF', icon: '#007AFF' },
  'Commandes du jour': { bg: '#FFE5B4', icon: '#FF9500' },
  'Commandes de la semaine': { bg: '#D0F5D0', icon: '#34C759' },
  'Commandes du mois': { bg: '#B4D7FF', icon: '#007AFF' },
  'Panier moyen': { bg: '#E5D4FF', icon: '#9C27B0' },
  'Taux de livraison': { bg: '#FFD6D0', icon: '#FF5252' },
};

export function KPICard({ kpi }: KPICardProps) {
  const colors = kpiColors[kpi.label] || { bg: '#F0F0F0', icon: '#666' };
  const icon = kpiIcons[kpi.label] || 'info';

  const trendColor = (kpi.trend || 0) >= 0 ? '#34C759' : '#FF3B30';
  const trendIcon = (kpi.trend || 0) >= 0 ? 'trending-up' : 'trending-down';

  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.icon }]}>
          <MaterialIcons name={icon} size={24} color="#fff" />
        </View>
        {kpi.trend !== undefined && kpi.trend !== 0 && (
          <View style={[styles.trendBadge, { backgroundColor: trendColor }]}>
            <MaterialIcons name={trendIcon} size={14} color="#fff" />
            <Text style={styles.trendText}>{Math.abs(kpi.trend).toFixed(1)}%</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{kpi.label}</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{kpi.value}</Text>
          {kpi.unit && <Text style={styles.unit}>{kpi.unit}</Text>}
        </View>
      </View>
    </View>
  );
}

interface KPIGridProps {
  kpis: KPI[];
}

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <View style={styles.grid}>
      {kpis.map((kpi, index) => (
        <View key={index} style={styles.gridItem}>
          <KPICard kpi={kpi} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});
