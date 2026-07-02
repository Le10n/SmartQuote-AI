import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ArchiveFilter } from "@/types";

interface DataToolbarProps {
  search: string;
  archive: ArchiveFilter;
  placeholder: string;
  onSearchChange: (value: string) => void;
  onArchiveChange: (value: ArchiveFilter) => void;
  extra?: React.ReactNode;
}

export function DataToolbar({ search, archive, placeholder, onSearchChange, onArchiveChange, extra }: DataToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={placeholder} />
      </div>
      <div className="flex gap-2">
        <Select value={archive} onChange={(event) => onArchiveChange(event.target.value as ArchiveFilter)} aria-label="Archive filter">
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All records</option>
        </Select>
        {extra}
      </div>
    </div>
  );
}
