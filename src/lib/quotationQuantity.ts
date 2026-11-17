/**
 * Quotation quantities represent client demand, not current warehouse stock.
 * Inventory availability is checked later when the delivery is dispatched.
 */
export const getQuotationQuantity = (requestedQuantity: number): number => Math.max(requestedQuantity, 0);