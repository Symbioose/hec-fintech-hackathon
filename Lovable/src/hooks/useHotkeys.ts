import { useEffect } from "react";

type Handler = (e: KeyboardEvent) => void;

interface Options {
  /** When true, ignore keypresses originating from input/textarea/contenteditable. */
  ignoreInInputs?: boolean;
  /** Disable the hook entirely. */
  enabled?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/** Minimal global hotkey hook. Map of "k" or "Mod+k" → handler. */
export function useHotkeys(map: Record<string, Handler>, options: Options = {}) {
  const { ignoreInInputs = true, enabled = true } = options;
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      if (ignoreInInputs && isEditableTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const combo = mod ? `Mod+${key}` : key;
      const handler = map[combo] ?? map[key];
      if (handler) {
        handler(e);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [map, ignoreInInputs, enabled]);
}
