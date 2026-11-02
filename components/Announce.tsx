"use client";

import { useEffect } from "react";

export const ANNOUNCER_ID = "a11y-announcer";

/**
 * Sends a message to the page-wide polite live region in the root layout.
 *
 * Live regions that are inserted into the DOM already containing text (like
 * streamed server-component results) are often not announced. Writing into a
 * region that has been present since page load is announced reliably.
 */
export function Announce({ message }: { message: string }) {
  useEffect(() => {
    const region = document.getElementById(ANNOUNCER_ID);
    if (!region) return;
    // Clear first so an identical message (same search twice) is announced again.
    region.textContent = "";
    const t = setTimeout(() => {
      region.textContent = message;
    }, 50);
    return () => clearTimeout(t);
  }, [message]);
  return null;
}
