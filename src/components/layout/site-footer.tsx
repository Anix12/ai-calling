import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { NavLink } from "@/components/ui/nav-link";
import { externalLinks, type Href } from "@/config/links";
import { aiCallingRoutes, sectionNav } from "@/data/ai-calling";

const company: { label: string; href: Href }[] = [
  { label: "LeadsZone", href: externalLinks.mainSite },
  { label: "Contact", href: externalLinks.contact },
  { label: "Book a Demo", href: aiCallingRoutes.bookDemo },
];

const legal: { label: string; href: Href }[] = [
  { label: "Privacy Policy", href: externalLinks.privacy },
  { label: "Terms of Service", href: externalLinks.terms },
  { label: "Cookie Policy", href: externalLinks.cookies },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-nova-100 bg-lavender">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[14.5px] leading-relaxed text-nova-muted">
              Voice AI that calls new leads, qualifies interest in their language, and hands the ready ones to your team.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[13px] font-semibold text-nova-ink">AI Calling</p>
              <ul className="mt-3 grid gap-0.5">
                {sectionNav.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-block py-1 text-[14px] text-nova-muted transition-colors hover:text-nova-700">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-nova-ink">Company</p>
              <ul className="mt-3 grid gap-0.5">
                {company.map((l) => (
                  <li key={l.label}>
                    <NavLink href={l.href} className={cn("inline-block py-1 text-[14px] text-nova-muted transition-colors", l.href && "hover:text-nova-700")}>
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-nova-100 pt-6 text-[13px] text-nova-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LeadsZone. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-0.5">
            {legal.map((l) => (
              <li key={l.label}>
                <NavLink href={l.href} className={cn("inline-block py-1", l.href && "hover:text-nova-700")}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-[12px] leading-relaxed text-nova-muted">
          Product screens and call simulations on this page show illustrative sample data, not real calls or customer results.
        </p>
      </div>
    </footer>
  );
}
