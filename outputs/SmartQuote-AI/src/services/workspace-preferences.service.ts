export interface WorkspacePreferences {
  profileName: string;
  role: string;
  website: string;
  companyPhone: string;
  companyEmail: string;
  currency: string;
  quoteNumberFormat: string;
  defaultPaymentTerms: string;
  defaultNotes: string;
  pdfFooter: string;
  aiLanguage: string;
  aiStyle: string;
  smartPricing: boolean;
  desktopNotifications: boolean;
  inAppNotifications: boolean;
  quoteApprovedNotification: boolean;
  quoteSentNotification: boolean;
  followUpReminderNotification: boolean;
  animations: boolean;
  customCursor: boolean;
}

export const workspacePreferencesKey = "smartquote-workspace-preferences-v1";
export const workspacePreferencesEvent = "smartquote:workspace-preferences-change";

export const defaultWorkspacePreferences: WorkspacePreferences = {
  profileName: "Demo User",
  role: "Founder / Revenue Lead",
  website: "https://smartquote-ai.demo",
  companyPhone: "+1 415 555 0198",
  companyEmail: "hello@smartquote-ai.demo",
  currency: "USD",
  quoteNumberFormat: "SQ-{YYYY}-{0000}",
  defaultPaymentTerms: "Payment due within 14 days",
  defaultNotes: "Thank you for the opportunity. This proposal is optimized for fast approval and measurable ROI.",
  pdfFooter: "SmartQuote AI Portfolio Edition · For demonstration purposes only",
  aiLanguage: "English",
  aiStyle: "Concise strategic advisor",
  smartPricing: true,
  desktopNotifications: false,
  inAppNotifications: true,
  quoteApprovedNotification: true,
  quoteSentNotification: true,
  followUpReminderNotification: true,
  animations: true,
  customCursor: true,
};

type StringPreferenceKey =
  | "profileName"
  | "role"
  | "website"
  | "companyPhone"
  | "companyEmail"
  | "currency"
  | "quoteNumberFormat"
  | "defaultPaymentTerms"
  | "defaultNotes"
  | "pdfFooter"
  | "aiLanguage"
  | "aiStyle";

type BooleanPreferenceKey = Exclude<keyof WorkspacePreferences, StringPreferenceKey>;

const stringPreferenceKeys: StringPreferenceKey[] = [
  "profileName",
  "role",
  "website",
  "companyPhone",
  "companyEmail",
  "currency",
  "quoteNumberFormat",
  "defaultPaymentTerms",
  "defaultNotes",
  "pdfFooter",
  "aiLanguage",
  "aiStyle",
];

const booleanPreferenceKeys: BooleanPreferenceKey[] = [
  "smartPricing",
  "desktopNotifications",
  "inAppNotifications",
  "quoteApprovedNotification",
  "quoteSentNotification",
  "followUpReminderNotification",
  "animations",
  "customCursor",
];

let cachedSerializedPreferences: string | null = null;
let cachedPreferences: WorkspacePreferences = defaultWorkspacePreferences;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeWorkspacePreferences(value: unknown): WorkspacePreferences {
  const next: WorkspacePreferences = { ...defaultWorkspacePreferences };
  if (!isRecord(value)) return next;

  for (const key of stringPreferenceKeys) {
    const preference = value[key];
    if (typeof preference === "string") {
      next[key] = preference;
    }
  }

  for (const key of booleanPreferenceKeys) {
    const preference = value[key];
    if (typeof preference === "boolean") {
      next[key] = preference;
    }
  }

  return next;
}

export function readWorkspacePreferences(): WorkspacePreferences {
  if (typeof window === "undefined") return defaultWorkspacePreferences;

  const serialized = window.localStorage.getItem(workspacePreferencesKey);
  if (serialized === cachedSerializedPreferences) return cachedPreferences;

  cachedSerializedPreferences = serialized;
  if (!serialized) {
    cachedPreferences = defaultWorkspacePreferences;
    return cachedPreferences;
  }

  try {
    cachedPreferences = normalizeWorkspacePreferences(JSON.parse(serialized));
    const normalizedSerialized = JSON.stringify(cachedPreferences);
    if (normalizedSerialized !== serialized) {
      cachedSerializedPreferences = normalizedSerialized;
      window.localStorage.setItem(workspacePreferencesKey, normalizedSerialized);
    }
  } catch {
    cachedPreferences = defaultWorkspacePreferences;
  }

  return cachedPreferences;
}

export function setWorkspacePreferences(
  nextPreferences:
    | WorkspacePreferences
    | ((currentPreferences: WorkspacePreferences) => WorkspacePreferences)
): WorkspacePreferences {
  const currentPreferences = readWorkspacePreferences();
  const normalizedPreferences = normalizeWorkspacePreferences(
    typeof nextPreferences === "function" ? nextPreferences(currentPreferences) : nextPreferences
  );
  const serialized = JSON.stringify(normalizedPreferences);
  cachedSerializedPreferences = serialized;
  cachedPreferences = normalizedPreferences;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(workspacePreferencesKey, serialized);
    window.dispatchEvent(new CustomEvent<WorkspacePreferences>(workspacePreferencesEvent, { detail: normalizedPreferences }));
  }

  return normalizedPreferences;
}

export function updateWorkspacePreference<TKey extends keyof WorkspacePreferences>(
  key: TKey,
  value: WorkspacePreferences[TKey]
): WorkspacePreferences {
  return setWorkspacePreferences((currentPreferences) => ({ ...currentPreferences, [key]: value }));
}

export function subscribeWorkspacePreferences(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  function handlePreferenceChange() {
    listener();
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === workspacePreferencesKey) {
      cachedSerializedPreferences = null;
      listener();
    }
  }

  window.addEventListener(workspacePreferencesEvent, handlePreferenceChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(workspacePreferencesEvent, handlePreferenceChange);
    window.removeEventListener("storage", handleStorage);
  };
}
