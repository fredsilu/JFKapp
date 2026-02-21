import { useEffect, useState } from "react";
import { getEntityDashboard } from "@/src/finance/services/financeDashboardService";
import { EntityDashboardSummary } from "@/types/finance.types";

export function useFinanceDashboard(entity: "maison" | "crepolia") {
  const [data, setData] = useState<EntityDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(1); // début du mois

      const endDate = new Date();

      const result = await getEntityDashboard(entity, {
        startDate,
        endDate,
      });

      setData(result);
      setLoading(false);
    }

    load();
  }, [entity]);

  return { data, loading };
}