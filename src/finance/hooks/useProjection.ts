import { useEffect, useState } from "react";
import { getProjection90Days } from "@/src/finance/services/projectionService";
import { EntityType } from "@/types/finance.types";

export function useProjection(entity: EntityType) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const result = await getProjection90Days(entity);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { data, loading, reload: load };
}