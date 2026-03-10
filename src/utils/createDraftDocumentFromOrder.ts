// src/catering/utils/createDraftDocumentFromOrder.ts

import {
  CateringDocument,
  CateringDocumentType,
} from "@/types/documents";
import { createEmptyDocumentItem } from "./createEmptyDocumentItem";
import { calculateDocumentTotals } from "./calculateDocumentTotals";

type SourceOrder = {
  id: string;
  clientName?: string;
  clientRccm?: string;
  clientIdnat?: string;
  clientAddressLine1?: string;
  clientAddressLine2?: string;
  clientCityCountry?: string;
  eventName?: string;
  eventDate?: string;
  guestCount?: number;
};

export function createDraftDocumentFromOrder(
  order: SourceOrder,
  type: CateringDocumentType
): CateringDocument {
  const initialItems = [
    createEmptyDocumentItem(),
    createEmptyDocumentItem(),
    createEmptyDocumentItem(),
  ];

  const { items, totals } = calculateDocumentTotals(initialItems);

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const eventDate = order.eventDate ?? today;

  return {
    id: "",
    orderId: order.id,
    type,

    meta: {
      number: "",
      sequence: 0,
      year: new Date().getFullYear(),
      createdAt: now,
      issueDate: today,
      eventDate,
      validUntil: type === "proforma" ? eventDate : undefined,
    },

    seller: {
      name: "CREPOLIA",
      addressLine1: "54, Avenue de la Justice",
      addressLine2: "C/Gombe",
      cityCountry: "Kinshasa / RDC",
    },

    client: {
      name: order.clientName ?? "",
      rccm: order.clientRccm ?? "",
      idnat: order.clientIdnat ?? "",
      addressLine1: order.clientAddressLine1 ?? "",
      addressLine2: order.clientAddressLine2 ?? "",
      cityCountry: order.clientCityCountry ?? "Kinshasa / RDC",
    },

    eventName: order.eventName ?? "Evénement",
    guestCount: order.guestCount ?? 0,

    items,
    totals,

    custom: {
      comments: type === "invoice" ? "Aucun" : undefined,
      introText:
        type === "proforma"
          ? "Vous trouverez ci-dessous pro-forma :"
          : undefined,
      paymentNote:
        type === "proforma"
          ? "Un acompte de 70% est payable à la confirmation de la commande, et la totalité sera soldée la veille de l’événement."
          : "Les paiements peuvent se faire en espèces, par chèque ou par virement bancaire.",
      footerContactNote:
        type === "invoice"
          ? "Pour toute question sur la présente facture, vous pouvez contacter : contact@crepolia.com - Tél. 0891111165"
          : undefined,
      thankYouNote: type === "invoice" ? "MERCI DE NOUS FAIRE CONFIANCE" : undefined,
      depositPercentage: type === "proforma" ? 70 : undefined,
    },

    assets: {},

    status: "draft",
  };
}