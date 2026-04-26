import { CateringDocumentItem } from "@/types/catering";

export function calculateDocumentTotals(
  items: CateringDocumentItem[]
) {

  const subtotal = items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  return {
    subtotal,
    total: subtotal,
    currency: "USD" as const
  };
}