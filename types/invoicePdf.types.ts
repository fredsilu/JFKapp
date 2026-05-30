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
  discount?: number;
  discountAmount?: number;
  totalAfterDiscount?: number;

  subtotal?: number;
  total?: number;

  items: {
    label: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    total?: number;
    days?: number;
    numberOfDays?: number;
  }[];
};