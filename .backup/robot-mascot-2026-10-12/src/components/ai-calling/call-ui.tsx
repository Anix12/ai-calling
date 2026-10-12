import { Bot, Mic, MoreHorizontal, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Glass, PreviewTag, Waveform } from "./primitives";

/** Speech bubble: AI lines are violet-filled, lead lines are white. Optional translation underneath. */
export function ChatBubble({
  from,
  children,
  translation,
  lang,
  withIcon,
  highlight,
  className,
}: {
  from: "ai" | "lead";
  children: React.ReactNode;
  translation?: string;
  lang?: string;
  /** Show the small robot / lead marker beside the bubble. */
  withIcon?: string | true;
  /** Emphasise this line (e.g. the moment a lead says yes). */
  highlight?: boolean;
  className?: string;
}) {
  const ai = from === "ai";
  return (
    <div className={cn("flex items-end gap-2", ai ? "pr-6" : "flex-row-reverse pl-8", className)}>
      {withIcon &&
        (ai ? (
          <span aria-hidden className="mb-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-nova-100 text-nova-700">
            <Bot className="size-4" />
          </span>
        ) : (
          <Avatar name={typeof withIcon === "string" ? withIcon : "Lead"} className="mb-0.5 size-8 text-[11px]" tone={1} />
        ))}
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug",
          ai
            ? "rounded-bl-md bg-gradient-to-r from-nova-600 to-nova-500 text-white shadow-[0_8px_20px_-10px_rgb(124_58_237/0.8)]"
            : "rounded-br-md border border-nova-100 bg-white text-nova-ink shadow-nova",
          highlight && "ring-2 ring-emerald-300 ring-offset-1 transition-shadow duration-500",
        )}
      >
        <p lang={lang}>{children}</p>
        {translation && <p className={cn("mt-1 text-[11.5px] leading-snug", ai ? "text-white/80" : "text-nova-muted")}>{translation}</p>}
      </div>
    </div>
  );
}

/** Mic / hang-up / more — illustration only, never interactive. */
export function CallControls({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-5", className)}>
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-nova-50 text-nova-600 ring-1 ring-nova-100">
        <Mic className="size-4" />
      </span>
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-b from-rose-400 to-rose-600 text-white shadow-[0_10px_22px_-8px_rgb(225_29_72/0.7)]">
        <PhoneOff className="size-5" />
      </span>
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-nova-50 text-nova-600 ring-1 ring-nova-100">
        <MoreHorizontal className="size-4" />
      </span>
    </div>
  );
}

/** Glass phone showing a call in progress. */
export function PhoneMock({
  name,
  subtitle,
  timer,
  children,
  tag = "Illustrative preview",
  className,
}: {
  name: string;
  subtitle: string;
  timer: string;
  children: React.ReactNode;
  tag?: string;
  className?: string;
}) {
  return (
    <Glass strong className={cn("rounded-[2.25rem] p-4 sm:p-5", className)}>
      <div className="flex items-center gap-3">
        <Avatar name={name} tone={1} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-nova-ink">{name}</p>
          <p className="truncate text-[12px] text-nova-muted">{subtitle}</p>
        </div>
        <span className="font-mono text-[12.5px] font-semibold text-nova-ink tabular-nums">{timer}</span>
      </div>
      <Waveform bars={36} className="mt-4 h-10 justify-between" />
      <div className="mt-4 grid gap-2.5">{children}</div>
      <CallControls className="mt-5 border-t border-nova-100 pt-4" />
      <p className="mt-3 text-center">
        <PreviewTag>{tag}</PreviewTag>
      </p>
    </Glass>
  );
}
