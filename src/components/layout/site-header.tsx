"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { externalLinks } from "@/config/links";
import { aiCallingRoutes, sectionNav } from "@/data/ai-calling";
import { ctaPrimary, ctaSecondary } from "@/components/ai-calling/primitives";


function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      // Keep Tab focus inside the open dialog.
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>("a[href], button");
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-nova-ink/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div ref={panelRef} className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-nova-lg">
        <div className="flex h-16 items-center justify-between border-b border-nova-100 px-5">
          <Logo />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex size-10 items-center justify-center rounded-lg text-nova-body hover:bg-nova-50"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Sections">
          {sectionNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block rounded-lg border-b border-nova-50 px-3 py-3.5 text-[15px] font-medium text-nova-ink last:border-0 hover:bg-nova-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="grid gap-2.5 border-t border-nova-100 p-5">
          <Button href={aiCallingRoutes.experience} onClick={onClose} className={ctaPrimary}>
            Experience AI Calling
          </Button>
          <Button href={aiCallingRoutes.bookDemo} variant="secondary" onClick={onClose} className={ctaSecondary}>
            Book a Demo
          </Button>
          {externalLinks.login && (
            <Button href={externalLinks.login} variant="ghost" onClick={onClose}>
              Log in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl transition-[border-color,box-shadow]",
          scrolled ? "border-nova-100 shadow-[0_8px_30px_-20px_rgb(76_29_149/0.35)]" : "border-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <span className="flex items-center gap-2.5">
            <Logo />
            <span className="hidden rounded-full border border-nova-200 bg-nova-50 px-2.5 py-0.5 text-[12px] font-semibold text-nova-700 sm:inline">
              AI Calling
            </span>
          </span>
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Sections">
            {sectionNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-9 items-center rounded-lg px-3 text-[14px] font-medium text-nova-body transition-colors hover:text-nova-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {/* No login page yet → hidden until NEXT_PUBLIC_LOGIN_URL is configured. */}
            {externalLinks.login && (
              <Link href={externalLinks.login} className="hidden px-2 text-[14px] font-medium text-nova-body hover:text-nova-700 xl:inline">
                Log in
              </Link>
            )}
            <Button href={aiCallingRoutes.bookDemo} variant="secondary" size="sm" className={cn("hidden sm:inline-flex", ctaSecondary)}>
              Book a Demo
            </Button>
            <Button href={aiCallingRoutes.experience} size="sm" className={cn("hidden sm:inline-flex", ctaPrimary)}>
              Experience AI Calling <ArrowRight />
            </Button>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              className="inline-flex size-10 items-center justify-center rounded-lg text-nova-ink hover:bg-nova-50 xl:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>
      {/* Rendered outside <header>: its backdrop-filter would otherwise trap position:fixed */}
      <MobileDrawer open={mobileOpen} onClose={closeMobile} />
    </>
  );
}
