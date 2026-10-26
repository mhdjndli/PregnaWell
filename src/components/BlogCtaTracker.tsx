"use client";

import { useEffect } from "react";

// Logs clicks from a blog post into the funnel (pregnawell.clinic links) to
// /api/track/cta. Listens on the document so it catches both the end-of-post
// CTA box and links inside the article body; the nearest
// [data-cta-placement] ancestor says which one it was.

const FUNNEL_HOST = "pregnawell.clinic";
const VISITOR_KEY = "pw_vid";

function visitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export default function BlogCtaTracker({ postId }: { postId: string }) {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Left click and middle click (open in new tab) both count.
      if (e.type === "auxclick" && e.button !== 1) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const scope = a.closest<HTMLElement>("[data-cta-placement]");
      if (!scope) return;
      const host = a.hostname;
      if (host !== FUNNEL_HOST && !host.endsWith(`.${FUNNEL_HOST}`)) return;

      const payload = JSON.stringify({
        postId,
        href: a.href,
        placement: scope.dataset.ctaPlacement,
        visitorId: visitorId(),
      });
      // sendBeacon survives the page unloading; fall back to keepalive fetch.
      const sent =
        typeof navigator.sendBeacon === "function" &&
        navigator.sendBeacon("/api/track/cta", new Blob([payload], { type: "application/json" }));
      if (!sent) {
        fetch("/api/track/cta", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, [postId]);

  return null;
}
