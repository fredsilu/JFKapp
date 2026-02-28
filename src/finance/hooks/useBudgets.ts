import { useEffect, useState } from "react"
import { Budget, EntityType } from "@/types/finance.types"
import { getBudgetsByPeriod } from "@/src/finance/services/budgetService"

export function useBudgets(
  entity: EntityType,
  month: number,
  year: number
) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBudgets() {
      try {
        setLoading(true)
        setError(null)

        const data = await getBudgetsByPeriod(entity, month, year)
        setBudgets(data)
      } catch (err) {
        console.error("Error loading budgets:", err)
        setError("Impossible de charger les budgets")
      } finally {
        setLoading(false)
      }
    }

    loadBudgets()
  }, [entity, month, year])

  return {
    budgets,
    loading,
    error,
  }
}