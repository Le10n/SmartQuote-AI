import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityEventRow } from "@/types/database";
import { formatDate } from "@/utils/formatters";

export function ActivityFeed({ activity }: { activity: ActivityEventRow[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Latest activity</CardTitle><CardDescription>Recent workspace changes across clients, products, and quotes.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {activity.length ? activity.map((item, index) => (
          <motion.div key={item.id} className="flex gap-3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.24 }}>
            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-accent-foreground shadow-sm"><Sparkles className="size-4" /></div>
            <div className="min-w-0 flex-1 border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium capitalize">{item.entity_type} {item.action}</p><span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span></div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          </motion.div>
        )) : <EmptyState icon={Sparkles} title="No activity yet" description="Create or update records to build a live audit trail." />}
      </CardContent>
    </Card>
  );
}
