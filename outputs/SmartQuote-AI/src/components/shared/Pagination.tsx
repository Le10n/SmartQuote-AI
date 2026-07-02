import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageSize: number;
  count: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, count, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 pb-24 pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:pb-6">
      <span>{start}-{end} of {count}</span>
      <div className="flex items-center gap-2">
        <Button title="Previous page" variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-20 text-center">Page {page} / {pages}</span>
        <Button title="Next page" variant="outline" size="icon" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
