import { CateringDocumentItem } from "@/types/catering";

export function calculateDocumentTotals(
  items: CateringDocumentItem[],
  discount: number = 0
) {

  const subtotal = items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  const total = Math.max(subtotal - discount, 0);

  return {
    subtotal,
    discount,
    total,
    currency: "USD" as const
  };
}