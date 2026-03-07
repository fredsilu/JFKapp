import { Entity } from "@/src/finance/services/financeTransactionService";

export function getEntity(
  params: Record<string, string | string[] | undefined>
): Entity {
  const entityParam = params.entity;

  if (!entityParam) {
    throw new Error("Entity manquante dans les paramètres de route");
  }

  const entity =
    typeof entityParam === "string"
      ? entityParam
      : entityParam[0];

  if (entity !== "maison" && entity !== "crepolia") {
    throw new Error("Entity invalide");
  }

  return entity as Entity;
}