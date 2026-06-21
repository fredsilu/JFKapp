export type DocumentCurrency = "USD" | "CDF";

export type InvoicePdfData = {
  invoiceNumber: string;
  date?: string;

  clientName?: string;
  clientRccm?: string;
  clientIdNat?: string;
  clientNif?: string;
  clientAddress?: string;
  clientCity?: string;

  documentType?: string;
  status?: string;

  /**
   * Calcul interne JFKApp = USD
   * currency = devise affichée sur le document client
   */
  baseCurrency?: "USD";
  currency?: DocumentCurrency;
  exchangeRate?: number; // 1 USD = X CDF

  discount?: number;
  discountAmount?: number;
  totalAfterDiscount?: number;

  subtotal?: number;
  total?: number;

  items: {
    label: string;
    quantity: number;
    unitPrice: number; // toujours USD en interne
    totalPrice: number; // toujours USD en interne
    total?: number;
    days?: number;
    numberOfDays?: number;
  }[];
};