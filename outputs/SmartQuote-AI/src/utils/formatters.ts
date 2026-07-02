import { readWorkspacePreferences } from "@/services/workspace-preferences.service";

export type SupportedCurrency = "USD" | "EUR" | "GBP";

export function getCurrency() {
  const currency = readWorkspacePreferences().currency;
  return currency === "EUR" || currency === "GBP" || currency === "USD" ? currency : "USD";
}

export function getCurrencySymbol(currency = getCurrency()) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).formatToParts(0).find((part) => part.type === "currency")?.value ?? "$";
}

export function formatCurrency(value: number, options?: Intl.NumberFormatOptions & { currency?: string }) {
  const currency = options?.currency ?? getCurrency();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatCompactCurrency(value: number, options?: Intl.NumberFormatOptions & { currency?: string }) {
  const currency = options?.currency ?? getCurrency();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
