import { useEffect, useMemo, useState } from "react";

export function useSelection<TId extends string>(visibleIds: readonly TId[]) {
  const [selectedIds, setSelectedIds] = useState<Set<TId>>(() => new Set());
  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  useEffect(() => {
    setSelectedIds((current) => {
      const next = new Set<TId>();
      let changed = false;
      for (const id of current) {
        if (visibleIdSet.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [visibleIdSet]);

  const selectedCount = selectedIds.size;
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const partiallySelected = selectedCount > 0 && !allSelected;

  function toggleOne(id: TId, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(visibleIds) : new Set());
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return { selectedIds, selectedCount, allSelected, partiallySelected, toggleOne, toggleAll, clearSelection };
}
