import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";
export type SortValue = string | number | Date | null | undefined;

export interface SortState<TSortKey extends string> {
  key: TSortKey;
  direction: SortDirection;
}

function normalizeSortValue(value: SortValue) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") return value.toLocaleLowerCase();
  if (typeof value === "number") return value;
  return "";
}

export function useSortableData<TItem, TSortKey extends string>(
  items: readonly TItem[],
  accessors: Record<TSortKey, (item: TItem) => SortValue>,
  initialSort: SortState<TSortKey>,
) {
  const [sort, setSort] = useState<SortState<TSortKey>>(initialSort);

  const sortedItems = useMemo(() => {
    const accessor = accessors[sort.key];
    return [...items].sort((left, right) => {
      const leftValue = normalizeSortValue(accessor(left));
      const rightValue = normalizeSortValue(accessor(right));
      const result = leftValue > rightValue ? 1 : leftValue < rightValue ? -1 : 0;
      return sort.direction === "asc" ? result : -result;
    });
  }, [accessors, items, sort.direction, sort.key]);

  function toggleSort(key: TSortKey) {
    setSort((current) => {
      if (current.key !== key) return { key, direction: "asc" };
      return { key, direction: current.direction === "asc" ? "desc" : "asc" };
    });
  }

  return { sortedItems, sort, toggleSort };
}
