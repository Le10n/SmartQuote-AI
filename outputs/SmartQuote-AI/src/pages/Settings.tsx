import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Bell, BriefcaseBusiness, Building2, FileText, Palette, ShieldCheck, Sparkles, Upload, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageShell } from "@/components/shared/PageShell";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAsync } from "@/hooks/use-async";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useWorkspacePreferences } from "@/hooks/use-workspace-preferences";
import { useToast } from "@/hooks/use-toast";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { demoStore } from "@/services/demo-store";
import { notificationsService, type DesktopNotificationPermission } from "@/services/notifications.service";
import { restartProductTour } from "@/services/product-tour.service";
import { settingsService } from "@/services/settings.service";
import { defaultWorkspacePreferences, workspacePreferencesKey, type WorkspacePreferences } from "@/services/workspace-preferences.service";
import { storageService } from "@/services/storage.service";


const settingsSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  vat: z.string().optional(),
  iban: z.string().optional(),
  address: z.string().optional(),
  default_tax: z.coerce.number().min(0).max(100),
  email_signature: z.string().min(2),
  brand_primary: z.string().min(4),
  brand_secondary: z.string().min(4),
  pdf_terms: z.string().min(10),
  ai_enabled: z.boolean(),
  ai_tone: z.string().min(2),
});

type SettingsForm = z.infer<typeof settingsSchema>;
type SettingsTab = "profile" | "company" | "quote" | "ai" | "notifications" | "appearance" | "demo";
type AutosaveStatus = "saving" | "saved" | "error";

const tabs: Array<{ id: SettingsTab; label: string; icon: typeof UserRound }> = [
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "company", label: "Company", icon: Building2 },
  { id: "quote", label: "Quote & PDF", icon: FileText },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "demo", label: "Demo", icon: BadgeCheck },
];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value === "profile" || value === "company" || value === "quote" || value === "ai" || value === "notifications" || value === "appearance" || value === "demo";
}

function permissionText(permission: DesktopNotificationPermission) {
  if (permission === "unsupported") return "Desktop notifications are not supported in this browser.";
  if (permission === "denied") return "Browser permission is denied. Enable notifications in browser settings to use desktop alerts.";
  if (permission === "granted") return "Desktop alerts are ready for quote and AI events.";
  return "Enable notifications to receive polished desktop alerts for important demo events.";
}

export function Settings() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const settings = useAsync(() => settingsService.get(), []);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [uploading, setUploading] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("saved");
  const [autosaveText, setAutosaveText] = useState("Autosaved");
  const [confirmDemoAction, setConfirmDemoAction] = useState<"reset" | "clear" | "preferences" | null>(null);
  const { preferences, setPreferences, updatePreference } = useWorkspacePreferences();
  const [notificationPermission, setNotificationPermission] = useState<DesktopNotificationPermission>(() => notificationsService.getPermission());
  const settingsReadyRef = useRef(false);
  const settingsAutosaveTimerRef = useRef<number | null>(null);
  const localAutosaveTimerRef = useRef<number | null>(null);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: "SmartQuote AI",
      vat: "",
      iban: "",
      address: "",
      default_tax: 20,
      email_signature: "Kind regards, SmartQuote AI",
      brand_primary: "#0f766e",
      brand_secondary: "#2563eb",
      pdf_terms: "Payment is due within 14 days unless otherwise agreed. This quote is valid for 30 days.",
      ai_enabled: true,
      ai_tone: "professional",
    },
  });

  useEffect(() => {
    const tab = searchParams.get("tab") ?? searchParams.get("section");
    if (isSettingsTab(tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (!settings.data) return;
    settingsReadyRef.current = false;
    form.reset({
      company_name: settings.data.company_name,
      vat: settings.data.vat ?? "",
      iban: settings.data.iban ?? "",
      address: settings.data.address ?? "",
      default_tax: settings.data.default_tax,
      email_signature: settings.data.email_signature,
      brand_primary: settings.data.brand_primary,
      brand_secondary: settings.data.brand_secondary,
      pdf_terms: settings.data.pdf_terms,
      ai_enabled: settings.data.ai_enabled,
      ai_tone: settings.data.ai_tone,
    });
    window.setTimeout(() => {
      settingsReadyRef.current = true;
      setAutosaveStatus("saved");
      setAutosaveText("Autosaved");
    }, 0);
  }, [form, settings.data, updatePreference]);

  useEffect(() => {
    return () => {
      if (settingsAutosaveTimerRef.current) window.clearTimeout(settingsAutosaveTimerRef.current);
      if (localAutosaveTimerRef.current) window.clearTimeout(localAutosaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!settings.data) return undefined;
    const subscription = form.watch((values, { name }) => {
      if (!name || !settingsReadyRef.current) return;
      if (settingsAutosaveTimerRef.current) window.clearTimeout(settingsAutosaveTimerRef.current);

      if (name === "brand_primary" && typeof values.brand_primary === "string") {
        updatePreference("pdfAccentColor", values.brand_primary);
      }

      const parsed = settingsSchema.safeParse(values);
      if (!parsed.success) {
        setAutosaveStatus("error");
        setAutosaveText("Complete required fields to autosave");
        return;
      }

      setAutosaveStatus("saving");
      setAutosaveText("Saving...");
      settingsAutosaveTimerRef.current = window.setTimeout(async () => {
        try {
          await settingsService.update({
            ...parsed.data,
            vat: parsed.data.vat || null,
            iban: parsed.data.iban || null,
            address: parsed.data.address || null,
          });
          setAutosaveStatus("saved");
          setAutosaveText("Autosaved");
        } catch (error) {
          setAutosaveStatus("error");
          setAutosaveText(getErrorMessage(error));
        }
      }, 650);
    });
    return () => subscription.unsubscribe();
  }, [form, settings.data, updatePreference]);

  useEffect(() => {
    notificationsService.setEnabled(preferences.desktopNotifications && notificationPermission === "granted");
  }, [notificationPermission, preferences.desktopNotifications]);

  function markLocalAutosaved() {
    if (localAutosaveTimerRef.current) window.clearTimeout(localAutosaveTimerRef.current);
    setAutosaveStatus("saving");
    setAutosaveText("Saving...");
    localAutosaveTimerRef.current = window.setTimeout(() => {
      setAutosaveStatus("saved");
      setAutosaveText("Autosaved");
    }, 180);
  }

  function savePreference<TKey extends keyof WorkspacePreferences>(key: TKey, value: WorkspacePreferences[TKey]) {
    updatePreference(key, value);
    markLocalAutosaved();
  }

  function updatePdfAccentColor(value: string) {
    form.setValue("brand_primary", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    savePreference("pdfAccentColor", value);
  }

  function updateAppAccentColor(value: string) {
    savePreference("accentColor", value);
  }

  function changeTheme(value: "light" | "dark" | "system") {
    setTheme(value);
    markLocalAutosaved();
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const path = await storageService.upload("company-assets", file, "logos");
      setAutosaveStatus("saving");
      setAutosaveText("Saving logo...");
      await settingsService.update({ logo_path: path });
      setAutosaveStatus("saved");
      setAutosaveText("Autosaved");
      toast.success("Logo uploaded", file.name);
      await settings.reload();
    } catch (error) {
      toast.error("Logo upload failed", getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function enableDesktopNotifications() {
    const permission = await notificationsService.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      savePreference("desktopNotifications", true);
      notificationsService.notify("SmartQuote AI", "Desktop notifications are enabled.");
      toast.success("Desktop notifications enabled", "Approval, PDF, and AI events can now trigger browser alerts.");
    } else if (permission === "denied") {
      savePreference("desktopNotifications", false);
      toast.warning("Notifications denied", "You can re-enable permission from browser settings.");
    } else {
      savePreference("desktopNotifications", false);
      toast.warning("Notifications unavailable", "This browser does not support desktop notifications.");
    }
  }

  function restartTourFromSettings() {
    if (!env.demoMode) {
      toast.warning("Demo mode only", "The product tour is designed for the demo workspace.");
      return;
    }

    restartProductTour();
    toast.success("Product tour restarted", "The guided tour is ready to walk through SmartQuote AI again.");
    navigate("/dashboard");
  }

  function resetDemoData() {
    if (!env.demoMode) {
      toast.warning("Demo mode only", "Demo data controls are disabled in production mode.");
      return;
    }

    demoStore.reset();
    setPreferences(defaultWorkspacePreferences);
    window.localStorage.removeItem("smartquote-builder-autosave");
    toast.success("Demo data reset", "Clients, products, quotes, activity and settings were restored.");
    setAutosaveStatus("saved");
    setAutosaveText("Demo defaults restored");
    void settings.reload();
  }

  function generateSampleData() {
    if (!env.demoMode) {
      toast.warning("Demo mode only", "Sample data generation is available in demo mode.");
      return;
    }

    demoStore.generateSampleData();
    toast.success("Sample data generated", "Fresh clients, products, quotes and activity are ready.");
    setAutosaveStatus("saved");
    setAutosaveText("Sample data ready");
    void settings.reload();
  }

  function clearDemoWorkspace() {
    if (!env.demoMode) {
      toast.warning("Demo mode only", "Workspace clearing is disabled in production mode.");
      return;
    }

    demoStore.clear();
    window.localStorage.removeItem("smartquote-builder-autosave");
    toast.warning("Demo workspace cleared", "Demo clients, products and quotes were removed.");
    setAutosaveStatus("saved");
    setAutosaveText("Workspace cleared");
    void settings.reload();
  }

  function clearSavedPreferences() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(workspacePreferencesKey);
    }
    setPreferences(defaultWorkspacePreferences);
    setAutosaveStatus("saved");
    setAutosaveText("Preferences restored");
    toast.success("Preferences restored", "Profile, quote, AI, notification, and appearance preferences are back to demo defaults.");
  }

  function runConfirmedDemoAction() {
    const action = confirmDemoAction;
    setConfirmDemoAction(null);
    if (action === "reset") resetDemoData();
    if (action === "clear") clearDemoWorkspace();
    if (action === "preferences") clearSavedPreferences();
  }

  const logoUrl = storageService.getPublicUrl("company-assets", settings.data?.logo_path ?? null);
  const aiEnabled = form.watch("ai_enabled");
  const initials = useMemo(() => {
    const source = preferences.profileName.trim() || user?.email || "SmartQuote";
    return source.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }, [preferences.profileName, user?.email]);

  return (
    <PageShell title="Settings" description="Profile, company, quote, AI, notification, appearance, and portfolio controls for SmartQuote AI.">
      {settings.loading ? <TableSkeleton rows={6} /> : null}
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit xl:sticky xl:top-24">
          <CardContent className="p-2">
            <nav className="grid gap-1" aria-label="Settings sections">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground", active && "bg-primary text-primary-foreground shadow-[0_12px_30px_var(--accent-ring)] hover:bg-primary hover:text-primary-foreground")}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {activeTab === "profile" ? (
            <Card>
              <CardHeader><CardTitle>My Profile</CardTitle><CardDescription>Demo account identity, avatar, and access signals.</CardDescription></CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="flex flex-col items-center rounded-lg border border-border bg-secondary/25 p-5 text-center">
                  <Avatar className="size-20"><AvatarFallback className="text-xl">{initials}</AvatarFallback></Avatar>
                  {env.demoMode ? <span className="mt-4 rounded-full border border-ring/20 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-accent-foreground">Demo account</span> : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2"><Label htmlFor="profileName">Name</Label><Input id="profileName" value={preferences.profileName} onChange={(event) => savePreference("profileName", event.target.value)} /></div>
                  <div className="grid gap-2"><Label htmlFor="profileEmail">Email</Label><Input id="profileEmail" value={user?.email ?? "demo@smartquote.ai"} readOnly /></div>
                  <div className="grid gap-2"><Label htmlFor="role">Role</Label><Input id="role" value={preferences.role} onChange={(event) => savePreference("role", event.target.value)} /></div>
                  <div className="rounded-lg border border-border bg-secondary/25 p-4"><div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4" />Password & security</div><p className="mt-2 text-sm leading-6 text-muted-foreground">Supabase authentication secures production accounts. Demo mode bypass is clearly isolated.</p></div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "company" ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <Card>
                <CardHeader><CardTitle>Company Profile</CardTitle><CardDescription>Printed on PDFs and used for email signatures.</CardDescription></CardHeader>
                <CardContent className="grid gap-5">
                  <div className="grid gap-2"><Label htmlFor="company_name">Company name</Label><Input id="company_name" {...form.register("company_name")} />{form.formState.errors.company_name ? <p className="text-sm text-destructive">{form.formState.errors.company_name.message}</p> : null}</div>
                  <div className="grid gap-2 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="companyEmail">Company email</Label><Input id="companyEmail" value={preferences.companyEmail} onChange={(event) => savePreference("companyEmail", event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="companyPhone">Phone</Label><Input id="companyPhone" value={preferences.companyPhone} onChange={(event) => savePreference("companyPhone", event.target.value)} /></div></div>
                  <div className="grid gap-2"><Label htmlFor="website">Website</Label><Input id="website" value={preferences.website} onChange={(event) => savePreference("website", event.target.value)} /></div>
                  <div className="grid gap-2"><Label htmlFor="address">Address</Label><Input id="address" {...form.register("address")} /></div>
                  <div className="grid gap-2 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="vat">VAT / Tax ID</Label><Input id="vat" {...form.register("vat")} /></div><div className="grid gap-2"><Label htmlFor="iban">IBAN</Label><Input id="iban" {...form.register("iban")} /></div></div>
                  <div className="grid gap-2"><Label htmlFor="email_signature">Email signature</Label><Textarea id="email_signature" {...form.register("email_signature")} /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Logo</CardTitle><CardDescription>Used in proposal PDFs.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 p-4">{logoUrl ? <img src={logoUrl} alt="Company logo" className="max-h-24 max-w-full object-contain" /> : <span className="text-sm text-muted-foreground">No logo uploaded</span>}</div>
                  <Button type="button" variant="outline" className="w-full" disabled={uploading} asChild><label><Upload className="size-4" />{uploading ? "Uploading..." : "Upload logo"}<input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadLogo(file); }} /></label></Button>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === "quote" ? (
            <Card>
              <CardHeader><CardTitle>Quote & PDF Settings</CardTitle><CardDescription>Defaults used by quote builder, export, and proposal documents.</CardDescription></CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-3"><div className="grid gap-2"><Label htmlFor="currency">Default currency</Label><Select id="currency" value={preferences.currency} onChange={(event) => savePreference("currency", event.target.value)}><option>USD</option><option>EUR</option><option>GBP</option></Select></div><div className="grid gap-2"><Label htmlFor="default_tax">Default tax %</Label><Input id="default_tax" type="number" step="0.01" {...form.register("default_tax", { valueAsNumber: true })} /></div><div className="grid gap-2"><Label htmlFor="defaultDiscount">Default discount %</Label><Input id="defaultDiscount" type="number" min="0" max="100" step="0.01" value={preferences.defaultDiscount} onChange={(event) => savePreference("defaultDiscount", Number(event.target.value))} /></div></div>
                <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="quoteNumberFormat">Quote number format</Label><Input id="quoteNumberFormat" value={preferences.quoteNumberFormat} onChange={(event) => savePreference("quoteNumberFormat", event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="quoteValidityDays">Quote validity days</Label><Input id="quoteValidityDays" type="number" min="1" step="1" value={preferences.quoteValidityDays} onChange={(event) => savePreference("quoteValidityDays", Number(event.target.value))} /></div></div>
                <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="brand_primary">PDF accent color</Label><Input id="brand_primary" type="color" className="h-10 p-1" value={form.watch("brand_primary")} onInput={(event) => updatePdfAccentColor(event.currentTarget.value)} onChange={(event) => updatePdfAccentColor(event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="brand_secondary">PDF secondary color</Label><Input id="brand_secondary" type="color" className="h-10 p-1" {...form.register("brand_secondary")} /></div></div>
                <div className="grid gap-2"><Label htmlFor="paymentTerms">Default payment terms</Label><Input id="paymentTerms" value={preferences.defaultPaymentTerms} onChange={(event) => savePreference("defaultPaymentTerms", event.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="defaultNotes">Default notes</Label><Textarea id="defaultNotes" value={preferences.defaultNotes} onChange={(event) => savePreference("defaultNotes", event.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="pdfFooter">PDF footer</Label><Input id="pdfFooter" value={preferences.pdfFooter} onChange={(event) => savePreference("pdfFooter", event.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="pdf_terms">Terms & conditions</Label><Textarea id="pdf_terms" className="min-h-36" {...form.register("pdf_terms")} />{form.formState.errors.pdf_terms ? <p className="text-sm text-destructive">{form.formState.errors.pdf_terms.message}</p> : null}</div>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "ai" ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
              <Card>
                <CardHeader><CardTitle>AI Settings</CardTitle><CardDescription>Tune assistant behavior for quote writing, product suggestions, and smart pricing.</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"><div><Label>AI suggestions</Label><p className="mt-1 text-sm text-muted-foreground">Enable quote copy, pricing, product, and email assistance.</p></div><Switch checked={aiEnabled} onCheckedChange={(checked) => form.setValue("ai_enabled", checked, { shouldDirty: true, shouldValidate: true })} /></div>
                  <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="ai_tone">AI tone</Label><Input id="ai_tone" {...form.register("ai_tone")} /></div><div className="grid gap-2"><Label htmlFor="aiLanguage">AI language</Label><Input id="aiLanguage" value={preferences.aiLanguage} onChange={(event) => savePreference("aiLanguage", event.target.value)} /></div></div>
                  <div className="grid gap-2"><Label htmlFor="aiStyle">Default assistant style</Label><Input id="aiStyle" value={preferences.aiStyle} onChange={(event) => savePreference("aiStyle", event.target.value)} /></div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"><div><Label>Smart pricing preferences</Label><p className="mt-1 text-sm text-muted-foreground">Let the assistant suggest margin-aware pricing and bundle opportunities.</p></div><Switch checked={preferences.smartPricing} onCheckedChange={(checked) => savePreference("smartPricing", checked)} /></div>
                </CardContent>
              </Card>
              <AiAssistantPanel context={{ settings: form.getValues(), preferences }} compact />
            </div>
          ) : null}

          {activeTab === "notifications" ? (
            <Card>
              <CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Control in-app and desktop alerts. Browser permission is requested only when you enable it.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border bg-secondary/25 p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">Desktop notifications</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{permissionText(notificationPermission)}</p></div><Button type="button" variant={preferences.desktopNotifications ? "outline" : "premium"} onClick={() => preferences.desktopNotifications ? savePreference("desktopNotifications", false) : void enableDesktopNotifications()}><Bell className="size-4" />{preferences.desktopNotifications ? "Disable" : "Enable"}</Button></div></div>
                {[{ key: "inAppNotifications", label: "In-app notifications", description: "Show polished toast feedback for important actions." }, { key: "quoteApprovedNotification", label: "Quote approved", description: "Notify when a quote is accepted or approved." }, { key: "quoteSentNotification", label: "Quote saved or sent", description: "Notify when drafts and approval-ready quotes are saved." }, { key: "followUpReminderNotification", label: "Follow-up reminders", description: "Demo reminders for quote follow-up timing." }].map((item) => <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"><div><Label>{item.label}</Label><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div><Switch checked={Boolean(preferences[item.key as keyof WorkspacePreferences])} onCheckedChange={(checked) => savePreference(item.key as keyof WorkspacePreferences, checked)} /></div>)}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "appearance" ? (
            <Card>
              <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Theme, accent, motion, and custom cursor controls.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><Label htmlFor="themeMode">Theme</Label><p className="mt-1 text-sm text-muted-foreground">Current theme: {theme} ({resolvedTheme})</p></div><Select id="themeMode" value={theme} onChange={(event) => changeTheme(event.target.value as "light" | "dark" | "system")} className="sm:w-44"><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></Select></div></div>
                <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="accentColor">Accent color</Label><Input id="accentColor" type="color" className="h-10 p-1" value={preferences.accentColor} onInput={(event) => updateAppAccentColor(event.currentTarget.value)} onChange={(event) => updateAppAccentColor(event.target.value)} /></div><div className="rounded-lg border border-border bg-secondary/25 p-4"><p className="text-sm font-medium">Preview</p><div className="mt-3 h-3 rounded-full bg-[image:var(--accent-gradient)]" /></div></div>
                {[{ key: "animations", label: "Animations", description: "Keep premium route, card, and modal motion enabled." }, { key: "customCursor", label: "Custom cursor", description: "Use elegant hover labels on desktop interactions." }].map((item) => <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"><div><Label>{item.label}</Label><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div><Switch checked={Boolean(preferences[item.key as keyof WorkspacePreferences])} onCheckedChange={(checked) => savePreference(item.key as keyof WorkspacePreferences, checked)} /></div>)}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "demo" ? (
            <Card className="overflow-hidden" data-tour="demo-workspace">
              <CardHeader><CardTitle>Demo / Portfolio</CardTitle><CardDescription>Subtle portfolio details, onboarding, and demo workspace controls.</CardDescription></CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-lg border border-border bg-secondary/25 p-5"><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><BadgeCheck className="size-4" /></div><div><p className="text-sm font-semibold">SmartQuote AI</p><p className="mt-1 text-sm text-muted-foreground">Portfolio Edition · Demo Version</p><p className="mt-3 text-xs leading-5 text-muted-foreground">For demonstration purposes only. Demo data stays in localStorage when demo mode is enabled.</p></div></div></div>
                <div className="rounded-lg border border-border bg-secondary/25 p-5"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Built by</p><p className="mt-2 text-lg font-semibold">Leon Sošić</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Designed as a premium AI SaaS portfolio piece with real CRUD flows, PDF generation, and demo-mode persistence.</p></div>
              <div className="rounded-lg border border-border bg-secondary/25 p-5 lg:col-span-2">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Demo controls</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">Restart onboarding or manage the local demo workspace. These actions only affect demo-mode localStorage.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={restartTourFromSettings}><Sparkles className="size-4" />Restart product tour</Button>
                      <Button type="button" variant="outline" onClick={() => setConfirmDemoAction("reset")}>Reset demo data</Button>
                      <Button type="button" variant="outline" onClick={generateSampleData}>Generate sample data</Button>
                      <Button type="button" variant="outline" onClick={() => setConfirmDemoAction("preferences")}>Clear saved preferences</Button>
                      <Button type="button" variant="destructive" onClick={() => setConfirmDemoAction("clear")}>Clear demo workspace</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><BriefcaseBusiness className="size-5 text-muted-foreground" /><div><p className="text-sm font-medium">Workspace settings</p><p className="text-xs text-muted-foreground">Changes save automatically as you edit.</p></div></div>
            <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium", autosaveStatus === "saving" && "border-ring/30 bg-[var(--accent-soft)] text-accent-foreground", autosaveStatus === "saved" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200", autosaveStatus === "error" && "border-destructive/30 bg-destructive/10 text-destructive")}>
              <span className={cn("size-2 rounded-full", autosaveStatus === "saving" && "animate-pulse bg-ring", autosaveStatus === "saved" && "bg-emerald-500", autosaveStatus === "error" && "bg-destructive")} />
              {autosaveText}
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(confirmDemoAction)}
        title={confirmDemoAction === "clear" ? "Clear demo workspace" : confirmDemoAction === "preferences" ? "Clear saved preferences" : "Reset demo data"}
        description={confirmDemoAction === "clear" ? "This removes local demo clients, products, quotes, and builder autosave data." : confirmDemoAction === "preferences" ? "This restores profile, currency, AI, notification, and appearance choices to demo defaults." : "This restores the demo workspace, settings, and preferences to their default sample state."}
        destructive={confirmDemoAction !== "preferences"}
        confirmLabel={confirmDemoAction === "preferences" ? "Clear preferences" : confirmDemoAction === "clear" ? "Clear workspace" : "Reset demo"}
        onClose={() => setConfirmDemoAction(null)}
        onConfirm={runConfirmedDemoAction}
      />
    </PageShell>
  );
}
