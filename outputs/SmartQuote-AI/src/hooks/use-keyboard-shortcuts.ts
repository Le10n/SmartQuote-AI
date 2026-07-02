import { useEffect } from "react";

export function useKeyboardShortcut(key: string, handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      const parts = key.toLowerCase().split("+");
      const expectedKey = parts[parts.length - 1];
      const wantsMod = parts.includes("mod") || parts.includes("ctrl") || parts.includes("meta");
      const modPressed = event.ctrlKey || event.metaKey;
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (isTyping && !wantsMod) return;
      if (wantsMod && !modPressed) return;
      if (event.key.toLowerCase() !== expectedKey) return;

      event.preventDefault();
      handler();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, handler, key]);
}
