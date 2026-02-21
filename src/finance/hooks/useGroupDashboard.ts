import { useEffect, useState } from "react";
import { getGroupDashboard } from "@/src/finance/services/financeDashboardService";
import { GroupDashboardSummary } from "@/types/finance.types";

export function useGroupDashboard() {
  const [data, setData] = useState<GroupDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();

      const result = await getGroupDashboard({
        startDate,
        endDate,
      });

      setData(result);
      setLoading(false);
    }

    load();
  }, []);

  return { data, loading };
}