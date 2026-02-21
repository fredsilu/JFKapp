import { useEffect, useState } from "react";
import { getEntitySummary } from "@/src/finance/services/dashboardService";

export function useDashboardMaison() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getEntitySummary("maison");
    setSummary(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { summary, loading, reload: load };
}