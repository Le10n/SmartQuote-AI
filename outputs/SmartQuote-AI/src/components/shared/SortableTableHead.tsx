import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { TableHead } from "@/components/ui/table";
import type { SortDirection } from "@/hooks/use-sortable-data";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps<TSortKey extends string> {
  children: ReactNode;
  sortKey: TSortKey;
  activeKey: string;
  direction: SortDirection;
  onSort: (key: TSortKey) => void;
  className?: string;
  align?: "left" | "right";
}

export function SortableTableHead<TSortKey extends string>({
  children,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
  align = "left",
}: SortableTableHeadProps<TSortKey>) {
  const active = activeKey === sortKey;
  const Icon = active ? direction === "asc" ? ArrowUp : ArrowDown : ChevronsUpDown;

  return (
    <TableHead className={cn(align === "right" && "text-right", className)} aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className={cn(
          "inline-flex w-full items-center gap-1.5 rounded-md text-xs font-medium uppercase tracking-[0.08em] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          align === "right" && "justify-end",
          active && "text-foreground",
        )}
        onClick={() => onSort(sortKey)}
      >
        {children}
        <Icon className={cn("size-3.5 transition-opacity", active ? "opacity-100" : "opacity-45")} />
      </button>
    </TableHead>
  );
}
