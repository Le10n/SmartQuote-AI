import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { aiService } from "@/services/ai.service";
import { notificationsService } from "@/services/notifications.service";
import type { AiAction } from "@/types";

const actions: Array<{ value: AiAction; label: string }> = [
  { value: "quote_description", label: "Quote description" },
  { value: "rewrite_description", label: "Rewrite professionally" },
  { value: "pricing_suggestion", label: "Suggest pricing" },
  { value: "summarize_client_notes", label: "Summarize notes" },
  { value: "follow_up_email", label: "Follow-up email" },
  { value: "reminder_email", label: "Reminder email" },
  { value: "suggest_products", label: "Suggest products" },
  { value: "marketing_text", label: "Marketing text" },
];

const baseQuickPrompts: Array<{ label: string; action: AiAction; prompt: string }> = [
  { label: "Improve proposal tone", action: "rewrite_description", prompt: "Rewrite this proposal in a polished, confident, executive-friendly tone." },
  { label: "Suggest better pricing", action: "pricing_suggestion", prompt: "Review the quote context and suggest a premium but realistic pricing strategy." },
  { label: "Create follow-up", action: "follow_up_email", prompt: "Generate a concise follow-up email that encourages approval without sounding pushy." },
  { label: "Suggest products", action: "suggest_products", prompt: "Suggest complementary products or services that fit this client and quote context." },
];

interface AiAssistantPanelProps {
  context?: Record<string, unknown>;
  compact?: boolean;
}

function promptsForContext(context?: Record<string, unknown>) {
  const page = String(context?.page ?? "");
  if (page.includes("clients")) {
    return [
      { label: "Summarize client notes", action: "summarize_client_notes" as const, prompt: "Summarize this client context into concise buying signals and next steps." },
      { label: "Draft follow-up", action: "follow_up_email" as const, prompt: "Create a warm, concise follow-up email for this client." },
      ...baseQuickPrompts,
    ];
  }
  if (page.includes("products")) {
    return [
      { label: "Generate product copy", action: "marketing_text" as const, prompt: "Create polished product marketing copy with clear business value." },
      { label: "Suggest pricing", action: "pricing_suggestion" as const, prompt: "Suggest a premium pricing position for this product." },
      ...baseQuickPrompts,
    ];
  }
  if (page.includes("settings")) {
    return [
      { label: "Improve email signature", action: "rewrite_description" as const, prompt: "Rewrite the email signature and PDF terms in a polished SaaS tone." },
      { label: "PDF summary", action: "quote_description" as const, prompt: "Generate a concise PDF proposal summary style for this workspace." },
      ...baseQuickPrompts.slice(0, 2),
    ];
  }
  return baseQuickPrompts;
}

export function AiAssistantPanel({ context, compact }: AiAssistantPanelProps) {
  const toast = useToast();
  const quickPrompts = promptsForContext(context).slice(0, 5);
  const [action, setAction] = useState<AiAction>("quote_description");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(nextAction = action, promptOverride?: string) {
    const prompt = (promptOverride ?? input).trim() || (env.demoMode ? "Use the current demo workspace context to produce a polished response." : "");
    if (!prompt) {
      toast.warning("AI input required", "Add context before running the assistant.");
      return;
    }
    setAction(nextAction);
    setLoading(true);
    try {
      setOutput(await aiService.run(nextAction, prompt, context));
      toast.success("AI response ready", "SmartQuote AI drafted a polished answer.");
      notificationsService.notify("SmartQuote AI", "Your AI draft is ready for review.");
    } catch (error) {
      toast.error("AI request failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function applyPrompt(prompt: string, nextAction: AiAction) {
    setInput(prompt);
    setAction(nextAction);
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border/80 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--accent)_22%,transparent),var(--card)_58%)] p-4 shadow-sm", compact && "p-3")}>
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--ring),transparent)] opacity-70" />
      <div className="absolute -right-12 -top-14 size-40 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ring)_22%,transparent),transparent_68%)]" />
      <div className="relative flex items-center gap-3">
        <div className="ai-orbit-glow flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"><Bot className="size-4" /></div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">SmartQuote AI</h3>
          <p className="text-xs text-muted-foreground">Context-aware writing, pricing, and follow-up support.</p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            className="rounded-full border border-border/80 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-ring/40 hover:bg-background hover:text-foreground"
            onClick={() => applyPrompt(prompt.prompt, prompt.action)}
            data-cursor="AI"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      <div className="relative mt-4 grid gap-3">
        <Select value={action} onChange={(event) => setAction(event.target.value as AiAction)} aria-label="AI action">
          {actions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
        <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={env.demoMode ? "Optional in demo mode. Try: emphasize ROI and fast approval." : "Paste client notes, product context, or quote details"} className="min-h-28" data-cursor="Edit" />
        <Button type="button" variant="premium" onClick={() => void run()} disabled={loading} data-cursor="Generate">
          {loading ? <><span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Generating...</> : <><Wand2 className="size-4" />Generate with AI</>}
        </Button>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="typing" className="rounded-lg border border-border/80 bg-background/58 p-4 shadow-sm backdrop-blur" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-accent-foreground" /> SmartQuote AI is thinking</div>
              <div className="space-y-2">
                <div className="h-3 w-11/12 rounded-full bg-secondary command-shimmer" />
                <div className="h-3 w-9/12 rounded-full bg-secondary command-shimmer" />
                <div className="h-3 w-7/12 rounded-full bg-secondary command-shimmer" />
              </div>
            </motion.div>
          ) : output ? (
            <motion.div key="output" className="rounded-lg border border-border/80 bg-background/70 p-4 shadow-sm backdrop-blur" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-accent-foreground" /> AI draft</div>
                <Button type="button" variant="ghost" size="sm" onClick={() => void run(action, output)}><Send className="size-4" />Refine</Button>
              </div>
              <Textarea value={output} onChange={(event) => setOutput(event.target.value)} className="min-h-44 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
