import { useEffect, useState, useCallback } from "react";
import { getGroupDashboard } from "@/src/finance/services/financeDashboardService";
import { GroupDashboardSummary } from "@/types/finance.types";

export function useGroupDashboard() {
  const [data, setData] = useState<GroupDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();

      const result = await getGroupDashboard({
        startDate,
        endDate,
      });

      setData(result);
    } catch (err) {
      console.error("Erreur dashboard groupe:", err);
      setError("Impossible de charger le dashboard groupe");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}