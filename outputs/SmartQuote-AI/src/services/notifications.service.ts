const NOTIFICATIONS_ENABLED_KEY = "smartquote-desktop-notifications-enabled";

export type DesktopNotificationPermission = "default" | "granted" | "denied" | "unsupported";

function supported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export const notificationsService = {
  getPermission(): DesktopNotificationPermission {
    if (!supported()) return "unsupported";
    return Notification.permission;
  },
  isEnabled() {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === "true";
  },
  setEnabled(enabled: boolean) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
  },
  async requestPermission() {
    if (!supported()) return "unsupported" as const;
    const permission = await Notification.requestPermission();
    if (permission === "granted") this.setEnabled(true);
    if (permission === "denied") this.setEnabled(false);
    return permission;
  },
  notify(title: string, body: string) {
    if (!supported() || !this.isEnabled() || Notification.permission !== "granted") return false;
    new Notification(title, {
      body,
      icon: "/vite.svg",
      silent: true,
    });
    return true;
  },
};
