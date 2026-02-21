import { useEffect, useState } from "react";
import { getGroupProjection90Days } from "@/src/finance/services/groupProjectionService";

export function useGroupProjection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const result = await getGroupProjection90Days();
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { data, loading, reload: load };
}