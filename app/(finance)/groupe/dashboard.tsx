import { ScrollView, ActivityIndicator } from "react-native";
import DashboardCard from "@/src/components/DashboardCard";
import { useGroupDashboard } from "@/src/finance/hooks/useGroupDashboard";

export default function GroupeDashboard() {
  const { data, loading } = useGroupDashboard();

  if (loading || !data) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      <DashboardCard
        title="Revenus consolidés"
        value={data.totalIncome}
        color="#16a34a"
      />

      <DashboardCard
        title="Dépenses consolidées"
        value={data.totalExpense}
        color="#dc2626"
      />

      <DashboardCard
        title="Résultat consolidé"
        value={data.netResult}
        color="#2563eb"
      />

      <DashboardCard
        title="Trésorerie globale"
        value={data.totalTreasury}
        color="#9333ea"
      />

      <DashboardCard title="Total Espèces" value={data.totalCash} />
      <DashboardCard title="Total Banque" value={data.totalBank} />
      <DashboardCard title="Total Mobile" value={data.totalMobile} />
    </ScrollView>
  );
}