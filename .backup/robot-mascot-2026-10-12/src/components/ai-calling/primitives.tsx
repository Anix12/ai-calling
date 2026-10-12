import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Visual building blocks for the white + lavender LeadsZone AI Calling page.
 * Every section composes these so lighting, surfaces and accents stay consistent.
 */

/** Primary CTA: violet gradient with a soft glow. Pass to <Button className>. */
export const ctaPrimary =
  "bg-gradient-to-r from-nova-600 to-nova-500 text-white shadow-nova-glow hover:brightness-110 hover:bg-transparent";
/** Secondary CTA: white pill with a hairline lavender border. */
export const ctaSecondary = "border border-nova-200 bg-white text-nova-ink shadow-nova hover:border-nova-300 hover:bg-nova-50";

/** Full-bleed section. `id` doubles as the scroll anchor and the future animation scene key. */
export function AiSection({
  id,
  tone = "white",
  className,
  containerClassName,
  children,
}: {
  id?: string;
  tone?: "white" | "lavender";
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-scene={id}
      className={cn(
        "relative isolate scroll-mt-16 overflow-x-clip py-20 sm:py-24 lg:py-28",
        tone === "lavender" ? "bg-gradient-to-b from-lavender via-[#faf8ff] to-white" : "bg-white",
        className,
      )}
    >
      <div className={cn("container-page", containerClassName)}>{children}</div>
    </section>
  );
}

/** Soft radial light behind a composition. Purely decorative. */
export function Glow({ className, color = "violet" }: { className?: string; color?: "violet" | "pink" | "lilac" }) {
  const rgb = { violet: "139 92 246", pink: "192 38 211", lilac: "196 181 253" }[color];
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute -z-10 rounded-full", className)}
      style={{ backgroundImage: `radial-gradient(closest-side, rgb(${rgb} / 0.18), transparent)` }}
    />
  );
}

/** Purple gradient emphasis inside headlines. */
export function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("bg-gradient-to-r from-nova-700 via-nova-600 to-nova-pink bg-clip-text text-transparent", className)}>
      {children}
    </span>
  );
}

/** Numbered section label, e.g. "02 · Instant AI Calling". */
export function AiEyebrow({ index, children, className }: { index?: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-nova-200 bg-white/80 py-1 pr-3.5 pl-1 text-[13px] font-semibold text-nova-700 shadow-[0_1px_2px_rgb(76_29_149/0.06)] backdrop-blur",
        !index && "pl-3",
        className,
      )}
    >
      {index ? (
        <span className="rounded-full bg-gradient-to-r from-nova-600 to-nova-500 px-2 py-0.5 text-[11.5px] font-semibold text-white">{index}</span>
      ) : (
        <span className="size-1.5 rounded-full bg-nova-600" />
      )}
      {children}
    </span>
  );
}

export function AiHeading({
  eyebrow,
  index,
  title,
  description,
  align = "left",
  size = "lg",
  className,
}: {
  eyebrow?: string;
  index?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  size?: "lg" | "xl";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5", align === "center" ? "items-center text-center" : "items-start", className)}>
      {eyebrow && <AiEyebrow index={index}>{eyebrow}</AiEyebrow>}
      <h2
        className={cn(
          "font-bold tracking-[-0.045em] text-balance text-nova-ink",
          size === "xl" ? "text-[2.5rem] sm:text-[3.4rem] lg:text-[3.9rem]" : "text-[2.25rem] sm:text-5xl lg:text-[3.35rem]",
          // After the size classes: tailwind-merge drops an earlier leading-* when a text size follows.
          "leading-[1.04]",
          align === "center" && "max-w-4xl",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("max-w-xl text-[17px] leading-relaxed text-pretty text-nova-body", align === "center" && "max-w-2xl")}>
          {description}
        </p>
      )}
    </div>
  );
}

/** Headline on the left, supporting copy on the right (stacks on small screens). */
export function HeadingRow({ heading, children, className }: { heading: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-12", className)}>
      {heading}
      <div className="max-w-xl text-[17px] leading-relaxed text-pretty text-nova-body lg:pb-2">{children}</div>
    </div>
  );
}

/** Frosted white glass surface used for every product interface on the page. */
export function Glass({
  className,
  children,
  strong,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border border-white backdrop-blur-xl",
        strong ? "bg-white/90 shadow-nova-lg" : "bg-white/70 shadow-nova",
        "ring-1 ring-nova-100",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Marks product mock-ups as illustrations. Every preview on this page carries one, so nothing
 * reads as a working control or as real customer data.
 */
export function PreviewTag({ children = "Illustrative preview", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-nova-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-nova-muted uppercase ring-1 ring-nova-100",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Static voice waveform. Deterministic heights so server and client render identically. */
const waveHeights = [30, 55, 80, 45, 95, 70, 40, 85, 60, 100, 50, 75, 35, 90, 65, 45, 80, 55, 30, 70, 95, 60, 40, 75, 50, 85, 35, 65];

export function Waveform({
  bars = 28,
  progress,
  className,
  barClassName,
}: {
  bars?: number;
  /** 0–1: bars before this point render bright, the rest dim (recording playback look). */
  progress?: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div aria-hidden className={cn("flex h-10 items-center gap-[3px] overflow-hidden", className)}>
      {Array.from({ length: bars }, (_, i) => {
        const played = progress === undefined || i / bars < progress;
        return (
          <span
            key={i}
            style={{ height: `${waveHeights[i % waveHeights.length]}%` }}
            className={cn("w-[3px] shrink-0 rounded-full", played ? "bg-gradient-to-t from-nova-600 to-nova-pink" : "bg-nova-200", barClassName)}
          />
        );
      })}
    </div>
  );
}

/**
 * Reserved stage for NOVA in a section. Later phases target `data-robot-slot` to move a
 * single robot instance between sections.
 */
export function RobotSlot({ name, className, children }: { name: string; className?: string; children?: React.ReactNode }) {
  return (
    <div data-robot-slot={name} className={cn("pointer-events-none relative", className)}>
      {children}
    </div>
  );
}

/** Glowing circular platform NOVA stands on. Purely decorative. */
export function Platform({ className, label }: { className?: string; label?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute -z-10", className)}>
      <div className="absolute inset-0 rounded-[100%] bg-[radial-gradient(closest-side,rgb(139_92_246/0.35),rgb(196_181_253/0.15)_60%,transparent)]" />
      <div className="absolute inset-x-[8%] top-[22%] bottom-[22%] rounded-[100%] border-2 border-nova-400/50 shadow-[0_0_30px_rgb(139_92_246/0.45),inset_0_0_24px_rgb(139_92_246/0.35)]" />
      <div className="absolute inset-x-[20%] top-[34%] bottom-[34%] rounded-[100%] bg-gradient-to-b from-white/90 to-nova-100/70 ring-1 ring-white" />
      {label && (
        <span className="absolute inset-x-0 bottom-[6%] text-center text-[11px] font-semibold tracking-wide text-nova-400">{label}</span>
      )}
    </div>
  );
}

/** Small status dot. */
export function LiveDot({ className, tone = "violet" }: { className?: string; tone?: "violet" | "emerald" | "amber" | "rose" | "slate" }) {
  const colors = {
    violet: "bg-nova-500 shadow-[0_0_8px_rgb(139_92_246/0.8)]",
    emerald: "bg-emerald-500 shadow-[0_0_8px_rgb(16_185_129/0.7)]",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    slate: "bg-slate-400",
  };
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", colors[tone], className)} />;
}

/** Solid violet icon tile (the page's signature icon treatment). */
export function GlowIcon({
  icon: Icon,
  className,
  tone = "solid",
}: {
  icon: LucideIcon;
  className?: string;
  tone?: "solid" | "soft" | "green";
}) {
  return (
    <span
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl",
        tone === "solid" && "bg-gradient-to-br from-nova-500 to-nova-700 text-white shadow-[0_8px_20px_-8px_rgb(124_58_237/0.8)]",
        tone === "soft" && "bg-nova-100 text-nova-700",
        tone === "green" && "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_8px_20px_-8px_rgb(16_185_129/0.7)]",
        className,
      )}
    >
      <Icon className="size-5" strokeWidth={2} />
    </span>
  );
}

/** Icon + title + one-line description in a soft white card (left-column feature lists). */
export function FeatureRow({ icon, title, body, className }: { icon: LucideIcon; title: string; body: string; className?: string }) {
  return (
    <li className={cn("flex items-center gap-4 rounded-2xl border border-white bg-white/75 px-4 py-3 shadow-nova ring-1 ring-nova-100/70 backdrop-blur", className)}>
      <GlowIcon icon={icon} tone="soft" className="size-10 rounded-xl" />
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-nova-ink">{title}</p>
        <p className="text-[13px] leading-snug text-nova-muted">{body}</p>
      </div>
    </li>
  );
}

/** Initials avatar (sample people are never shown as real photos). */
export function Avatar({ name, className, tone = 0 }: { name: string; className?: string; tone?: number }) {
  const tones = [
    "from-nova-200 to-nova-400 text-nova-900",
    "from-pink-100 to-fuchsia-300 text-fuchsia-900",
    "from-sky-100 to-indigo-300 text-indigo-900",
    "from-amber-100 to-orange-300 text-orange-900",
    "from-emerald-100 to-teal-300 text-teal-900",
  ];
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[13px] font-bold ring-2 ring-white",
        tones[tone % tones.length],
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** Coloured status pill used in queues and outcomes. */
export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: "violet" | "green" | "blue" | "rose" | "amber" | "slate";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    violet: "bg-nova-100 text-nova-700",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-sky-50 text-sky-700 ring-sky-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ring-1 ring-transparent", tones[tone], className)}>
      {children}
    </span>
  );
}
