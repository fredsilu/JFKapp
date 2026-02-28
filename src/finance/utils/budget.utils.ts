import { Budget, Transaction } from "@/types/finance.types"

export function buildBudgetByCategory(
  budgets: Budget[],
  transactions: Transaction[]
) {
  const result: Record<
    string,
    {
      budget: number
      actual: number
      gap: number
      usageRate: number
    }
  > = {}

  // Initialiser à partir des budgets
  budgets.forEach((budget) => {
    result[budget.category] = {
      budget: budget.amount,
      actual: 0,
      gap: budget.amount,
      usageRate: 0,
    }
  })

  // Ajouter les dépenses
  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return

    const category = transaction.category

    if (!result[category]) {
      // Cas où dépense existe sans budget défini
      result[category] = {
        budget: 0,
        actual: transaction.amount,
        gap: -transaction.amount,
        usageRate: 100,
      }
    } else {
      result[category].actual += transaction.amount
      result[category].gap =
        result[category].budget - result[category].actual

      result[category].usageRate =
        result[category].budget > 0
          ? (result[category].actual / result[category].budget) * 100
          : 100
    }
  })

  return result
}