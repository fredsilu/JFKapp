import { useEffect, useState } from "react"
import { Budget } from "@/types/budget.types"
import { getBudgetsByEntityAndMonth } from "@/src/finance/services/budgetService"

export function useBudgets(
  entity: "maison" | "crepolia",
  month: string
) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getBudgetsByEntityAndMonth(entity, month)
      setBudgets(data)
      setLoading(false)
    }

    load()
  }, [entity, month])

  return { budgets, loading }
}