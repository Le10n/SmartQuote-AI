import { AnimatePresence, motion } from "framer-motion";
import { Copy, FileCheck2, FileX2, GripVertical, Plus, RotateCcw, Save, Search, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useWorkspacePreferences } from "@/hooks/use-workspace-preferences";
import type { ClientRow, ProductRow } from "@/types/database";
import type { QuoteBuilderItem, QuoteBuilderValue, QuoteWithDetails } from "@/types";
import { calculateLineTotal, calculateQuoteTotals } from "@/utils/calculations";
import { formatCurrency, getCurrencySymbol } from "@/utils/formatters";

interface QuoteBuilderProps {
  clients: ClientRow[];
  products: ProductRow[];
  quote?: QuoteWithDetails | null;
  submitting?: boolean;
  onSave: (value: QuoteBuilderValue) => void | Promise<void>;
  onApprove?: (id: string) => void | Promise<void>;
  onReject?: (id: string) => void | Promise<void>;
  onDuplicate?: (id: string) => void | Promise<void>;
  defaultTax?: number;
  pdfAccentColor?: string;
}

function toInitialItems(quote?: QuoteWithDetails | null): QuoteBuilderItem[] {
  return quote?.quote_items.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    name: item.product?.name ?? "Product",
    quantity: item.quantity,
    price: item.price,
    discount: item.discount,
    tax: item.tax,
    total: item.total,
  })) ?? [];
}

function createItem(product: ProductRow, defaultTax: number, defaultDiscount: number): QuoteBuilderItem {
  const discount = Number.isFinite(defaultDiscount) ? defaultDiscount : 0;
  const tax = Number.isFinite(product.tax) ? product.tax : defaultTax;
  return {
    id: crypto.randomUUID(),
    product_id: product.id,
    name: product.name,
    quantity: 1,
    price: product.selling_price,
    discount,
    tax,
    total: calculateLineTotal({ quantity: 1, price: product.selling_price, discount, tax }),
  };
}

function normalizeHexColor(value: string | undefined, fallback = "#0f766e") {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function QuoteBuilder({ clients, products, quote, submitting, onSave, onApprove, onReject, onDuplicate, defaultTax = 0, pdfAccentColor }: QuoteBuilderProps) {
  const { preferences } = useWorkspacePreferences();
  const [clientId, setClientId] = useState(quote?.client_id ?? clients[0]?.id ?? "");
  const [notes, setNotes] = useState(quote?.notes ?? preferences.defaultNotes);
  const [items, setItems] = useState<QuoteBuilderItem[]>(() => toInitialItems(quote));
  const [removedItem, setRemovedItem] = useState<QuoteBuilderItem | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [autosaveLabel, setAutosaveLabel] = useState("Ready to build");
  const totals = useMemo(() => calculateQuoteTotals(items), [items]);
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => (product.name + " " + product.sku + " " + (product.category ?? "")).toLowerCase().includes(term));
  }, [productSearch, products]);
  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const currencySymbol = getCurrencySymbol(preferences.currency);
  const pdfAccent = normalizeHexColor(pdfAccentColor, normalizeHexColor(preferences.pdfAccentColor));
  const pdfAccentGradient = "linear-gradient(90deg, " + pdfAccent + ", color-mix(in oklab, " + pdfAccent + " 68%, #2563eb))";

  useKeyboardShortcut("mod+s", () => {
    if (!clientId || !items.length || submitting) return;
    void submit("draft");
  }, Boolean(clientId && items.length));

  useEffect(() => {
    setClientId(quote?.client_id ?? clients[0]?.id ?? "");
    setNotes(quote?.notes ?? preferences.defaultNotes);
    setItems(toInitialItems(quote));
    setRemovedItem(null);
    setDraggingItemId(null);
  }, [clients, preferences.defaultNotes, quote]);

  useEffect(() => {
    if (!env.demoMode || typeof window === "undefined") return undefined;

    setAutosaveLabel("Saving...");
    const timeout = window.setTimeout(() => {
      const draft = { id: quote?.id, quote_number: quote?.quote_number, client_id: clientId, notes, items, updated_at: new Date().toISOString() };
      window.localStorage.setItem("smartquote-builder-autosave", JSON.stringify(draft));
      setAutosaveLabel("Saved 2 sec ago");
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [clientId, items, notes, quote?.id, quote?.quote_number]);

  function addProduct(productId = filteredProducts[0]?.id ?? products[0]?.id) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setItems((current) => [...current, createItem(product, defaultTax, preferences.defaultDiscount)]);
  }

  function updateItem(id: string, patch: Partial<QuoteBuilderItem>) {
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...patch };
      return { ...next, total: calculateLineTotal(next) };
    }));
  }

  function changeProduct(itemId: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    updateItem(itemId, { product_id: product.id, name: product.name, price: product.selling_price, tax: product.tax });
  }

  function duplicateItem(item: QuoteBuilderItem) {
    setItems((current) => [...current, { ...item, id: crypto.randomUUID() }]);
  }

  function moveItem(targetId: string) {
    if (!draggingItemId || draggingItemId === targetId) return;
    setItems((current) => {
      const sourceIndex = current.findIndex((item) => item.id === draggingItemId);
      const targetIndex = current.findIndex((item) => item.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  function removeItem(item: QuoteBuilderItem) {
    setRemovedItem(item);
    setItems((current) => current.filter((row) => row.id !== item.id));
  }

  function restoreRemovedItem() {
    if (!removedItem) return;
    setItems((current) => [...current, removedItem]);
    setRemovedItem(null);
  }

  function addSuggestion(text: string) {
    setNotes((current) => current.trim() ? current + "\n\n" + text : text);
  }

  function submit(status: QuoteBuilderValue["status"] = quote?.status ?? "draft") {
    return onSave({ id: quote?.id, quote_number: quote?.quote_number, client_id: clientId, status, notes, items });
  }

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
      <div className="space-y-5">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="client_id">Client</Label>
            <motion.span
              key={autosaveLabel}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground",
                autosaveLabel === "Saving..." && "border-ring/25 bg-[var(--accent-soft)] text-accent-foreground"
              )}
            >
              {autosaveLabel}
            </motion.span>
          </div>
          <Select id="client_id" value={clientId} onChange={(event) => setClientId(event.target.value)} data-cursor="Edit">
            {clients.map((client) => <option key={client.id} value={client.id}>{client.company} - {client.contact_person}</option>)}
          </Select>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card/70 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border bg-secondary/20 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h3 className="text-sm font-semibold">Quote items</h3><p className="text-xs text-muted-foreground">Search products, add rows, duplicate items, and watch totals update live.</p></div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products or SKU" className="pl-9" />
              </div>
              <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => addProduct()} disabled={!filteredProducts.length} data-cursor="Create"><Plus className="size-4" />Add product</Button>
            </div>
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -18, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="grid min-w-0 gap-3 rounded-lg border border-border bg-background/68 p-4 shadow-sm transition-all hover:border-ring/40 hover:shadow-md data-[dragging=true]:border-ring data-[dragging=true]:bg-secondary/50 md:grid-cols-4 min-[1900px]:grid-cols-[minmax(280px,1fr)_88px_118px_108px_92px_132px_88px] min-[1900px]:items-end"
                  data-dragging={draggingItemId === item.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => { moveItem(item.id); setDraggingItemId(null); }}
                >
                  <div className="flex min-w-0 items-end gap-3 md:col-span-4 min-[1900px]:col-span-1">
                    <button
                      type="button"
                      className="flex size-10 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:cursor-grabbing"
                      draggable
                      title="Drag to reorder"
                      aria-label="Drag to reorder quote item"
                      onDragStart={() => setDraggingItemId(item.id)}
                      onDragEnd={() => setDraggingItemId(null)}
                      data-cursor="Move"
                    >
                      <GripVertical className="size-4" />
                    </button>
                    <div className="grid min-w-0 flex-1 gap-2"><Label>Product</Label><Select value={item.product_id} onChange={(event) => changeProduct(item.id, event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</Select></div>
                  </div>
                  <div className="grid min-w-0 gap-2"><Label>Qty</Label><Input className="quote-number-input text-right tabular-nums" inputMode="decimal" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} /></div>
                  <div className="grid min-w-0 gap-2"><Label>Price</Label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span><Input className="quote-number-input pl-7 text-right tabular-nums" inputMode="decimal" type="number" min="0" step="0.01" value={item.price} onChange={(event) => updateItem(item.id, { price: Number(event.target.value) })} /></div></div>
                  <div className="grid min-w-0 gap-2"><Label>Discount</Label><div className="relative"><Input className="quote-number-input pr-7 text-right tabular-nums" inputMode="decimal" type="number" min="0" max="100" step="0.01" value={item.discount} onChange={(event) => updateItem(item.id, { discount: Number(event.target.value) })} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span></div></div>
                  <div className="grid min-w-0 gap-2"><Label>Tax</Label><div className="relative"><Input className="quote-number-input pr-7 text-right tabular-nums" inputMode="decimal" type="number" min="0" max="100" step="0.01" value={item.tax} onChange={(event) => updateItem(item.id, { tax: Number(event.target.value) })} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span></div></div>
                  <div className="grid min-w-0 gap-2 md:col-span-2 min-[1900px]:col-span-1"><Label>Total</Label><motion.p key={item.total} initial={{ opacity: 0.6, y: 3 }} animate={{ opacity: 1, y: 0 }} className="h-10 truncate rounded-lg border border-border bg-background px-3 py-2 text-right text-sm font-medium tabular-nums">{formatCurrency(item.total)}</motion.p></div>
                  <div className="flex items-end justify-end gap-1 md:col-span-2 min-[1900px]:col-span-1">
                    <Button title="Duplicate row" aria-label="Duplicate quote item" type="button" variant="ghost" size="icon" onClick={() => duplicateItem(item)} data-cursor="Create"><Copy className="size-4" /></Button>
                    <Button title="Remove row" aria-label="Remove quote item" type="button" variant="ghost" size="icon" onClick={() => removeItem(item)} data-cursor="Click"><Trash2 className="size-4" /></Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!items.length ? (
              <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-8 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-lg border border-border bg-background text-foreground"><Sparkles className="size-5" /></div>
                <p className="mt-3 text-sm font-medium">Start with a product</p>
                <p className="mt-1 text-sm text-muted-foreground">Search the catalog and add your first line item to unlock live totals and AI quote guidance.</p>
                <Button type="button" variant="premium" size="sm" className="mt-4" disabled={!filteredProducts.length} onClick={() => addProduct()}><Plus className="size-4" />Add first product</Button>
              </div>
            ) : null}
            <AnimatePresence>
              {removedItem ? (
                <motion.div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <span className="text-amber-800 dark:text-amber-200">Removed {removedItem.name}</span>
                  <Button type="button" variant="outline" size="sm" onClick={restoreRemovedItem}><RotateCcw className="size-4" />Undo</Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label htmlFor="notes">Notes</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addSuggestion("SmartQuote AI recommendation: position this proposal around measurable ROI, fast approval, and a low-risk implementation path.")} data-cursor="AI"><Sparkles className="size-4" />AI angle</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addSuggestion("Suggested follow-up: I can also prepare an approval-ready summary for the buying team if helpful.")} data-cursor="AI"><Wand2 className="size-4" />Follow-up line</Button>
            </div>
          </div>
          <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Terms, scope details, implementation notes, or customer context" className="min-h-32" data-cursor="Edit" />
        </div>

        <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap justify-end gap-2 border-t border-border bg-card/95 px-1 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          {quote?.id ? <Button type="button" variant="outline" onClick={() => onDuplicate ? void onDuplicate(quote.id) : undefined}><Copy className="size-4" />Duplicate</Button> : null}
          <Button type="button" variant="outline" disabled={submitting || !clientId || !items.length} onClick={() => void submit("draft")}><Save className="size-4" />{submitting ? "Saving..." : "Save draft"}</Button>
          {quote?.id ? <Button type="button" variant="outline" onClick={() => onReject ? void onReject(quote.id) : undefined}><FileX2 className="size-4" />Reject</Button> : null}
          {quote?.id ? <Button type="button" variant="premium" disabled={submitting} onClick={() => onApprove ? void onApprove(quote.id) : undefined}><FileCheck2 className="size-4" />{submitting ? "Approving..." : "Approve"}</Button> : <Button type="button" variant="premium" disabled={submitting || !clientId || !items.length} onClick={() => void submit("pending")}><FileCheck2 className="size-4" />{submitting ? "Sending..." : "Send for approval"}</Button>}
        </div>
      </div>

      <div className="space-y-4 2xl:sticky 2xl:top-24 2xl:self-start">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-xl shadow-black/[0.04]">
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: pdfAccentGradient }} />
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm text-muted-foreground">Live document preview</p><h3 className="mt-1 text-lg font-semibold">{quote?.quote_number ?? "New quote"}</h3></div>
            <StatusBadge status={quote?.status ?? "draft"} />
          </div>
          <div className="mt-5 rounded-lg border border-border/80 bg-background/60 p-4 shadow-inner">
            <div className="flex justify-between gap-4 border-b border-border pb-3 text-sm"><span className="text-muted-foreground">Prepared for</span><span className="text-right font-medium">{selectedClient?.company ?? "Select a client"}</span></div>
            <div className="mt-4 space-y-2">
              {items.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-secondary/40 px-3 py-2 text-sm">
                  <span className="truncate">{item.quantity} x {item.name}</span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
              {items.length > 4 ? <p className="text-xs text-muted-foreground">+ {items.length - 4} more items included in the quote</p> : null}
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Subtotal</span><motion.span key={totals.subtotal} initial={{ opacity: 0.6, y: 2 }} animate={{ opacity: 1, y: 0 }} className="font-medium">{formatCurrency(totals.subtotal)}</motion.span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Tax</span><motion.span key={totals.tax} initial={{ opacity: 0.6, y: 2 }} animate={{ opacity: 1, y: 0 }} className="font-medium">{formatCurrency(totals.tax)}</motion.span></div>
            <div className="border-t border-border pt-3 text-base font-semibold"><div className="flex justify-between gap-4"><span>Total</span><motion.span key={totals.total} initial={{ opacity: 0.45, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>{formatCurrency(totals.total)}</motion.span></div></div>
          </div>
          <div className="mt-4 rounded-lg border border-ring/20 bg-[var(--accent-soft)] p-3 text-xs leading-5 text-accent-foreground">
            AI hint: keep discounts explicit and pair the {preferences.currency} total with a {preferences.aiStyle.toLowerCase()} summary.
          </div>
        </div>
        <AiAssistantPanel context={{ client: selectedClient, totals, items, notes }} />
      </div>
    </div>
  );
}
