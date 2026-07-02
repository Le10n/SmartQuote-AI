import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuoteStatus } from "@/types/database";

type Status = QuoteStatus | "active" | "archived" | "beta" | "paused" | "Enterprise" | "Growth" | "Startup";

const variants: Record<Status, "success" | "warning" | "info" | "danger" | "secondary"> = {
  accepted: "success",
  active: "success",
  Enterprise: "success",
  pending: "info",
  Growth: "info",
  beta: "info",
  draft: "warning",
  Startup: "warning",
  rejected: "danger",
  archived: "danger",
  paused: "danger",
};

const labels: Record<Status, string> = {
  accepted: "Accepted",
  active: "Active",
  Enterprise: "Enterprise",
  pending: "Pending",
  Growth: "Growth",
  beta: "Beta",
  draft: "Draft",
  Startup: "Startup",
  rejected: "Rejected",
  archived: "Archived",
  paused: "Paused",
};

const dotStyles: Record<Status, string> = {
  accepted: "bg-emerald-500",
  active: "bg-emerald-500",
  Enterprise: "bg-emerald-500",
  pending: "bg-sky-500",
  Growth: "bg-sky-500",
  beta: "bg-sky-500",
  draft: "bg-amber-500",
  Startup: "bg-amber-500",
  rejected: "bg-rose-500",
  archived: "bg-rose-500",
  paused: "bg-rose-500",
};

export function StatusBadge({ status }: { status: Status }) {
  const animated = status === "pending" || status === "draft" || status === "beta";

  return (
    <Badge variant={variants[status]} className="capitalize">
      <span className={cn("size-1.5 rounded-full", dotStyles[status], animated && "animate-pulse")} />
      {labels[status]}
    </Badge>
  );
}
