import { AnimatePresence, motion } from "framer-motion";
import { Bot, Command, LogOut, Menu, Moon, Plus, Search, Sparkles, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useWorkspacePreferences } from "@/hooks/use-workspace-preferences";
import { getErrorMessage } from "@/lib/errors";
import { searchService } from "@/services/search.service";
import type { GlobalSearchResult } from "@/types";

interface TopbarProps {
  onMenuClick: () => void;
}

const topbarIconButton = "size-9 rounded-lg border-border/80 bg-background/70 shadow-sm shadow-black/[0.02] backdrop-blur hover:border-ring/45 hover:bg-secondary/85 focus-visible:ring-ring/35 dark:bg-background/45 dark:hover:bg-secondary/75";

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { preferences } = useWorkspacePreferences();
  const location = useLocation();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const debounced = useDebouncedValue(search, 220);
  const profileInitials = useMemo(() => {
    const source = preferences.profileName.trim() || user?.email || "SmartQuote";
    return source.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }, [preferences.profileName, user?.email]);

  useEffect(() => {
    let mounted = true;
    if (!debounced.trim()) {
      setResults([]);
      return;
    }

    searchService.search(debounced).then((next) => {
      if (mounted) setResults(next);
    }).catch((error) => toast.error("Search failed", getErrorMessage(error)));

    return () => {
      mounted = false;
    };
  }, [debounced, toast]);

  useEffect(() => {
    function openAssistant() {
      setAssistantOpen(true);
    }

    window.addEventListener("smartquote:open-ai", openAssistant);
    return () => window.removeEventListener("smartquote:open-ai", openAssistant);
  }, []);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out");
    } catch (error) {
      toast.error("Sign out failed", getErrorMessage(error));
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/70 glass-panel shadow-sm shadow-black/[0.03]">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button title="Open sidebar" aria-label="Open sidebar" variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="size-4" />
          </Button>

          <div className="relative hidden min-w-0 flex-1 md:block">
            <div className="pointer-events-none absolute -inset-1 max-w-xl rounded-xl bg-[linear-gradient(90deg,color-mix(in_oklab,var(--accent)_26%,transparent),transparent)] opacity-70" />
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search"
              className="relative h-9 max-w-xl border-border/80 bg-background/72 pl-9 pr-20 shadow-sm backdrop-blur hover:bg-background/90 focus-visible:bg-background dark:bg-background/50 dark:hover:bg-background/70"
              placeholder="Search quotes, clients, products"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground lg:flex"><Command className="size-3" />K</kbd>
            <AnimatePresence>
              {open && results.length ? (
                <motion.div
                  className="absolute left-0 top-11 z-50 w-full max-w-xl overflow-hidden rounded-lg border border-border/80 bg-popover/95 shadow-2xl shadow-black/15 backdrop-blur-xl"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  {results.map((result) => (
                    <Link
                      key={result.type + result.id}
                      to={result.href}
                      className="block border-b border-border/70 px-4 py-3 transition-colors last:border-0 hover:bg-secondary/70"
                      onClick={() => {
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{result.title}</p>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">{result.type}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{result.subtitle}</p>
                    </Link>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur xl:flex dark:bg-background/35">
              <Sparkles className="size-3.5 text-accent-foreground" />
              AI workspace active
            </div>
            <Button title="Create quote" variant="premium" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/quotes">
                <Plus className="size-4" />
                New quote
              </Link>
            </Button>
            <Button title="AI Assistant" aria-label="AI Assistant" variant="outline" size="icon" className={topbarIconButton} onClick={() => setAssistantOpen(true)} data-tour="ai-assistant-trigger" data-cursor="AI">
              <Bot className="size-4 text-accent-foreground" />
            </Button>
            <Button title={theme === "dark" ? "Use light mode" : "Use dark mode"} aria-label={theme === "dark" ? "Use light mode" : "Use dark mode"} variant="outline" size="icon" className={topbarIconButton} onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button title="Sign out" aria-label="Sign out" variant="outline" size="icon" className={topbarIconButton} onClick={() => void handleSignOut()}>
              <LogOut className="size-4" />
            </Button>
            <Button title="Open profile settings" aria-label="Open profile settings" variant="outline" size="icon" className={topbarIconButton + " hidden rounded-full p-0 sm:inline-flex"} asChild data-cursor="Open">
              <Link
                to="/settings?section=profile"
                onKeyDown={(event) => {
                  if (event.key === " ") {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
              >
                <Avatar className="size-8">
                  <AvatarFallback>{profileInitials}</AvatarFallback>
                </Avatar>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Modal open={assistantOpen} title="AI assistant" description="Generate polished quote copy, pricing guidance, follow-ups, and product suggestions." onClose={() => setAssistantOpen(false)}>
        <AiAssistantPanel context={{ source: "topbar-assistant", page: location.pathname }} compact />
      </Modal>
    </>
  );
}
