import { Archive, Copy, Download, Edit, FileCheck2, FileText, FileX2, LoaderCircle, Mail, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataToolbar } from "@/components/shared/DataToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/shared/Modal";
import { PageShell } from "@/components/shared/PageShell";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHead } from "@/components/shared/SortableTableHead";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useSelection } from "@/hooks/use-selection";
import { useSortableData } from "@/hooks/use-sortable-data";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";
import { clientsService } from "@/services/clients.service";
import { emailService } from "@/services/email.service";
import { notificationsService } from "@/services/notifications.service";
import { pdfService } from "@/services/pdf.service";
import { productsService } from "@/services/products.service";
import { quotesService } from "@/services/quotes.service";
import { settingsService } from "@/services/settings.service";
import type { ArchiveFilter, QuoteBuilderValue, QuoteWithClient, QuoteWithDetails } from "@/types";
import type { QuoteStatus } from "@/types/database";
import { formatCurrency, formatDate } from "@/utils/formatters";

const pageSize = 10;
type QuoteSortKey = "quote" | "client" | "status" | "total" | "created";

const quoteSortAccessors: Record<QuoteSortKey, (quote: QuoteWithClient) => string | number> = {
  quote: (quote) => quote.quote_number,
  client: (quote) => quote.client?.company ?? "",
  status: (quote) => quote.status,
  total: (quote) => quote.total,
  created: (quote) => Date.parse(quote.created_at),
};

const statuses: Array<QuoteStatus | "all"> = ["all", "draft", "pending", "accepted", "rejected"];

export function Quotes() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [archive, setArchive] = useState<ArchiveFilter>("active");
  const [status, setStatus] = useState<QuoteStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [emailingQuoteId, setEmailingQuoteId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<QuoteWithClient | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  useKeyboardShortcut("n", () => { setSelectedQuote(null); setBuilderOpen(true); });

  const list = useAsync(() => quotesService.list({ search: debouncedSearch, archive, status, page, pageSize }), [debouncedSearch, archive, status, page]);
  const references = useAsync(async () => {
    const [clientResult, productResult] = await Promise.all([
      clientsService.list({ archive: "active", page: 1, pageSize: 200 }),
      productsService.list({ archive: "active", page: 1, pageSize: 200 }),
    ]);
    return { clients: clientResult.data, products: productResult.data };
  }, []);

  const quotes = list.data?.data ?? [];
  const count = list.data?.count ?? 0;
  const { sortedItems: sortedQuotes, sort, toggleSort } = useSortableData<QuoteWithClient, QuoteSortKey>(quotes, quoteSortAccessors, { key: "created", direction: "desc" });
  const quoteSelection = useSelection(quotes.map((quote) => quote.id));

  async function openQuote(quote: QuoteWithClient) {
    try {
      setSelectedQuote(await quotesService.getById(quote.id));
      setBuilderOpen(true);
    } catch (error) {
      toast.error("Quote load failed", getErrorMessage(error));
    }
  }

  async function saveQuote(value: QuoteBuilderValue) {
    setSubmitting(true);
    try {
      if (value.status === "draft") {
        await quotesService.saveDraft(value);
      } else {
        await quotesService.upsert(value);
      }
      toast.success("Quote saved", value.status === "draft" ? "Draft saved successfully." : "Quote sent for approval.");
      notificationsService.notify("Quote saved", value.status === "draft" ? "Draft saved successfully." : "Quote is ready for approval.");
      setBuilderOpen(false);
      setSelectedQuote(null);
      await list.reload();
    } catch (error) {
      toast.error("Quote save failed", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, nextStatus: QuoteStatus) {
    try {
      if (nextStatus === "accepted") {
        await quotesService.approve(id);
      } else if (nextStatus === "rejected") {
        await quotesService.reject(id);
      } else {
        await quotesService.updateStatus(id, nextStatus);
      }
      toast.success("Quote updated", "Status changed to " + nextStatus + ".");
      notificationsService.notify("Quote " + nextStatus, "The quote status changed to " + nextStatus + ".");
      setBuilderOpen(false);
      setSelectedQuote(null);
      await list.reload();
    } catch (error) {
      toast.error("Status update failed", getErrorMessage(error));
    }
  }

  async function duplicateQuote(id: string) {
    try {
      const duplicate = await quotesService.duplicate(id);
      toast.success("Quote duplicated", duplicate.quote_number);
      setSelectedQuote(duplicate);
      await list.reload();
    } catch (error) {
      toast.error("Duplicate failed", getErrorMessage(error));
    }
  }

  async function archiveQuote(quote: QuoteWithClient) {
    try {
      await quotesService.archive(quote.id);
      toast.success("Quote archived", quote.quote_number);
      await list.reload();
    } catch (error) {
      toast.error("Archive failed", getErrorMessage(error));
    }
  }

  async function restoreQuote(quote: QuoteWithClient) {
    try {
      await quotesService.restore(quote.id);
      toast.success("Quote restored", quote.quote_number);
      await list.reload();
    } catch (error) {
      toast.error("Restore failed", getErrorMessage(error));
    }
  }

  async function archiveSelectedQuotes() {
    const selected = quotes.filter((quote) => quoteSelection.selectedIds.has(quote.id) && !quote.archived_at);
    if (!selected.length) {
      toast.warning("No active quotes selected", "Choose active quotes before archiving.");
      return;
    }

    try {
      await Promise.all(selected.map((quote) => quotesService.archive(quote.id)));
      toast.success("Quotes archived", selected.length + " quotes moved to archive.");
      quoteSelection.clearSelection();
      await list.reload();
    } catch (error) {
      toast.error("Bulk archive failed", getErrorMessage(error));
    }
  }

  async function restoreSelectedQuotes() {
    const selected = quotes.filter((quote) => quoteSelection.selectedIds.has(quote.id) && quote.archived_at);
    if (!selected.length) {
      toast.warning("No archived quotes selected", "Choose archived quotes before restoring.");
      return;
    }

    try {
      await Promise.all(selected.map((quote) => quotesService.restore(quote.id)));
      toast.success("Quotes restored", selected.length + " quotes restored.");
      quoteSelection.clearSelection();
      await list.reload();
    } catch (error) {
      toast.error("Bulk restore failed", getErrorMessage(error));
    }
  }

  async function deleteQuote(quote: QuoteWithClient) {
    try {
      await quotesService.remove(quote.id);
      setConfirmDelete(null);
      toast.warning("Quote deleted", quote.quote_number);
      await list.reload();
    } catch (error) {
      toast.error("Delete failed", getErrorMessage(error));
    }
  }

  async function downloadPdf(quote: QuoteWithClient) {
    setGeneratingPdfId(quote.id);
    try {
      const [details, settings] = await Promise.all([quotesService.getById(quote.id), settingsService.get()]);
      const pdf = await pdfService.generateQuotePdf(details, settings);
      pdfService.download(pdf);
      toast.success("PDF downloaded", pdf.fileName);
      notificationsService.notify("PDF exported", pdf.fileName + " is ready.");
    } catch (error) {
      toast.error("PDF failed", getErrorMessage(error));
    } finally {
      setGeneratingPdfId(null);
    }
  }

  async function emailQuote(quote: QuoteWithClient) {
    setEmailingQuoteId(quote.id);
    try {
      const [details, settings] = await Promise.all([quotesService.getById(quote.id), settingsService.get()]);
      const pdf = await pdfService.generateQuotePdf(details, settings);
      await emailService.sendQuote(details, settings, pdf);
      toast.success("Email prepared", details.client?.email ?? "Client recipient");
      notificationsService.notify("Email prepared", details.quote_number + " is ready to send.");
    } catch (error) {
      toast.error("Email failed", getErrorMessage(error));
    } finally {
      setEmailingQuoteId(null);
    }
  }

  return (
    <PageShell
      title="Quotes"
      description="Build, approve, reject, duplicate, email, and export professional quote documents from live database data."
      actions={<Button variant="premium" size="sm" data-tour="quote-builder-action" onClick={() => { setSelectedQuote(null); setBuilderOpen(true); }}><Plus className="size-4" />Create quote</Button>}
    >
      <div className="grid gap-4 md:grid-cols-4">
        {(["draft", "pending", "accepted", "rejected"] as QuoteStatus[]).map((stage) => {
          const stageQuotes = quotes.filter((quote) => quote.status === stage);
          const value = stageQuotes.reduce((sum, quote) => sum + quote.total, 0);
          return (
            <Card key={stage}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><FileText className="size-4" /></div><StatusBadge status={stage} /></div>
                <p className="mt-4 text-2xl font-semibold">{stageQuotes.length}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(value)} in current view</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card data-tour="quotes-page">
        <CardHeader><CardTitle>Quote pipeline</CardTitle><CardDescription>Search, filter, edit, archive, export, and email quotes.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <DataToolbar
            search={search}
            archive={archive}
            placeholder="Search quote numbers or notes"
            onSearchChange={(value) => { setSearch(value); setPage(1); }}
            onArchiveChange={(value) => { setArchive(value); setPage(1); }}
            extra={<Select value={status} onChange={(event) => { setStatus(event.target.value as QuoteStatus | "all"); setPage(1); }}>{statuses.map((item) => <option key={item} value={item}>{item === "all" ? "All statuses" : item}</option>)}</Select>}
          />
          <BulkActionBar selectedCount={quoteSelection.selectedCount} onClear={quoteSelection.clearSelection}>
            <Button type="button" variant="outline" size="sm" onClick={() => void archiveSelectedQuotes()}><Archive className="size-4" />Archive</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void restoreSelectedQuotes()}><RotateCcw className="size-4" />Restore</Button>
          </BulkActionBar>
          {list.loading ? <TableSkeleton /> : null}
          {!list.loading && quotes.length === 0 ? <EmptyState icon={FileText} title="No quotes found" description="Create a quote or adjust your search and filters." /> : null}
          {!list.loading && quotes.length ? (
            <Table>
              <TableHeader><TableRow><TableHead className="w-10"><Checkbox aria-label="Select all quotes" checked={quoteSelection.allSelected} indeterminate={quoteSelection.partiallySelected} onChange={(event) => quoteSelection.toggleAll(event.target.checked)} /></TableHead><SortableTableHead<QuoteSortKey> sortKey="quote" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Quote</SortableTableHead><SortableTableHead<QuoteSortKey> sortKey="client" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Client</SortableTableHead><SortableTableHead<QuoteSortKey> sortKey="status" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Status</SortableTableHead><SortableTableHead<QuoteSortKey> sortKey="total" activeKey={sort.key} direction={sort.direction} onSort={toggleSort} align="right">Total</SortableTableHead><SortableTableHead<QuoteSortKey> sortKey="created" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Created</SortableTableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {sortedQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="w-10"><Checkbox aria-label={"Select " + quote.quote_number} checked={quoteSelection.selectedIds.has(quote.id)} onChange={(event) => quoteSelection.toggleOne(quote.id, event.target.checked)} /></TableCell>
                    <TableCell className="font-medium">{quote.quote_number}</TableCell>
                    <TableCell><p className="font-medium">{quote.client?.company ?? "Unknown client"}</p><p className="text-xs text-muted-foreground">{quote.client?.contact_person ?? ""}</p></TableCell>
                    <TableCell><StatusBadge status={quote.status} /></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(quote.total)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(quote.created_at)}</TableCell>
                    <TableCell><div className="flex justify-end gap-1"><Button title="Edit" variant="ghost" size="icon" onClick={() => void openQuote(quote)}><Edit className="size-4" /></Button><Button title="Duplicate" variant="ghost" size="icon" onClick={() => void duplicateQuote(quote.id)}><Copy className="size-4" /></Button><Button title="Approve" variant="ghost" size="icon" onClick={() => void updateStatus(quote.id, "accepted")}><FileCheck2 className="size-4" /></Button><Button title="Reject" variant="ghost" size="icon" onClick={() => void updateStatus(quote.id, "rejected")}><FileX2 className="size-4" /></Button><Button data-tour="pdf-export" title={generatingPdfId === quote.id ? "Generating PDF..." : "Download PDF"} variant="ghost" size={generatingPdfId === quote.id ? "sm" : "icon"} disabled={generatingPdfId === quote.id} onClick={() => void downloadPdf(quote)}>{generatingPdfId === quote.id ? <><LoaderCircle className="size-4 animate-spin" />Generating PDF...</> : <Download className="size-4" />}</Button><Button title={emailingQuoteId === quote.id ? "Preparing email..." : "Email quote"} variant="ghost" size="icon" disabled={emailingQuoteId === quote.id} onClick={() => void emailQuote(quote)}>{emailingQuoteId === quote.id ? <LoaderCircle className="size-4 animate-spin" /> : <Mail className="size-4" />}</Button>{quote.archived_at ? <Button title="Restore" variant="ghost" size="icon" onClick={() => void restoreQuote(quote)}><RotateCcw className="size-4" /></Button> : <Button title="Archive" variant="ghost" size="icon" onClick={() => void archiveQuote(quote)}><Archive className="size-4" /></Button>}<Button title="Delete" variant="ghost" size="icon" onClick={() => setConfirmDelete(quote)}><Trash2 className="size-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
        <Pagination page={page} pageSize={pageSize} count={count} onPageChange={setPage} />
      </Card>

      <Modal open={builderOpen} title={selectedQuote ? "Edit quote" : "Create quote"} description="Build a professional quote with live products, discounts, tax, preview, PDF, and AI assistance." size="xl" onClose={() => { setBuilderOpen(false); setSelectedQuote(null); }}>
        <QuoteBuilder
          clients={references.data?.clients ?? []}
          products={references.data?.products ?? []}
          quote={selectedQuote}
          submitting={submitting}
          onSave={saveQuote}
          onApprove={(id) => updateStatus(id, "accepted")}
          onReject={(id) => updateStatus(id, "rejected")}
          onDuplicate={duplicateQuote}
        />
      </Modal>
      <ConfirmDialog open={Boolean(confirmDelete)} title="Delete quote" description="This permanently removes the quote and quote items." destructive confirmLabel="Delete" onClose={() => setConfirmDelete(null)} onConfirm={() => confirmDelete ? void deleteQuote(confirmDelete) : undefined} />
    </PageShell>
  );
}
