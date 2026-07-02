import { Archive, Edit, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { ClientForm, type ClientFormValues } from "@/components/clients/ClientForm";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useSelection } from "@/hooks/use-selection";
import { useSortableData } from "@/hooks/use-sortable-data";
import { useToast } from "@/hooks/use-toast";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/errors";
import { clientsService } from "@/services/clients.service";
import type { ArchiveFilter } from "@/types";
import type { ClientRow } from "@/types/database";
import { formatDate } from "@/utils/formatters";

const pageSize = 10;
type ClientSortKey = "name" | "status" | "email" | "phone" | "created";

const clientSortAccessors: Record<ClientSortKey, (client: ClientRow) => string | number> = {
  name: (client) => client.company + " " + client.contact_person,
  status: (client) => client.archived_at ? 1 : 0,
  email: (client) => client.email,
  phone: (client) => client.phone ?? "",
  created: (client) => Date.parse(client.created_at),
};

function initials(client: ClientRow) {
  return client.contact_person.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || client.company.slice(0, 2).toUpperCase();
}

export function Clients() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [archive, setArchive] = useState<ArchiveFilter>("active");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ClientRow | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  useKeyboardShortcut("n", () => setModalOpen(true));

  const list = useAsync(() => clientsService.list({ search: debouncedSearch, archive, page, pageSize }), [debouncedSearch, archive, page]);
  const clients = list.data?.data ?? [];
  const count = list.data?.count ?? 0;
  const { sortedItems: sortedClients, sort, toggleSort } = useSortableData<ClientRow, ClientSortKey>(clients, clientSortAccessors, { key: "name", direction: "asc" });
  const clientSelection = useSelection(clients.map((client) => client.id));

  async function saveClient(values: ClientFormValues) {
    setSubmitting(true);
    try {
      if (editing) {
        await clientsService.update(editing.id, values);
        toast.success("Client updated", values.company);
      } else {
        await clientsService.create({ ...values, phone: values.phone || null, address: values.address || null, notes: values.notes || null });
        toast.success("Client created", values.company);
      }
      setModalOpen(false);
      setEditing(null);
      await list.reload();
    } catch (error) {
      toast.error("Client save failed", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function archiveClient(client: ClientRow) {
    try {
      await clientsService.archive(client.id);
      toast.success("Client archived", client.company);
      await list.reload();
    } catch (error) {
      toast.error("Archive failed", getErrorMessage(error));
    }
  }

  async function restoreClient(client: ClientRow) {
    try {
      await clientsService.restore(client.id);
      toast.success("Client restored", client.company);
      await list.reload();
    } catch (error) {
      toast.error("Restore failed", getErrorMessage(error));
    }
  }

  async function archiveSelectedClients() {
    const selected = clients.filter((client) => clientSelection.selectedIds.has(client.id) && !client.archived_at);
    if (!selected.length) {
      toast.warning("No active clients selected", "Choose active clients before archiving.");
      return;
    }

    try {
      await Promise.all(selected.map((client) => clientsService.archive(client.id)));
      toast.success("Clients archived", selected.length + " clients moved to archive.");
      clientSelection.clearSelection();
      await list.reload();
    } catch (error) {
      toast.error("Bulk archive failed", getErrorMessage(error));
    }
  }

  async function restoreSelectedClients() {
    const selected = clients.filter((client) => clientSelection.selectedIds.has(client.id) && client.archived_at);
    if (!selected.length) {
      toast.warning("No archived clients selected", "Choose archived clients before restoring.");
      return;
    }

    try {
      await Promise.all(selected.map((client) => clientsService.restore(client.id)));
      toast.success("Clients restored", selected.length + " clients restored.");
      clientSelection.clearSelection();
      await list.reload();
    } catch (error) {
      toast.error("Bulk restore failed", getErrorMessage(error));
    }
  }

  async function deleteClient(client: ClientRow) {
    try {
      const deleted = await clientsService.remove(client.id);
      setConfirmDelete(null);
      toast.warning("Client deleted", deleted.company, {
        label: "Undo",
        onClick: async () => {
          await clientsService.create({
            id: deleted.id,
            company: deleted.company,
            contact_person: deleted.contact_person,
            email: deleted.email,
            phone: deleted.phone,
            address: deleted.address,
            notes: deleted.notes,
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
      title="Clients"
      description="Manage buying committees, account records, quote history, archived accounts, and client files."
      actions={
        <Button variant="premium" size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="size-4" />
          Add client
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Users className="size-5" /></div>
            <div><p className="text-sm text-muted-foreground">Visible clients</p><p className="text-2xl font-semibold">{count}</p></div>
          </CardContent>
        </Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Filtered view</p><p className="mt-1 text-2xl font-semibold capitalize">{archive}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Keyboard shortcut</p><p className="mt-1 text-2xl font-semibold">N</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client directory</CardTitle>
          <CardDescription>Search, create, edit, archive, restore, and delete client records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataToolbar search={search} archive={archive} placeholder="Search clients" onSearchChange={(value) => { setSearch(value); setPage(1); }} onArchiveChange={(value) => { setArchive(value); setPage(1); }} />
          <BulkActionBar selectedCount={clientSelection.selectedCount} onClear={clientSelection.clearSelection}>
            <Button type="button" variant="outline" size="sm" onClick={() => void archiveSelectedClients()}><Archive className="size-4" />Archive</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void restoreSelectedClients()}><RotateCcw className="size-4" />Restore</Button>
          </BulkActionBar>
          {list.loading ? <TableSkeleton /> : null}
          {!list.loading && clients.length === 0 ? <EmptyState icon={Users} title="No clients found" description="Create a client or adjust your search and filters." /> : null}
          {!list.loading && clients.length ? (
            <Table>
              <TableHeader><TableRow><TableHead className="w-10"><Checkbox aria-label="Select all clients" checked={clientSelection.allSelected} indeterminate={clientSelection.partiallySelected} onChange={(event) => clientSelection.toggleAll(event.target.checked)} /></TableHead><SortableTableHead<ClientSortKey> sortKey="name" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Name</SortableTableHead><SortableTableHead<ClientSortKey> sortKey="status" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Status</SortableTableHead><SortableTableHead<ClientSortKey> sortKey="email" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Email</SortableTableHead><SortableTableHead<ClientSortKey> sortKey="phone" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Phone</SortableTableHead><SortableTableHead<ClientSortKey> sortKey="created" activeKey={sort.key} direction={sort.direction} onSort={toggleSort}>Created</SortableTableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {sortedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="w-10"><Checkbox aria-label={"Select " + client.company} checked={clientSelection.selectedIds.has(client.id)} onChange={(event) => clientSelection.toggleOne(client.id, event.target.checked)} /></TableCell>
                    <TableCell>
                      <div className="flex min-w-52 items-center gap-3"><Avatar><AvatarFallback>{initials(client)}</AvatarFallback></Avatar><div><p className="font-medium">{client.contact_person}</p><p className="text-xs text-muted-foreground">{client.company}</p></div></div>
                    </TableCell>
                    <TableCell><StatusBadge status={client.archived_at ? "archived" : "active"} /></TableCell>
                    <TableCell className="text-muted-foreground">{client.email}</TableCell>
                    <TableCell className="text-muted-foreground">{client.phone ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(client.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button title="Edit" variant="ghost" size="icon" onClick={() => { setEditing(client); setModalOpen(true); }}><Edit className="size-4" /></Button>
                        {client.archived_at ? <Button title="Restore" variant="ghost" size="icon" onClick={() => void restoreClient(client)}><RotateCcw className="size-4" /></Button> : <Button title="Archive" variant="ghost" size="icon" onClick={() => void archiveClient(client)}><Archive className="size-4" /></Button>}
                        <Button title="Delete" variant="ghost" size="icon" onClick={() => setConfirmDelete(client)}><Trash2 className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
        <Pagination page={page} pageSize={pageSize} count={count} onPageChange={setPage} />
      </Card>

      <Modal open={modalOpen} title={editing ? "Edit client" : "Create client"} description={env.demoMode ? "Demo client records are saved locally in this browser." : "Client records are stored securely in Supabase."} onClose={() => { setModalOpen(false); setEditing(null); }}>
        <ClientForm client={editing} submitting={submitting} onSubmit={saveClient} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={Boolean(confirmDelete)} title="Delete client" description="This permanently removes the client. You can undo immediately from the notification." destructive confirmLabel="Delete" onClose={() => setConfirmDelete(null)} onConfirm={() => confirmDelete ? void deleteClient(confirmDelete) : undefined} />
    </PageShell>
  );
}
