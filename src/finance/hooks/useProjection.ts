//src/finance/hooks/useProjection.ts
import { useCallback, useEffect, useState } from "react";
import { getProjection90Days } from "@/src/finance/services/projectionService";
import { EntityType } from "@/types/finance.types";

export function useProjection(entity: EntityType) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getProjection90Days(entity);
      setData(result);
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
    reload: load,
  };
}