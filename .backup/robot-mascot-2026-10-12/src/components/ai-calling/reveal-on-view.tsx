"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/browser-hooks";
import { cn } from "@/lib/utils";

/**
 * Lightweight entrance for static sections. Children opt in with `revealItem` (CSS transitions
 * on opacity/transform only); this wrapper just flips `data-shown` when it scrolls into view.
 *
 *  - Server render and no-JS: shown, so content is never hidden without a script.
 *  - If the section is off-screen at mount it is hidden quietly, then revealed on entry.
 *  - Leaving the viewport completely resets it, so the entrance plays once per visit.
 *  - Reduced motion: always shown, transitions disabled.
 */
export function RevealOnView({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.2) setShown(true);
        else if (!entry.isIntersecting) setShown(false);
      },
      { threshold: [0, 0.2] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={ref} data-shown={shown} className={cn("group/reveal", className)}>
      {children}
    </div>
  );
}
