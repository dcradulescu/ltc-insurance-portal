import { useEffect, useRef } from "react";

/**
 * useScrollReveal — attaches an IntersectionObserver to a container element.
 * When the element enters the viewport, it adds the "visible" class, which
 * triggers the `.reveal` CSS animation defined in index.css.
 *
 * Usage:
 *   const ref = useScrollReveal();
 *   <div ref={ref} className="reveal">...</div>
 *
 * For staggered children, add `stagger-children` class alongside `reveal`:
 *   <div ref={ref} className="reveal stagger-children">
 *     <div>child 1</div>
 *     <div>child 2</div>
 *   </div>
 */
export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

/**
 * useScrollRevealAll — observes multiple elements at once.
 * Pass a CSS selector string; all matching descendants will be observed.
 *
 * Usage:
 *   const containerRef = useScrollRevealAll(".reveal-item");
 *   <section ref={containerRef}>
 *     <div className="reveal-item">...</div>
 *   </section>
 */
export function useScrollRevealAll(selector: string, threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const elements = container.querySelectorAll<HTMLElement>(selector);
    const observers: IntersectionObserver[] = [];

    elements.forEach((el) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add("visible");
            observer.disconnect();
          }
        },
        { threshold }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [selector, threshold]);

  return ref;
}
