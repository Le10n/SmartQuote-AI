import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, Boxes, Clock, FileText, LayoutDashboard, Search, Settings, Sparkles, Users, Wand2 } from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { searchService } from "@/services/search.service";
import type { GlobalSearchResult } from "@/types";

interface PaletteAction {
  label: string;
  hint: string;
  href?: string;
  command?: "open-ai";
  icon: LucideIcon;
}

type CommandPaletteItem =
  | {
      id: string;
      kind: "navigation";
      group: "Actions" | "Results";
      label: string;
      hint: string;
      href?: string;
      command?: "open-ai";
      icon: LucideIcon;
      resultType?: GlobalSearchResult["type"];
    }
  | {
      id: string;
      kind: "recent";
      group: "Recent Searches";
      label: string;
      hint: string;
      query: string;
      icon: LucideIcon;
    };

const recentSearchKey = "smartquote-command-recent-searches";

const actions: PaletteAction[] = [
  { label: "Open Dashboard", hint: "Revenue overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Open Quotes", hint: "Quote pipeline", href: "/quotes", icon: FileText },
  { label: "Open Clients", hint: "Manage accounts", href: "/clients", icon: Users },
  { label: "Open Products", hint: "Catalog and pricing", href: "/products", icon: Boxes },
  { label: "Open Analytics", hint: "Conversion and revenue", href: "/analytics", icon: BarChart3 },
  { label: "Open Settings", hint: "Company, PDF, and AI", href: "/settings", icon: Settings },
  { label: "Ask AI", hint: "Open SmartQuote AI assistant", command: "open-ai", icon: Wand2 },
];

function resultIcon(type: GlobalSearchResult["type"]) {
  if (type === "client") return Users;
  if (type === "product") return Boxes;
  return FileText;
}

function readRecentSearches() {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(recentSearchKey);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string").slice(0, 5);
  } catch {
    return [];
  }
}

function highlightMatch(text: string, query: string) {
  const value = query.trim();
  if (!value) return text;
  const index = text.toLocaleLowerCase().indexOf(value.toLocaleLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-primary/10 px-0.5 text-primary">{text.slice(index, index + value.length)}</mark>
      {text.slice(index + value.length)}
    </>
  );
}

function itemTone(item: CommandPaletteItem) {
  if (item.kind === "recent") return "bg-secondary text-secondary-foreground";
  if (item.kind === "navigation" && item.group === "Actions") return "bg-accent text-accent-foreground";
  if (item.resultType === "quote") return "bg-sky-500/10 text-sky-600 dark:text-sky-300";
  if (item.resultType === "product") return "bg-amber-500/10 text-amber-600 dark:text-amber-300";
  return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
}

export function CommandPalette() {
  const toast = useToast();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounced = useDebouncedValue(query, 180);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setRecentSearches(readRecentSearches());
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  useEffect(() => {
    let mounted = true;
    const value = debounced.trim();
    if (!value) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchService.search(value)
      .then((next) => {
        if (mounted) setResults(next);
      })
      .catch((error) => toast.error("Search failed", getErrorMessage(error)))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [debounced, toast]);

  const filteredActions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return actions;
    return actions.filter((action) => (action.label + " " + action.hint).toLowerCase().includes(value));
  }, [query]);

  const paletteItems = useMemo<CommandPaletteItem[]>(() => {
    const actionItems: CommandPaletteItem[] = filteredActions.map((action) => ({
      id: "action-" + (action.href ?? action.command),
      kind: "navigation",
      group: "Actions",
      label: action.label,
      hint: action.hint,
      href: action.href,
      command: action.command,
      icon: action.icon,
    }));

    const recentItems: CommandPaletteItem[] = query.trim() ? [] : recentSearches.map((term) => ({
      id: "recent-" + term,
      kind: "recent",
      group: "Recent Searches",
      label: term,
      hint: "Search again",
      query: term,
      icon: Clock,
    }));

    const resultItems: CommandPaletteItem[] = results.map((result) => ({
      id: result.type + "-" + result.id,
      kind: "navigation",
      group: "Results",
      label: result.title,
      hint: result.subtitle,
      href: result.href,
      icon: resultIcon(result.type),
      resultType: result.type,
    }));

    return [...actionItems, ...recentItems, ...resultItems];
  }, [filteredActions, query, recentSearches, results]);

  const groupedItems = useMemo(() => {
    const groups: Array<{ label: CommandPaletteItem["group"]; items: CommandPaletteItem[] }> = [];
    for (const item of paletteItems) {
      const group = groups.find((entry) => entry.label === item.group);
      if (group) {
        group.items.push(item);
      } else {
        groups.push({ label: item.group, items: [item] });
      }
    }
    return groups;
  }, [paletteItems]);

  useEffect(() => {
    setSelectedIndex((current) => paletteItems.length ? Math.min(current, paletteItems.length - 1) : 0);
  }, [paletteItems.length]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function rememberSearch(value: string) {
    const term = value.trim();
    if (!term || typeof window === "undefined") return;
    const next = [term, ...recentSearches.filter((item) => item.toLocaleLowerCase() !== term.toLocaleLowerCase())].slice(0, 5);
    setRecentSearches(next);
    window.localStorage.setItem(recentSearchKey, JSON.stringify(next));
  }

  function closePalette() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function goTo(href: string) {
    rememberSearch(query);
    closePalette();
    navigate(href);
  }

  function runCommand(command: "open-ai") {
    rememberSearch(query);
    closePalette();
    if (command === "open-ai") window.dispatchEvent(new CustomEvent("smartquote:open-ai"));
  }

  function selectItem(item: CommandPaletteItem) {
    if (item.kind === "recent") {
      setQuery(item.query);
      window.setTimeout(() => inputRef.current?.focus(), 20);
      return;
    }
    if (item.command) {
      runCommand(item.command);
      return;
    }
    if (item.href) goTo(item.href);
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!paletteItems.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % paletteItems.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => current === 0 ? paletteItems.length - 1 : current - 1);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectItem(paletteItems[selectedIndex]);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-background/70 px-4 pt-[14vh] backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={() => setOpen(false)}
        >
          <motion.div
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-2xl shadow-black/20"
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-border bg-secondary/30 p-3">
              <Search className="pointer-events-none absolute left-6 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search pages, clients, products, or quotes"
                className="h-12 border-0 bg-transparent pl-9 pr-16 text-base shadow-none focus-visible:ring-0"
                aria-activedescendant={paletteItems.length ? "command-item-" + selectedIndex : undefined}
                aria-controls="command-palette-results"
              />
              <kbd className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground sm:block">Esc</kbd>
            </div>

            <div id="command-palette-results" className="max-h-[58vh] overflow-y-auto p-2 premium-scrollbar" role="listbox">
              {groupedItems.map((group) => (
                <div key={group.label}>
                  <p className="px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{group.label}</p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const index = paletteItems.findIndex((candidate) => candidate.id === item.id);
                    const selected = index === selectedIndex;
                    return (
                      <button
                        id={"command-item-" + index}
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-all",
                          selected ? "bg-secondary shadow-sm ring-1 ring-border" : "hover:bg-secondary hover:shadow-sm",
                        )}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => selectItem(item)}
                      >
                        <span className={cn("flex size-9 items-center justify-center rounded-lg", itemTone(item))}><Icon className="size-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{highlightMatch(item.label, query)}</span>
                          <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>
                        </span>
                        {item.kind === "navigation" && item.group === "Results" ? <span className="rounded-md border border-border px-2 py-1 text-xs capitalize text-muted-foreground">{item.resultType}</span> : null}
                        <ArrowRight className={cn("size-4 text-muted-foreground transition-all", selected ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")} />
                      </button>
                    );
                  })}
                </div>
              ))}

              {loading ? <div className="mx-3 my-2 h-16 rounded-lg border border-border bg-secondary/40 command-shimmer" /> : null}
              {query.trim() && !loading && !results.length && !filteredActions.length ? (
                <div className="m-3 rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center">
                  <Sparkles className="mx-auto size-5 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">No matching commands</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try a client, quote number, product SKU, or page name.</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
