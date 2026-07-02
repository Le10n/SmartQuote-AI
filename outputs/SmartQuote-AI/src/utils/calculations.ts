import type { QuoteBuilderItem, QuoteTotals } from "@/types";

export function calculateLineTotal(item: Pick<QuoteBuilderItem, "quantity" | "price" | "discount" | "tax">) {
  const gross = item.quantity * item.price;
  const discounted = gross - gross * (item.discount / 100);
  return roundCurrency(discounted + discounted * (item.tax / 100));
}

export function calculateQuoteTotals(items: QuoteBuilderItem[]): QuoteTotals {
  return items.reduce<QuoteTotals>(
    (totals, item) => {
      const gross = item.quantity * item.price;
      const discounted = gross - gross * (item.discount / 100);
      const tax = discounted * (item.tax / 100);

      return {
        subtotal: roundCurrency(totals.subtotal + discounted),
        tax: roundCurrency(totals.tax + tax),
        total: roundCurrency(totals.total + discounted + tax),
      };
    },
    { subtotal: 0, tax: 0, total: 0 }
  );
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
