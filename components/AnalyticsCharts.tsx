import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { DailyRevenue, DishAnalytics } from '@/src/utils/analytics';

const screenWidth = Dimensions.get('window').width - 32;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  decimalPlaces: 0,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#007AFF',
  },
};

/* -------------------------------------------------------------------------- */
/*                                Revenue Chart                               */
/* -------------------------------------------------------------------------- */

interface RevenueChartProps {
  data: DailyRevenue[];
  title?: string;
}

export function RevenueChart({
  data,
  title = 'Revenus (7 derniers jours)',
}: RevenueChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return <Text style={styles.noData}>Aucune donnée</Text>;
  }

  const chartData = {
    labels: data.map((d) => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.map((d) => d.revenue),
      },
    ],
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        fromZero
        withInnerLines={false}
        style={styles.chart}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Top Dishes Chart                              */
/* -------------------------------------------------------------------------- */

interface TopDishesChartProps {
  data: DishAnalytics[];
  title?: string;
}

export function TopDishesChart({
  data,
  title = 'Top 5 Plats',
}: TopDishesChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return <Text style={styles.noData}>Aucune donnée</Text>;
  }

  const slicedData = data.slice(0, 5);

  const chartData = {
    labels: slicedData.map((d) => d.dishName.substring(0, 12)),
    datasets: [
      {
        data: slicedData.map((d) => d.totalRevenue),
      },
    ],
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <BarChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        fromZero
        showValuesOnTopOfBars
        withInnerLines={false}
        yAxisLabel=""
        yAxisSuffix=""
        style={styles.chart}
        />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Status Distribution (Pie)                           */
/* -------------------------------------------------------------------------- */

interface StatusDistributionProps {
  data: { status: string; count: number; percentage: number }[];
  title?: string;
}

export function StatusDistributionChart({
  data,
  title = 'Distribution des commandes',
}: StatusDistributionProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return <Text style={styles.noData}>Aucune donnée</Text>;
  }

  const colors: Record<string, string> = {
    'En cours': '#007AFF',
    'En préparation': '#FF9500',
    Livré: '#34C759',
  };

  const chartData = data.map((item) => ({
    name: item.status,
    population: item.count,
    color: colors[item.status] || '#999',
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <PieChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="16"
        absolute
        style={styles.chart}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  noData: {
    textAlign: 'center',
    paddingVertical: 40,
    color: '#999',
    fontSize: 14,
  },
});
