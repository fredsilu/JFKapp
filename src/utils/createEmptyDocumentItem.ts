// src/catering/utils/createEmptyDocumentItem.ts
import { CateringDocumentItem } from "@/types/documents";

export function createEmptyDocumentItem(): CateringDocumentItem {
  return {
    label: "",
    days: 1,
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
  };
}