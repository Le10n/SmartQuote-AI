import { Archive, Boxes, Edit, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProductForm, type ProductFormValues } from "@/components/products/ProductForm";
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
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useSelection } from "@/hooks/use-selection";
import { useSortableData } from "@/hooks/use-sortable-data";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";
import { productsService } from "@/services/products.service";
import type { ArchiveFilter } from "@/types";
import type { ProductRow } from "@/types/database";
import { formatCurrency } from "@/utils/formatters";

const pageSize = 10;
type ProductSortKey = "product" | "status" | "price" | "tax" | "margin" | "stock";

function margin(product: ProductRow) {
  if (!product.selling_price) return 0;
  return Math.max(0, Math.round(((product.selling_price - product.purchase_price) / product.selling_price) * 100));
}

const productSortAccessors: Record<ProductSortKey, (product: ProductRow) => string | number> = {
  product: (product) => product.name + " " + product.sku + " " + (product.category ?? ""),
  status: (product) => product.archived_at ? 1 : 0,
  price: (product) => product.selling_price,
  tax: (product) => product.tax,
  margin,
  stock: (product) => product.stock,
};

export function Products() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [archive, setArchive] = useState<ArchiveFilter>("active");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProductRow | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  useKeyboardShortcut("n", () => setModalOpen(true));

  const list = useAsync(() => productsService.list({ search: debouncedSearch, archive, page, pageSize }), [debouncedSearch, archive, page]);
  const products = list.data?.data ?? [];
  const count = list.data?.count ?? 0;
  const { sortedItems: sortedProducts, sort, toggleSort } = useSortableData<ProductRow, ProductSortKey>(products, productSortAccessors, { key: "product", direction: "asc" });
  const productSelection = useSelection(products.map((product) => product.id));

  async function saveProduct(values: ProductFormValues) {
    setSubmitting(true);
    try {
      const payload = { ...values, description: values.description || null, category: values.category || null };
      if (editing) {
        await productsService.update(editing.id, payload);
        toast.success("Product updated", values.name);
      } else {
        await productsService.create(payload);
        toast.success("Product created", values.name);
      }
      setModalOpen(false);
      setEditing(null);
      await list.reload();
    } catch (error) {
      toast.error("Product save failed", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function archiveProduct(product: ProductRow) {
    try {
      await productsService.archive(product.id);
      toast.success("Product archived", product.name);
      await list.reload();
    } catch (error) {
      toast.error("Archive failed", getErrorMessage(error));
    }
  }

  async function restoreProduct(product: ProductRow) {
    try {
      await productsService.restore(product.id);
      toast.success("Product restored", product.name);
      await list.reload();
    } catch (error) {
      toast.error("Restore failed", getErrorMessage(error));
    }
  }

  async function archiveSelectedProducts() {
    const selected = products.filter((product) => productSelection.selectedIds.has(product.id) && !product.archived_at);
    if (!selected.length) {
      toast.warning("No active products selected", "Choose active products before archiving.");
      return;
    }

    try {
      await Promise.all(selected.map((product) => productsService.archive(product.id)));
      toast.success("Products archived", selected.length + " products moved to archive.");
      productSelection.clearSelection();
      await list.reload();
    } catch (error) {
      toast.error("Bulk archive failed", getErrorMessage(error));
    }
  }

  async function restoreSelectedProducts() {
    const selected = products.filter((product) => productSelection.selectedIds.has(product.id) && product.archived_at);
    if (!selected.length) {
      toast.warning("No archived products selected", "Choose archived products before restoring.");
      return;
    }

    try {
      await Promise.all(selected.map((product) => productsService.restore(product.id)));
      toast.success("Products restored", selected.length + " products restored.");
      productSelection.clearSelection();
      await list.reload();
    } catch (error) {
      toast.error("Bulk restore failed", getErrorMessage(error));
    }
  }

  async function deleteProduct(product: ProductRow) {
    try {
      const deleted = await productsService.remove(product.id);
      setConfirmDelete(null);
      toast.warning("Product deleted", deleted.name, {
        label: "Undo",
        onClick: async () => {
          await productsService.create({
            id: deleted.id,
            sku: deleted.sku,
            name: deleted.name,
            description: deleted.description,
            category: deleted.category,
            purchase_price: deleted.purchase_price,
            selling_price: deleted.selling_price,
            tax: deleted.tax,
            stock: deleted.stock,
            unit: deleted.unit,
            image_path: deleted.image_path,
          });
          await list.reload();
        },
      });
      await list.reload();
    } catch (error) {
      toast.error("Delete failed", getErrorMessage(error));
    }
  }

  return (
    <PageShell
      title="Products"
      description="Manage SKU pricing, tax, margins, inventory, product images, and archive state."
      actions={<Button variant="premium" size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="size-4" />Add product</Button>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="flex size-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><Boxes className="size-5" /></div><div><p className="text-sm text-muted-foreground">Visible products</p><p className="text-2xl font-semibold">{count}</p></div></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Avg. margin in view</p><p className="mt-1 text-2xl font-semibold">{products.length ? Math.round(products.reduce((sum, product) => sum + margin(product), 0) / products.length) : 0}%</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Inventory units</p><p className="mt-1 text-2xl font-semibold">{products.reduce((sum, product) => sum + product.stock, 0)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Product catalog</CardTitle><CardDescription>Search, create, edit, archive, restore, and delete products.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <DataToolbar search={search} archive={archive} placeholder="Search products" onSearchChange={(value) => { setSearch(value); setPage(1); }} onArchiveChange={(value) => { setArchive(value); setPage(1); }} />
          <BulkActionBar selectedCount={productSelection.selectedCount} onClear={productSelection.clearSelection}>
            <Button type="button" variant="outline" size="sm" onClick={() => void archiveSelectedProducts()}><Archive className="size-4" />Archive</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void restoreSelectedProducts()}><RotateCcw className="size-4" />Restore</Button>
          </BulkActionBar>
          {list.loading ? <TableSkeleton /> : null}
          {!list.loading && products.length === 0 ? <EmptyState icon={Boxes} title="No products found" description="Create a product or adjust your search and filters." /> : null}
          {!list.loading && products.length ? (
            <Table>
              <TableHeader><TableRow><TableHead className="w-10"><Checkbox aria-label="Select all products" checked={productSelection.allSelected} indeterminate={productSelection.partiallySelected} onChange={(event) => productSelection.toggleAll(event.target.checked)} /></TableHead><SortableTableHead<ProductSortKey> sortKey="product" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Product</SortableTableHead><SortableTableHead<ProductSortKey> sortKey="status" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Status</SortableTableHead><SortableTableHead<ProductSortKey> sortKey="price" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Price</SortableTableHead><SortableTableHead<ProductSortKey> sortKey="tax" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Tax</SortableTableHead><SortableTableHead<ProductSortKey> sortKey="margin" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Margin</SortableTableHead><SortableTableHead<ProductSortKey> sortKey="stock" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Stock</SortableTableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="w-10"><Checkbox aria-label={"Select " + product.name} checked={productSelection.selectedIds.has(product.id)} onChange={(event) => productSelection.toggleOne(product.id, event.target.checked)} /></TableCell>
                    <TableCell><div className="min-w-56"><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku} - {product.category ?? "Uncategorized"}</p></div></TableCell>
                    <TableCell><StatusBadge status={product.archived_at ? "archived" : "active"} /></TableCell>
                    <TableCell className="font-medium">{formatCurrency(product.selling_price)}</TableCell>
                    <TableCell className="text-muted-foreground">{product.tax}%</TableCell>
                    <TableCell className="min-w-36"><div className="flex items-center gap-3"><Progress value={margin(product)} /><span className="w-9 text-xs text-muted-foreground">{margin(product)}%</span></div></TableCell>
                    <TableCell className="text-muted-foreground">{product.stock} {product.unit}</TableCell>
                    <TableCell><div className="flex justify-end gap-1"><Button title="Edit" variant="ghost" size="icon" onClick={() => { setEditing(product); setModalOpen(true); }}><Edit className="size-4" /></Button>{product.archived_at ? <Button title="Restore" variant="ghost" size="icon" onClick={() => void restoreProduct(product)}><RotateCcw className="size-4" /></Button> : <Button title="Archive" variant="ghost" size="icon" onClick={() => void archiveProduct(product)}><Archive className="size-4" /></Button>}<Button title="Delete" variant="ghost" size="icon" onClick={() => setConfirmDelete(product)}><Trash2 className="size-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
        <Pagination page={page} pageSize={pageSize} count={count} onPageChange={setPage} />
      </Card>

      <Modal open={modalOpen} title={editing ? "Edit product" : "Create product"} description="Catalog data drives quote builder calculations." onClose={() => { setModalOpen(false); setEditing(null); }}>
        <ProductForm product={editing} submitting={submitting} onSubmit={saveProduct} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={Boolean(confirmDelete)} title="Delete product" description="This permanently removes the product. You can undo immediately from the notification." destructive confirmLabel="Delete" onClose={() => setConfirmDelete(null)} onConfirm={() => confirmDelete ? void deleteProduct(confirmDelete) : undefined} />
    </PageShell>
  );
}
