import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Href } from "@/config/links";

/**
 * Link that degrades honestly: with no destination (`href` null) it renders plain,
 * non-interactive text marked "coming soon" — not a dead `#` link.
 */
export function NavLink({
  href,
  className,
  soonBadge,
  onClick,
  children,
}: {
  href: Href | undefined;
  className?: string;
  /** Show a small "Soon" pill (menus); footer/inline links keep their text only. */
  soonBadge?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span aria-disabled="true" title="Coming soon" className={cn("cursor-default", className)}>
        {children}
        {soonBadge && (
          <span className="ml-1.5 rounded-full bg-line-soft px-1.5 py-px align-middle text-[10px] font-medium text-muted">Soon</span>
        )}
        {!soonBadge && <span className="sr-only"> (coming soon)</span>}
      </span>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
