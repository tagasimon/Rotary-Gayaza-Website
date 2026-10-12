"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Instance = { destroy: () => void };
declare global { interface Window { ScrollCraft?: { mount: (root?: Element | Document | string) => Instance } } }

/**
 * Mounts the vendored scrollcraft engine on the current page and tears it down on navigation
 * (the engine supports destroy() for client-side routers). The engine only reads data-sc-* markup.
 */
export function ScrollCraftMount() {
  const path = usePathname();
  useEffect(() => {
    let inst: Instance | undefined;
    let cancelled = false;
    (async () => {
      await import("@/vendor/scrollcraft/scrollcraft.js");
      if (document.fonts?.ready) await document.fonts.ready; // kinetic lines measure real line boxes
      if (!cancelled && window.ScrollCraft) inst = window.ScrollCraft.mount(document);
    })();
    return () => { cancelled = true; inst?.destroy(); };
  }, [path]);
  return null;
}
