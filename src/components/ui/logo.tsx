import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent-400 to-accent-700 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(16_24_40/0.2)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[18px] text-white" aria-hidden>
        <path
          d="M3 12.5h3.5l2-5 3.5 10 2.5-7 1.5 2H21"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="LeadsZone home" className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-[19px] font-semibold tracking-tight", dark ? "text-white" : "text-ink")}>
        LeadsZone
      </span>
    </Link>
  );
}
