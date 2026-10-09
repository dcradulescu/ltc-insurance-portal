import { useLayoutEffect } from "react";
import { useLocation } from "wouter";

/** One scroll owner for route changes, deep links, and browser back/forward. */
export function RouteScroll() {
  const [location] = useLocation();
  useLayoutEffect(() => {
    let frame = 0;
    const scroll = () => {
      cancelAnimationFrame(frame);
      if (!window.location.hash) {
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      let attempts = 0;
      const findTarget = () => {
        const target = document.getElementById(id);
        if (target) {
          const offset = document.querySelector('header')?.getBoundingClientRect().height ?? 70;
          window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset - 12), behavior: "instant" });
        } else if (++attempts < 20) frame = requestAnimationFrame(findTarget);
      };
      frame = requestAnimationFrame(findTarget);
    };
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    scroll();
    // Wouter emits pushState/replaceState for same-path fragment navigation.
    const events = ["hashchange", "popstate", "pushState", "replaceState"];
    events.forEach(event => window.addEventListener(event, scroll));
    return () => {
      cancelAnimationFrame(frame);
      events.forEach(event => window.removeEventListener(event, scroll));
      history.scrollRestoration = previous;
    };
  }, [location]);
  return null;
}
