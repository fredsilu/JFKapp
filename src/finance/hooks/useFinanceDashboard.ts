import { useEffect, useState, useCallback } from "react";
import { getEntityDashboard } from "@/src/finance/services/financeDashboardService";
import {
  EntityDashboardSummary,
  EntityType,
  PeriodFilter,
} from "@/types/finance.types";

export function useFinanceDashboard(entity: EntityType) {
  const [data, setData] = useState<EntityDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();

      const filter: PeriodFilter = {
        startDate,
        endDate,
      };

      const result = await getEntityDashboard(entity, filter);
      setData(result);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    reload: load, // 🔥 maintenant reload existe
  };
}