import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientRow } from "@/types/database";
import { formatDate } from "@/utils/formatters";

function initials(client: ClientRow) { return client.contact_person.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || client.company.slice(0, 2).toUpperCase(); }

export function RecentClients({ clients }: { clients: ClientRow[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>Recent clients</CardTitle><CardDescription>Newest active client records.</CardDescription></div><Button title="Open clients" variant="ghost" size="icon" asChild><Link to="/clients"><ArrowUpRight className="size-4" /></Link></Button></CardHeader>
      <CardContent className="space-y-3">{clients.map((client, index) => <motion.div key={client.id} className="flex items-center gap-3 rounded-lg border border-border/70 bg-secondary/30 p-3 transition-all hover:border-ring/40 hover:bg-secondary/50 hover:shadow-md" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.22 }}><Avatar><AvatarFallback>{initials(client)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{client.contact_person}</p><p className="truncate text-xs text-muted-foreground">{client.company}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Created</p><p className="text-sm font-semibold">{formatDate(client.created_at)}</p></div></motion.div>)}</CardContent>
    </Card>
  );
}
