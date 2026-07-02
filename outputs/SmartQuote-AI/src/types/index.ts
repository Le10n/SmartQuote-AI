import type { LucideIcon } from "lucide-react";
import type { ActivityEventRow, ClientRow, CompanySettingsRow, ProductRow, QuoteItemRow, QuoteRow, QuoteStatus } from "@/types/database";

export type { ActivityEventRow, ClientRow, CompanySettingsRow, ProductRow, QuoteItemRow, QuoteRow, QuoteStatus };

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export type ArchiveFilter = "active" | "archived" | "all";

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  archive?: ArchiveFilter;
  status?: QuoteStatus | "all";
  category?: string;
}

export interface QuoteWithClient extends QuoteRow {
  client: Pick<ClientRow, "id" | "company" | "contact_person" | "email" | "address"> | null;
}

export interface QuoteWithDetails extends QuoteWithClient {
  quote_items: Array<QuoteItemRow & { product: ProductRow | null }>;
}

export interface DashboardSummary {
  revenue: number;
  monthlyRevenue: Array<{ month: string; revenue: number; quotes: number }>;
  pendingQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  averageQuoteValue: number;
  topClients: Array<{ id: string; company: string; contact_person: string; revenue: number; quotes: number }>;
  topProducts: Array<{ id: string; name: string; sku: string; revenue: number; quantity: number }>;
  latestActivity: ActivityEventRow[];
  recentQuotes: QuoteWithClient[];
  recentClients: ClientRow[];
}

export interface QuoteBuilderItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface QuoteBuilderValue {
  id?: string;
  quote_number?: string;
  client_id: string;
  status: QuoteStatus;
  notes: string;
  items: QuoteBuilderItem[];
}

export interface QuoteTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export type AiAction =
  | "quote_description"
  | "rewrite_description"
  | "pricing_suggestion"
  | "summarize_client_notes"
  | "follow_up_email"
  | "reminder_email"
  | "suggest_products"
  | "marketing_text";

export interface GlobalSearchResult {
  id: string;
  type: "client" | "product" | "quote";
  title: string;
  subtitle: string;
  href: string;
}
