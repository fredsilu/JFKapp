import { Transaction } from "@/types/finance.types";

export function getTransactionId(
  params: Record<string, string | string[] | undefined>
): string {
  const idParam = params.id;

  if (!idParam) {
    throw new Error("Transaction ID manquant dans les paramètres de route");
  }

  const id =
    typeof idParam === "string"
      ? idParam
      : idParam[0];

  return id;
}