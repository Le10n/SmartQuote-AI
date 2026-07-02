import type { AiAction, DashboardSummary, GlobalSearchResult, ListQuery, PaginatedResult, QuoteBuilderItem, QuoteBuilderValue, QuoteTotals, QuoteWithClient, QuoteWithDetails } from "@/types";
import type { ActivityEventRow, ClientInsert, ClientRow, ClientUpdate, CompanySettingsRow, CompanySettingsUpdate, ProductInsert, ProductRow, ProductUpdate, QuoteItemRow, QuoteStatus } from "@/types/database";
import { calculateLineTotal, calculateQuoteTotals } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatters";
import { readWorkspacePreferences } from "@/services/workspace-preferences.service";

const DEMO_STORE_KEY = "smartquote-demo-store-v2";
const DEMO_OWNER_ID = "00000000-0000-4000-8000-000000000001";

interface DemoState {
  clients: ClientRow[];
  products: ProductRow[];
  quotes: Array<Omit<QuoteWithClient, "client">>;
  quoteItems: QuoteItemRow[];
  activity: ActivityEventRow[];
  settings: CompanySettingsRow;
}

interface QuoteSeedItem {
  product_id: string;
  quantity: number;
  discount: number;
}

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return prefix + "-" + crypto.randomUUID();
  }

  return prefix + "-" + Math.random().toString(36).slice(2, 12);
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchesSearch(values: Array<string | null | undefined>, search = "") {
  const term = normalize(search);
  if (!term) return true;
  return values.some((value) => normalize(value).includes(term));
}

function sortNewest<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function paginate<T>(items: T[], page = 1, pageSize = 10): PaginatedResult<T> {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), count: items.length, page, pageSize };
}

function archiveMatches(item: { archived_at: string | null }, archive: ListQuery["archive"] = "active") {
  if (archive === "active") return item.archived_at === null;
  if (archive === "archived") return item.archived_at !== null;
  return true;
}

function createActivity(entityType: string, action: string, description: string, entityId: string | null): ActivityEventRow {
  return {
    id: createId("act"),
    owner_id: DEMO_OWNER_ID,
    entity_type: entityType,
    entity_id: entityId,
    action,
    description,
    created_at: new Date().toISOString(),
  };
}

function makeQuoteItem(quoteId: string, product: ProductRow, quantity: number, discount: number, createdAt: string): QuoteItemRow {
  return {
    id: createId("item"),
    quote_id: quoteId,
    product_id: product.id,
    quantity,
    price: product.selling_price,
    discount,
    tax: product.tax,
    total: calculateLineTotal({ quantity, price: product.selling_price, discount, tax: product.tax }),
    created_at: createdAt,
  };
}

function buildQuoteFromItems(params: {
  id: string;
  quoteNumber: string;
  clientId: string;
  status: QuoteStatus;
  notes: string;
  createdAt: string;
  products: ProductRow[];
  items: QuoteSeedItem[];
}) {
  const itemRows = params.items.map((item) => {
    const product = params.products.find((candidate) => candidate.id === item.product_id);
    if (!product) throw new Error("Demo product seed is invalid.");
    return makeQuoteItem(params.id, product, item.quantity, item.discount, params.createdAt);
  });
  const totals = calculateQuoteTotals(itemRows.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    name: params.products.find((product) => product.id === item.product_id)?.name ?? "Product",
    quantity: item.quantity,
    price: item.price,
    discount: item.discount,
    tax: item.tax,
    total: item.total,
  })));

  return {
    quote: {
      id: params.id,
      owner_id: DEMO_OWNER_ID,
      quote_number: params.quoteNumber,
      client_id: params.clientId,
      status: params.status,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      notes: params.notes,
      archived_at: null,
      created_at: params.createdAt,
      updated_at: params.createdAt,
    },
    items: itemRows,
  };
}

function createSeedState(): DemoState {
  const now = new Date().toISOString();
  const clients: ClientRow[] = [
    {
      id: "client-aurora",
      owner_id: DEMO_OWNER_ID,
      company: "Aurora Labs",
      contact_person: "Mia Bennett",
      email: "mia@auroralabs.example",
      phone: "+1 415 555 0198",
      address: "101 Market Street, San Francisco, CA",
      notes: "Scaling a product-led sales motion. Prefers concise proposals with ROI framing.",
      archived_at: null,
      created_at: isoDaysAgo(42),
      updated_at: isoDaysAgo(4),
    },
    {
      id: "client-northstar",
      owner_id: DEMO_OWNER_ID,
      company: "Northstar Studio",
      contact_person: "Julian Hart",
      email: "julian@northstar.example",
      phone: "+1 646 555 0142",
      address: "88 Grand Avenue, New York, NY",
      notes: "Needs branded PDF proposals and fast approval cycles for enterprise retainers.",
      archived_at: null,
      created_at: isoDaysAgo(31),
      updated_at: isoDaysAgo(2),
    },
    {
      id: "client-summit",
      owner_id: DEMO_OWNER_ID,
      company: "Summit Finance Group",
      contact_person: "Avery Collins",
      email: "avery@summitfg.example",
      phone: "+1 312 555 0181",
      address: "430 W Lake Street, Chicago, IL",
      notes: "Finance team cares about tax clarity, renewal terms, and implementation timeline.",
      archived_at: null,
      created_at: isoDaysAgo(24),
      updated_at: isoDaysAgo(8),
    },
    {
      id: "client-bluebird",
      owner_id: DEMO_OWNER_ID,
      company: "Bluebird Health",
      contact_person: "Nora Patel",
      email: "nora@bluebirdhealth.example",
      phone: "+1 206 555 0134",
      address: "12 Pine Street, Seattle, WA",
      notes: "Interested in onboarding automation and secure document workflows.",
      archived_at: null,
      created_at: isoDaysAgo(15),
      updated_at: isoDaysAgo(1),
    },
    {
      id: "client-lumen",
      owner_id: DEMO_OWNER_ID,
      company: "Lumen Retail Co.",
      contact_person: "Theo Ramirez",
      email: "theo@lumenretail.example",
      phone: "+1 512 555 0107",
      address: "700 Congress Avenue, Austin, TX",
      notes: "Seasonal quote volume spikes around new store openings.",
      archived_at: null,
      created_at: isoDaysAgo(9),
      updated_at: isoDaysAgo(3),
    },
  ];

  const products: ProductRow[] = [
    {
      id: "product-implementation",
      owner_id: DEMO_OWNER_ID,
      sku: "SVC-IMPL",
      name: "Implementation Sprint",
      description: "Two-week guided setup covering workflows, templates, and reporting foundations.",
      category: "Services",
      purchase_price: 1800,
      selling_price: 4200,
      tax: 8.5,
      stock: 18,
      unit: "sprint",
      image_path: null,
      archived_at: null,
      created_at: isoDaysAgo(60),
      updated_at: isoDaysAgo(4),
    },
    {
      id: "product-ai-pricing",
      owner_id: DEMO_OWNER_ID,
      sku: "AI-PRICE",
      name: "AI Pricing Optimization",
      description: "Margin analysis, quote recommendations, and buyer-ready pricing narratives.",
      category: "AI",
      purchase_price: 950,
      selling_price: 2800,
      tax: 8.5,
      stock: 32,
      unit: "package",
      image_path: null,
      archived_at: null,
      created_at: isoDaysAgo(57),
      updated_at: isoDaysAgo(6),
    },
    {
      id: "product-pdf-branding",
      owner_id: DEMO_OWNER_ID,
      sku: "DOC-BRAND",
      name: "Branded PDF System",
      description: "Modern proposal layouts with terms, QR codes, logo, and brand color controls.",
      category: "Documents",
      purchase_price: 700,
      selling_price: 1950,
      tax: 8.5,
      stock: 26,
      unit: "setup",
      image_path: null,
      archived_at: null,
      created_at: isoDaysAgo(52),
      updated_at: isoDaysAgo(7),
    },
    {
      id: "product-client-portal",
      owner_id: DEMO_OWNER_ID,
      sku: "PORTAL-PRO",
      name: "Client Approval Portal",
      description: "Secure review flow for accepting quotes, downloading PDFs, and managing approvals.",
      category: "Platform",
      purchase_price: 2500,
      selling_price: 6400,
      tax: 8.5,
      stock: 11,
      unit: "license",
      image_path: null,
      archived_at: null,
      created_at: isoDaysAgo(48),
      updated_at: isoDaysAgo(5),
    },
    {
      id: "product-training",
      owner_id: DEMO_OWNER_ID,
      sku: "SVC-TRAIN",
      name: "Revenue Team Training",
      description: "Live enablement session for sales, operations, and finance teams.",
      category: "Services",
      purchase_price: 450,
      selling_price: 1250,
      tax: 8.5,
      stock: 40,
      unit: "session",
      image_path: null,
      archived_at: null,
      created_at: isoDaysAgo(44),
      updated_at: isoDaysAgo(9),
    },
  ];

  const quoteSeeds = [
    buildQuoteFromItems({ id: "quote-1008", quoteNumber: "SQ-2026-1008", clientId: "client-bluebird", status: "pending", notes: "Include a phased rollout and emphasize secure file handling.", createdAt: isoDaysAgo(1), products, items: [{ product_id: "product-client-portal", quantity: 1, discount: 5 }, { product_id: "product-training", quantity: 3, discount: 0 }] }),
    buildQuoteFromItems({ id: "quote-1007", quoteNumber: "SQ-2026-1007", clientId: "client-northstar", status: "accepted", notes: "Approved with branded PDF and AI pricing package.", createdAt: isoDaysAgo(5), products, items: [{ product_id: "product-ai-pricing", quantity: 2, discount: 8 }, { product_id: "product-pdf-branding", quantity: 1, discount: 0 }] }),
    buildQuoteFromItems({ id: "quote-1006", quoteNumber: "SQ-2026-1006", clientId: "client-aurora", status: "accepted", notes: "Executive-ready proposal with measurable revenue lift assumptions.", createdAt: isoDaysAgo(13), products, items: [{ product_id: "product-implementation", quantity: 1, discount: 0 }, { product_id: "product-ai-pricing", quantity: 1, discount: 0 }] }),
    buildQuoteFromItems({ id: "quote-1005", quoteNumber: "SQ-2026-1005", clientId: "client-summit", status: "draft", notes: "Waiting for final procurement terms before sending.", createdAt: isoDaysAgo(20), products, items: [{ product_id: "product-client-portal", quantity: 1, discount: 12 }] }),
    buildQuoteFromItems({ id: "quote-1004", quoteNumber: "SQ-2026-1004", clientId: "client-lumen", status: "rejected", notes: "Deferred until Q4 store expansion budget is confirmed.", createdAt: isoDaysAgo(33), products, items: [{ product_id: "product-implementation", quantity: 2, discount: 15 }, { product_id: "product-training", quantity: 4, discount: 0 }] }),
    buildQuoteFromItems({ id: "quote-1003", quoteNumber: "SQ-2026-1003", clientId: "client-aurora", status: "accepted", notes: "Initial pilot accepted for product-led sales motion.", createdAt: isoDaysAgo(72), products, items: [{ product_id: "product-pdf-branding", quantity: 1, discount: 0 }, { product_id: "product-training", quantity: 2, discount: 0 }] }),
  ];

  return {
    clients,
    products,
    quotes: quoteSeeds.map((seed) => seed.quote),
    quoteItems: quoteSeeds.flatMap((seed) => seed.items),
    activity: [
      createActivity("quote", "created", "Bluebird Health quote moved into pending approval.", "quote-1008"),
      createActivity("client", "updated", "Northstar Studio contact notes were refined for the enterprise renewal.", "client-northstar"),
      createActivity("product", "updated", "AI Pricing Optimization margin assumptions were refreshed.", "product-ai-pricing"),
      createActivity("quote", "accepted", "Northstar Studio accepted SQ-2026-1007.", "quote-1007"),
      createActivity("quote", "drafted", "Summit Finance Group quote saved as draft.", "quote-1005"),
    ],
    settings: {
      id: "settings-demo",
      owner_id: DEMO_OWNER_ID,
      company_name: "SmartQuote AI Demo Co.",
      logo_path: null,
      vat: "US-DEMO-8841",
      iban: "DEMO0123456789",
      address: "500 Market Street, San Francisco, CA",
      email_signature: "Best regards,\nSmartQuote AI Revenue Team",
      default_tax: 8.5,
      brand_primary: "#0f766e",
      brand_secondary: "#2563eb",
      pdf_terms: "Quotes are valid for 30 days. Services begin after written approval and receipt of the first scheduled payment. Pricing excludes custom legal, procurement, or security review unless listed as a line item.",
      ai_enabled: true,
      ai_tone: "Confident, concise, and consultative",
      created_at: isoDaysAgo(90),
      updated_at: now,
    },
  };
}

function createEmptyState(): DemoState {
  const seeded = createSeedState();
  return {
    ...seeded,
    clients: [],
    products: [],
    quotes: [],
    quoteItems: [],
    activity: [createActivity("workspace", "cleared", "Demo workspace was cleared.", null)],
  };
}

function readState(): DemoState {
  if (typeof window === "undefined") return createSeedState();

  const stored = window.localStorage.getItem(DEMO_STORE_KEY);
  if (!stored) {
    const seeded = createSeedState();
    writeState(seeded);
    return seeded;
  }

  try {
    return JSON.parse(stored) as DemoState;
  } catch {
    const seeded = createSeedState();
    writeState(seeded);
    return seeded;
  }
}

function writeState(state: DemoState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(state));
}

function commit(mutator: (state: DemoState) => void) {
  const state = readState();
  mutator(state);
  writeState(state);
  return state;
}

function recordActivity(state: DemoState, entityType: string, action: string, description: string, entityId: string | null) {
  state.activity = [createActivity(entityType, action, description, entityId), ...state.activity].slice(0, 24);
}

function clientSummary(client: ClientRow | undefined): QuoteWithClient["client"] {
  if (!client) return null;
  return {
    id: client.id,
    company: client.company,
    contact_person: client.contact_person,
    email: client.email,
    address: client.address,
  };
}

function withClient(state: DemoState, quote: DemoState["quotes"][number]): QuoteWithClient {
  return { ...quote, client: clientSummary(state.clients.find((client) => client.id === quote.client_id)) };
}

function withDetails(state: DemoState, quote: DemoState["quotes"][number]): QuoteWithDetails {
  return {
    ...withClient(state, quote),
    quote_items: state.quoteItems
      .filter((item) => item.quote_id === quote.id)
      .map((item) => ({ ...item, product: state.products.find((product) => product.id === item.product_id) ?? null })),
  };
}

function nextQuoteNumber(state: DemoState) {
  const max = state.quotes.reduce((current, quote) => {
    const parsed = Number(quote.quote_number.split("-").pop());
    return Number.isFinite(parsed) ? Math.max(current, parsed) : current;
  }, 1000);
  const next = max + 1;
  const year = String(new Date().getFullYear());
  const format = readWorkspacePreferences().quoteNumberFormat || "SQ-{YYYY}-{0000}";
  return format
    .replaceAll("{YYYY}", year)
    .replaceAll("{YY}", year.slice(-2))
    .replaceAll("{0000}", String(next).padStart(4, "0"))
    .replaceAll("{000}", String(next).padStart(3, "0"))
    .replaceAll("{N}", String(next));
}

function toQuoteBuilderItem(state: DemoState, item: QuoteItemRow): QuoteBuilderItem {
  const product = state.products.find((candidate) => candidate.id === item.product_id);
  return {
    id: item.id,
    product_id: item.product_id,
    name: product?.name ?? "Product",
    quantity: item.quantity,
    price: item.price,
    discount: item.discount,
    tax: item.tax,
    total: item.total,
  };
}

function recalculateQuoteTotals(state: DemoState, quoteId: string) {
  const items = state.quoteItems.filter((item) => item.quote_id === quoteId).map((item) => toQuoteBuilderItem(state, item));
  const totals = calculateQuoteTotals(items);
  state.quotes = state.quotes.map((quote) => quote.id === quoteId ? { ...quote, subtotal: totals.subtotal, tax: totals.tax, total: totals.total, updated_at: new Date().toISOString() } : quote);
}

function upsertQuoteItems(state: DemoState, quoteId: string, items: QuoteBuilderValue["items"]) {
  state.quoteItems = state.quoteItems.filter((item) => item.quote_id !== quoteId);
  state.quoteItems.push(...items.map((item) => ({
    id: item.id.startsWith("item-") ? item.id : createId("item"),
    quote_id: quoteId,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    discount: item.discount,
    tax: item.tax,
    total: calculateLineTotal(item),
    created_at: new Date().toISOString(),
  })));
}

function buildSummary(state: DemoState): DashboardSummary {
  const activeQuotes = sortNewest(state.quotes.filter((quote) => quote.archived_at === null)).map((quote) => withClient(state, quote));
  const activeClients = sortNewest(state.clients.filter((client) => client.archived_at === null)).slice(0, 8);
  const accepted = activeQuotes.filter((quote) => quote.status === "accepted");
  const revenue = accepted.reduce((sum, quote) => sum + quote.total, 0);
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const monthMap = new Map<string, { month: string; revenue: number; quotes: number }>();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    const label = monthFormatter.format(date);
    monthMap.set(label, { month: label, revenue: 0, quotes: 0 });
  }

  for (const quote of accepted) {
    const label = monthFormatter.format(new Date(quote.created_at));
    const current = monthMap.get(label) ?? { month: label, revenue: 0, quotes: 0 };
    current.revenue += quote.total;
    current.quotes += 1;
    monthMap.set(label, current);
  }

  const clientMap = new Map<string, { id: string; company: string; contact_person: string; revenue: number; quotes: number }>();
  for (const quote of accepted) {
    if (!quote.client) continue;
    const current = clientMap.get(quote.client.id) ?? { id: quote.client.id, company: quote.client.company, contact_person: quote.client.contact_person, revenue: 0, quotes: 0 };
    current.revenue += quote.total;
    current.quotes += 1;
    clientMap.set(quote.client.id, current);
  }

  const productMap = new Map<string, { id: string; name: string; sku: string; revenue: number; quantity: number }>();
  for (const item of state.quoteItems) {
    const quote = state.quotes.find((candidate) => candidate.id === item.quote_id);
    if (!quote || quote.status !== "accepted" || quote.archived_at !== null) continue;
    const product = state.products.find((candidate) => candidate.id === item.product_id);
    if (!product) continue;
    const current = productMap.get(product.id) ?? { id: product.id, name: product.name, sku: product.sku, revenue: 0, quantity: 0 };
    current.revenue += item.total;
    current.quantity += item.quantity;
    productMap.set(product.id, current);
  }

  return {
    revenue,
    monthlyRevenue: Array.from(monthMap.values()),
    pendingQuotes: activeQuotes.filter((quote) => quote.status === "pending" || quote.status === "draft").length,
    acceptedQuotes: accepted.length,
    rejectedQuotes: activeQuotes.filter((quote) => quote.status === "rejected").length,
    averageQuoteValue: activeQuotes.length ? activeQuotes.reduce((sum, quote) => sum + quote.total, 0) / activeQuotes.length : 0,
    topClients: Array.from(clientMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    topProducts: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    latestActivity: state.activity.slice(0, 8),
    recentQuotes: activeQuotes.slice(0, 5),
    recentClients: activeClients,
  };
}

export const demoStore = {
  ownerId: DEMO_OWNER_ID,
  reset() {
    const seeded = createSeedState();
    writeState(seeded);
    return seeded;
  },
  generateSampleData() {
    return this.reset();
  },
  clear() {
    const empty = createEmptyState();
    writeState(empty);
    return empty;
  },
  clients: {
    list(query: ListQuery = {}): PaginatedResult<ClientRow> {
      const state = readState();
      const data = sortNewest(state.clients)
        .filter((client) => archiveMatches(client, query.archive))
        .filter((client) => matchesSearch([client.company, client.contact_person, client.email, client.phone], query.search));
      return paginate(data, query.page, query.pageSize);
    },
    create(values: Omit<ClientInsert, "owner_id" | "archived_at">) {
      const state = commit((draft) => {
        const now = new Date().toISOString();
        const row: ClientRow = {
          id: values.id ?? createId("client"),
          owner_id: DEMO_OWNER_ID,
          company: values.company,
          contact_person: values.contact_person,
          email: values.email,
          phone: values.phone ?? null,
          address: values.address ?? null,
          notes: values.notes ?? null,
          archived_at: null,
          created_at: values.created_at ?? now,
          updated_at: values.updated_at ?? now,
        };
        draft.clients.unshift(row);
        recordActivity(draft, "client", "created", row.company + " was added to the workspace.", row.id);
      });
      return state.clients[0];
    },
    update(id: string, values: ClientUpdate) {
      let updated: ClientRow | null = null;
      commit((draft) => {
        draft.clients = draft.clients.map((client) => {
          if (client.id !== id) return client;
          updated = { ...client, ...values, updated_at: new Date().toISOString() };
          return updated;
        });
        if (updated) recordActivity(draft, "client", "updated", updated.company + " details were updated.", updated.id);
      });
      if (!updated) throw new Error("Client not found.");
      return updated;
    },
    archive(id: string) {
      return this.update(id, { archived_at: new Date().toISOString() });
    },
    restore(id: string) {
      return this.update(id, { archived_at: null });
    },
    remove(id: string) {
      let removed: ClientRow | null = null;
      commit((draft) => {
        removed = draft.clients.find((client) => client.id === id) ?? null;
        draft.clients = draft.clients.filter((client) => client.id !== id);
        draft.quotes = draft.quotes.filter((quote) => quote.client_id !== id);
        draft.quoteItems = draft.quoteItems.filter((item) => draft.quotes.some((quote) => quote.id === item.quote_id));
        if (removed) recordActivity(draft, "client", "deleted", removed.company + " was removed from demo data.", removed.id);
      });
      if (!removed) throw new Error("Client not found.");
      return removed;
    },
  },
  products: {
    list(query: ListQuery = {}): PaginatedResult<ProductRow> {
      const state = readState();
      const data = sortNewest(state.products)
        .filter((product) => archiveMatches(product, query.archive))
        .filter((product) => !query.category || query.category === "all" || product.category === query.category)
        .filter((product) => matchesSearch([product.sku, product.name, product.category, product.description], query.search));
      return paginate(data, query.page, query.pageSize);
    },
    create(values: Omit<ProductInsert, "owner_id" | "archived_at" | "image_path"> & { image_path?: string | null }) {
      const state = commit((draft) => {
        const now = new Date().toISOString();
        const row: ProductRow = {
          id: values.id ?? createId("product"),
          owner_id: DEMO_OWNER_ID,
          sku: values.sku,
          name: values.name,
          description: values.description ?? null,
          category: values.category ?? null,
          purchase_price: values.purchase_price ?? 0,
          selling_price: values.selling_price ?? 0,
          tax: values.tax ?? draft.settings.default_tax,
          stock: values.stock ?? 0,
          unit: values.unit ?? "pcs",
          image_path: values.image_path ?? null,
          archived_at: null,
          created_at: values.created_at ?? now,
          updated_at: values.updated_at ?? now,
        };
        draft.products.unshift(row);
        recordActivity(draft, "product", "created", row.name + " was added to the catalog.", row.id);
      });
      return state.products[0];
    },
    update(id: string, values: ProductUpdate) {
      let updated: ProductRow | null = null;
      commit((draft) => {
        draft.products = draft.products.map((product) => {
          if (product.id !== id) return product;
          updated = { ...product, ...values, updated_at: new Date().toISOString() };
          return updated;
        });
        if (updated) recordActivity(draft, "product", "updated", updated.name + " was updated.", updated.id);
      });
      if (!updated) throw new Error("Product not found.");
      return updated;
    },
    archive(id: string) {
      return this.update(id, { archived_at: new Date().toISOString() });
    },
    restore(id: string) {
      return this.update(id, { archived_at: null });
    },
    remove(id: string) {
      let removed: ProductRow | null = null;
      commit((draft) => {
        removed = draft.products.find((product) => product.id === id) ?? null;
        const affectedQuoteIds = Array.from(new Set(draft.quoteItems.filter((item) => item.product_id === id).map((item) => item.quote_id)));
        draft.products = draft.products.filter((product) => product.id !== id);
        draft.quoteItems = draft.quoteItems.filter((item) => item.product_id !== id);
        affectedQuoteIds.forEach((quoteId) => recalculateQuoteTotals(draft, quoteId));
        if (removed) recordActivity(draft, "product", "deleted", removed.name + " was removed from demo data.", removed.id);
      });
      if (!removed) throw new Error("Product not found.");
      return removed;
    },
  },
  quotes: {
    list(query: ListQuery = {}): PaginatedResult<QuoteWithClient> {
      const state = readState();
      const data = sortNewest(state.quotes)
        .filter((quote) => archiveMatches(quote, query.archive))
        .filter((quote) => query.status && query.status !== "all" ? quote.status === query.status : true)
        .map((quote) => withClient(state, quote))
        .filter((quote) => matchesSearch([quote.quote_number, quote.notes, quote.client?.company, quote.client?.contact_person], query.search));
      return paginate(data, query.page, query.pageSize);
    },
    getById(id: string) {
      const state = readState();
      const quote = state.quotes.find((candidate) => candidate.id === id);
      if (!quote) throw new Error("Quote not found.");
      return withDetails(state, quote);
    },
    saveDraft(value: QuoteBuilderValue) {
      return this.upsert({ ...value, status: "draft" });
    },
    approve(id: string) {
      return this.updateStatus(id, "accepted");
    },
    reject(id: string) {
      return this.updateStatus(id, "rejected");
    },
    duplicate(id: string) {
      const state = readState();
      const quote = state.quotes.find((candidate) => candidate.id === id);
      if (!quote) throw new Error("Quote not found.");
      const details = withDetails(state, quote);
      return this.upsert({
        client_id: details.client_id,
        status: "draft",
        notes: details.notes ?? "",
        items: details.quote_items.map((item) => ({ ...toQuoteBuilderItem(state, item), id: createId("item") })),
      });
    },
    updateStatus(id: string, status: QuoteStatus) {
      let updated: QuoteWithClient | null = null;
      commit((draft) => {
        draft.quotes = draft.quotes.map((quote) => {
          if (quote.id !== id) return quote;
          const next = { ...quote, status, updated_at: new Date().toISOString() };
          updated = withClient(draft, next);
          return next;
        });
        if (updated) recordActivity(draft, "quote", status, updated.quote_number + " moved to " + status + ".", updated.id);
      });
      if (!updated) throw new Error("Quote not found.");
      return updated;
    },
    upsert(value: QuoteBuilderValue) {
      const totals: QuoteTotals = calculateQuoteTotals(value.items);
      let quoteId = value.id ?? createId("quote");
      let saved: QuoteWithDetails | null = null;
      commit((draft) => {
        const now = new Date().toISOString();
        const existing = value.id ? draft.quotes.find((quote) => quote.id === value.id) : undefined;
        quoteId = existing?.id ?? quoteId;
        const quote = {
          id: quoteId,
          owner_id: DEMO_OWNER_ID,
          quote_number: value.quote_number?.trim() || existing?.quote_number || nextQuoteNumber(draft),
          client_id: value.client_id,
          status: value.status,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          notes: value.notes || null,
          archived_at: existing?.archived_at ?? null,
          created_at: existing?.created_at ?? now,
          updated_at: now,
        };
        draft.quotes = existing ? draft.quotes.map((candidate) => candidate.id === quote.id ? quote : candidate) : [quote, ...draft.quotes];
        upsertQuoteItems(draft, quote.id, value.items);
        saved = withDetails(draft, quote);
        recordActivity(draft, "quote", existing ? "updated" : "created", quote.quote_number + " was " + (existing ? "updated" : "created") + ".", quote.id);
      });
      if (!saved) throw new Error("Quote could not be saved.");
      return saved;
    },
    archive(id: string) {
      let archived: QuoteWithClient | null = null;
      commit((draft) => {
        draft.quotes = draft.quotes.map((quote) => {
          if (quote.id !== id) return quote;
          const next = { ...quote, archived_at: new Date().toISOString(), updated_at: new Date().toISOString() };
          archived = withClient(draft, next);
          return next;
        });
        if (archived) recordActivity(draft, "quote", "archived", archived.quote_number + " was archived.", archived.id);
      });
      if (!archived) throw new Error("Quote not found.");
      return archived;
    },
    restore(id: string) {
      let restored: QuoteWithClient | null = null;
      commit((draft) => {
        draft.quotes = draft.quotes.map((quote) => {
          if (quote.id !== id) return quote;
          const next = { ...quote, archived_at: null, updated_at: new Date().toISOString() };
          restored = withClient(draft, next);
          return next;
        });
        if (restored) recordActivity(draft, "quote", "restored", restored.quote_number + " was restored.", restored.id);
      });
      if (!restored) throw new Error("Quote not found.");
      return restored;
    },
    remove(id: string) {
      let removed: QuoteWithDetails | null = null;
      commit((draft) => {
        const quote = draft.quotes.find((candidate) => candidate.id === id);
        if (quote) removed = withDetails(draft, quote);
        draft.quotes = draft.quotes.filter((candidate) => candidate.id !== id);
        draft.quoteItems = draft.quoteItems.filter((item) => item.quote_id !== id);
        if (removed) recordActivity(draft, "quote", "deleted", removed.quote_number + " was deleted from demo data.", removed.id);
      });
      if (!removed) throw new Error("Quote not found.");
      return removed;
    },
  },
  dashboard: {
    getSummary() {
      return buildSummary(readState());
    },
  },
  settings: {
    get() {
      return readState().settings;
    },
    update(values: CompanySettingsUpdate) {
      const state = commit((draft) => {
        draft.settings = { ...draft.settings, ...values, updated_at: new Date().toISOString() };
        recordActivity(draft, "settings", "updated", "Company profile and PDF defaults were updated.", draft.settings.id);
      });
      return state.settings;
    },
  },
  search(term: string): GlobalSearchResult[] {
    const value = normalize(term);
    if (!value) return [];
    const state = readState();
    const clients = state.clients
      .filter((client) => client.archived_at === null)
      .filter((client) => matchesSearch([client.company, client.contact_person, client.email], value))
      .slice(0, 5)
      .map((client) => ({ id: client.id, type: "client" as const, title: client.company, subtitle: client.contact_person + " - " + client.email, href: "/clients" }));
    const products = state.products
      .filter((product) => product.archived_at === null)
      .filter((product) => matchesSearch([product.sku, product.name, product.category], value))
      .slice(0, 5)
      .map((product) => ({ id: product.id, type: "product" as const, title: product.name, subtitle: product.sku + " - " + (product.category ?? "Uncategorized"), href: "/products" }));
    const quotes = state.quotes
      .filter((quote) => quote.archived_at === null)
      .map((quote) => withClient(state, quote))
      .filter((quote) => matchesSearch([quote.quote_number, quote.notes, quote.client?.company], value))
      .slice(0, 5)
      .map((quote) => ({ id: quote.id, type: "quote" as const, title: quote.quote_number, subtitle: quote.status + " - " + formatCurrency(quote.total), href: "/quotes" }));
    return [...clients, ...products, ...quotes];
  },
  ai: {
    run(action: AiAction, input: string, context?: Record<string, unknown>) {
      const trimmed = input.trim();
      const actionLabels: Record<AiAction, string> = {
        quote_description: "Quote description",
        rewrite_description: "Professional rewrite",
        pricing_suggestion: "Pricing recommendation",
        summarize_client_notes: "Client note summary",
        follow_up_email: "Follow-up email",
        reminder_email: "Reminder email",
        suggest_products: "Product suggestions",
        marketing_text: "Marketing copy",
      };
      const preferences = readWorkspacePreferences();
      const settings = readState().settings;
      const styleHint = "\n\nDemo AI settings applied: " + settings.ai_tone + ", " + preferences.aiStyle + ", " + preferences.aiLanguage + ".";
      const contextHint = (context ? "\n\nContext considered: live quote/client/product data from the demo workspace." : "") + styleHint;

      if (action === "follow_up_email") {
        return "Subject: Next steps for your SmartQuote AI proposal\n\nHi there,\n\nThank you for reviewing the proposal. Based on your priorities, I recommend moving forward with the scope as outlined and scheduling a short alignment call to confirm timing, owners, and approval details.\n\nThe quote is structured to keep implementation focused, measurable, and easy for your team to approve.\n\nBest,\nSmartQuote AI" + contextHint;
      }

      if (action === "reminder_email") {
        return "Subject: Friendly reminder: quote awaiting review\n\nHi there,\n\nJust checking in on the quote we shared. The recommended package is still valid, and it is designed to help your team reduce manual quote work while improving approval speed.\n\nHappy to adjust scope, timing, or terms if that would help move this forward.\n\nBest,\nSmartQuote AI" + contextHint;
      }

      if (action === "pricing_suggestion") {
        return "Recommended pricing approach:\n\n1. Keep the core implementation price intact to protect margin.\n2. Offer a modest 5-8% bundle discount only when AI pricing and branded PDF setup are purchased together.\n3. Position training as the adoption accelerator, not an optional add-on.\n\nSuggested rationale: the package reduces manual quoting effort, improves approval polish, and creates repeatable revenue operations. Current workspace currency is " + preferences.currency + "." + contextHint;
      }

      if (action === "suggest_products") {
        return "Suggested package:\n\n- Implementation Sprint for onboarding and workflow setup.\n- AI Pricing Optimization for margin-aware recommendations.\n- Branded PDF System for buyer-ready documents.\n- Revenue Team Training if the client has more than three quote owners.\n\nThis combination creates a complete rollout without overloading the initial scope." + contextHint;
      }

      if (action === "summarize_client_notes") {
        return "Summary:\n\nThe client is focused on faster quote approval, clearer pricing justification, and polished buyer-facing documents. They are likely to respond well to concise ROI framing, phased implementation, and transparent terms.\n\nPriority: keep scope practical, measurable, and easy for finance to approve." + contextHint;
      }

      if (action === "marketing_text") {
        return "Turn complex quoting into a polished revenue workflow. SmartQuote AI helps teams create accurate proposals, apply intelligent pricing guidance, generate branded PDFs, and move every quote from draft to approval with less manual effort." + contextHint;
      }

      const base = trimmed || "the provided client and quote context";
      return actionLabels[action] + ":\n\n" + base + "\n\nRefined version:\nA focused, commercially clear proposal that connects the client's goals to measurable operational impact. The recommended scope improves quote speed, pricing confidence, document quality, and follow-up consistency while keeping implementation practical for the team." + contextHint;
    },
  },
};
