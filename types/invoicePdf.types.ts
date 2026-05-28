export type InvoicePdfData = {
  invoiceNumber: string;
  date?: string;

  clientName?: string;
  clientRccm?: string;
  clientidNat?: string;
  clientAddress?: string;
  clientCity?: string;

  subtotal?: number;
  total?: number;

  items: {
    label: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    days?: number;
  }[];
};