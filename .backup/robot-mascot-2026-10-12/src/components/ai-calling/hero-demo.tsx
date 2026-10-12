"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, MotionConfig, motion, useMotionValueEvent } from "motion/react";
import { Database, Globe, Mic, MoreHorizontal, Pause, PhoneOff, Play, RotateCcw, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { heroDemo } from "@/data/ai-calling";
import { Glass, Platform, PreviewTag, RobotSlot } from "./primitives";
import { RobotMascot, WHEEL_RADIUS, type RobotExpression } from "./robot-mascot";
import {
  barNoise,
  callLevel,
  callSeconds,
  reached,
  robotPose,
  useHeroTimeline,
  type HeroPhase,
} from "./hero-timeline";

const EASE = [0.22, 1, 0.36, 1] as const;
const enter = { duration: 0.45, ease: EASE };
const WAVE_BARS = 34;
const waveBase = Array.from({ length: WAVE_BARS }, (_, i) => 0.45 + 0.55 * Math.abs(Math.sin(i * 1.37) * Math.cos(i * 0.41)));

const expressionFor: Partial<Record<HeroPhase, RobotExpression>> = {
  wave: "happy",
  connecting: "focused",
  connected: "focused",
  qualified: "happy",
  crm: "happy",
};

const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const r2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Controller                                                          */
/* ------------------------------------------------------------------ */

export function HeroLiveDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const { time, phase, reduced, userPaused, replay, togglePause } = useHeroTimeline(rootRef);

  // Off-screen start distance and SVG scale, measured from the robot's laid-out box.
  const metrics = useRef({ startX: -320, scale: 1.5, x: 0 });

  /** Writes one frame of the timeline straight to the DOM (no React render per frame). */
  const apply = useCallback((t: number) => {
    const el = robotRef.current;
    if (el) {
      const pose = robotPose(t);
      const m = metrics.current;
      const x = m.startX * (1 - pose.roll);
      m.x = x;
      el.style.transform = `translate3d(${r2(x)}px, ${r2(pose.hop)}px, 0)`;
      el.style.opacity = String(r2(pose.opacity));

      const part = (name: string) => el.querySelector<SVGGElement>(`[data-part="${name}"]`);
      const wheelDeg = r2(((x - m.startX) / m.scale / WHEEL_RADIUS) * (180 / Math.PI));
      part("wheel-left")?.setAttribute("transform", `rotate(${wheelDeg} 66 204)`);
      part("wheel-right")?.setAttribute("transform", `rotate(${wheelDeg} 134 204)`);

      const upper = `rotate(${r2(pose.lean)} 100 204) translate(0 ${r2(pose.bodyY)})`;
      part("body")?.setAttribute("transform", upper);
      part("arm-left")?.setAttribute("transform", `${upper} rotate(${r2(pose.armLeft)} 54 138)`);
      part("arm-right")?.setAttribute("transform", `${upper} rotate(${r2(pose.armRight)} 146 138)`);
      part("head")?.setAttribute(
        "transform",
        `rotate(${r2(pose.lean)} 100 204) translate(0 ${r2(pose.bodyY * 1.25)}) rotate(${r2(pose.headTilt)} 100 116)`,
      );
      part("antenna")?.setAttribute("transform", `rotate(${r2(pose.antenna)} 100 30)`);
      part("eyes")?.setAttribute("transform", `translate(${r2(pose.lookX)} ${r2(pose.lookY)}) translate(0 68) scale(1 ${r2(pose.blink)}) translate(0 -68)`);
      part("eye-glow")?.setAttribute("opacity", String(r2(Math.min(0.9, pose.eyeGlow))));
      part("mouth")
        ?.querySelectorAll("rect")
        .forEach((bar, i) => {
          const k = pose.talk ? 0.3 + 0.9 * barNoise(i, t * 1.4) : 0.3;
          bar.setAttribute("transform", `translate(0 89) scale(1 ${r2(k)}) translate(0 -89)`);
        });
    }

    const level = callLevel(t);
    waveRef.current?.childNodes.forEach((bar, i) => {
      const k = 0.1 + 0.9 * level * waveBase[i] * (0.35 + 0.65 * barNoise(i, t));
      (bar as HTMLElement).style.transform = `scaleY(${r2(k)})`;
    });
    if (timerRef.current) timerRef.current.textContent = fmt(callSeconds(t));
  }, []);

  useMotionValueEvent(time, "change", apply);

  useEffect(() => {
    const measure = () => {
      const el = robotRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      const left = el.getBoundingClientRect().left - metrics.current.x;
      // Phones: start fully off-screen. Wider layouts: a short roll that fades in, so the robot
      // never sweeps across the headline copy beside it.
      metrics.current.startX = -Math.min(left + w + 24, window.innerWidth < 640 ? 400 : 150);
      metrics.current.scale = w / 200;
      apply(time.get());
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [apply, time]);

  // Expression and talking state change with the scene, so they re-render the robot via props.
  const expression: RobotExpression = expressionFor[phase] ?? "neutral";
  const talking = phase === "ai1" || phase === "ai2";

  return (
    <MotionConfig reducedMotion="user">
      <div ref={rootRef} data-hero-phase={phase} className="relative mx-auto w-full max-w-[380px] lg:max-w-[700px]">
        {/* Below lg: a deliberate stack. lg+: the reference composition on a fixed 700 × 620 stage. */}
        <div aria-hidden className="flex flex-col items-center gap-5 lg:block lg:h-[620px]">
          <div className="h-[62px] w-full lg:absolute lg:top-8 lg:left-0 lg:h-auto lg:w-[255px]">
            <LeadNotification phase={phase} />
          </div>

          <div className="relative w-[210px] lg:absolute lg:top-[150px] lg:left-0 lg:w-[240px]">
            <Platform className="-bottom-[34px] left-1/2 h-[96px] w-[280px] -translate-x-1/2 lg:-bottom-[44px] lg:h-[116px] lg:w-[340px]" />
            <RobotSlot name="hero">
              {/* Hidden until the timeline places it, so it never flashes in its resting spot. */}
              <div ref={robotRef} style={{ opacity: 0 }} className="will-change-transform">
                <RobotMascot expression={expression} talking={talking} glow={false} />
              </div>
            </RobotSlot>
          </div>

          <div className="mt-8 w-full lg:absolute lg:top-0 lg:left-[250px] lg:mt-0 lg:w-[276px]">
            <CallPanel phase={phase} waveRef={waveRef} timerRef={timerRef} />
          </div>

          <div className="grid h-[140px] w-full content-start gap-3 lg:absolute lg:top-[290px] lg:right-0 lg:h-auto lg:w-[166px]">
            <OutcomeCards phase={phase} />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 lg:absolute lg:bottom-0 lg:left-[250px] lg:mt-0 lg:w-[276px]">
          {!reduced && (
            <>
              <button
                type="button"
                onClick={togglePause}
                aria-label={userPaused ? "Play call simulation" : "Pause call simulation"}
                className="inline-flex size-9 items-center justify-center rounded-full border border-nova-200 bg-white text-nova-700 shadow-nova transition-colors hover:border-nova-300 hover:bg-nova-50"
              >
                {userPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
              <button
                type="button"
                onClick={replay}
                aria-label="Replay call simulation"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-nova-200 bg-white px-3.5 text-[13px] font-semibold text-nova-700 shadow-nova transition-colors hover:border-nova-300 hover:bg-nova-50"
              >
                <RotateCcw className="size-3.5" /> Replay
              </button>
            </>
          )}
        </div>

        <div className="sr-only">
          <p>
            Illustrative simulation of an AI call: a new website enquiry arrives, the AI agent calls the lead, qualifies them
            and updates the CRM.
          </p>
          <ul>
            {heroDemo.transcript.map((line, i) => (
              <li key={i}>
                {line.from === "ai" ? "AI agent" : leadFirstName}: {line.text}
              </li>
            ))}
          </ul>
          <p>
            Result: {heroDemo.qualified.join(", ")}. {heroDemo.crm.title} — {heroDemo.crm.detail}.
          </p>
        </div>
      </div>
    </MotionConfig>
  );
}

/* ------------------------------------------------------------------ */
/* Lead notification                                                   */
/* ------------------------------------------------------------------ */

function LeadNotification({ phase }: { phase: HeroPhase }) {
  const calling = reached(phase, "connecting");
  return (
    <AnimatePresence>
      {reached(phase, "notify") && (
        <motion.div
          key="lead"
          initial={{ opacity: 0, y: -14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
        >
          <Glass strong className="flex items-center gap-3 rounded-2xl px-3.5 py-3 lg:-rotate-3">
            <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500 to-nova-700 text-white shadow-[0_8px_18px_-6px_rgb(124_58_237/0.7)]">
              <Globe className="size-5" />
              {!calling && <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 ring-2 ring-white" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] leading-tight font-bold text-nova-ink">{heroDemo.notification.title}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={calling ? "calling" : "new"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className={cn("block truncate text-[12px] font-medium", calling ? "text-emerald-600" : "text-nova-muted")}
                >
                  {calling ? "Picked up by your AI agent" : heroDemo.notification.detail}
                </motion.span>
              </AnimatePresence>
            </span>
          </Glass>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Outcome cards                                                       */
/* ------------------------------------------------------------------ */

function OutcomeCards({ phase }: { phase: HeroPhase }) {
  const cards = [
    {
      key: "qualified",
      show: reached(phase, "qualified"),
      title: heroDemo.qualified[0],
      detail: heroDemo.qualified[1],
      icon: Star,
      iconClass: "from-emerald-400 to-emerald-600 shadow-[0_8px_18px_-6px_rgb(16_185_129/0.7)]",
    },
    {
      key: "crm",
      show: reached(phase, "crm"),
      title: heroDemo.crm.title,
      detail: heroDemo.crm.detail,
      icon: Database,
      iconClass: "from-nova-500 to-nova-700 shadow-[0_8px_18px_-6px_rgb(124_58_237/0.7)]",
    },
  ];
  return (
    <AnimatePresence>
      {cards
        .filter((c) => c.show)
        .map((c) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, x: 16, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
          >
            <Glass strong className="flex items-center gap-2.5 rounded-2xl px-3 py-3">
              <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white", c.iconClass)}>
                <c.icon className="size-5" fill={c.key === "qualified" ? "currentColor" : "none"} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] leading-tight font-bold text-nova-ink">{c.title}</span>
                <span className="block text-[12px] leading-snug text-nova-muted">{c.detail}</span>
              </span>
            </Glass>
          </motion.div>
        ))}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Call panel                                                          */
/* ------------------------------------------------------------------ */

type Status = { label: string; tone: "idle" | "lead" | "connecting" | "live" | "ended" };

function statusFor(phase: HeroPhase): Status {
  if (reached(phase, "crm")) return { label: "Call ended", tone: "ended" };
  if (reached(phase, "connected")) return { label: "Connected", tone: "live" };
  if (reached(phase, "connecting")) return { label: "Connecting", tone: "connecting" };
  if (reached(phase, "notify")) return { label: "New lead", tone: "lead" };
  return { label: "Standing by", tone: "idle" };
}

const leadFirstName = heroDemo.lead.name.split(" ")[0];
const speakerLabel: Partial<Record<HeroPhase, string>> = {
  connecting: "Ringing…",
  connected: "Line open",
  ai1: "AI agent speaking",
  lead1: `${leadFirstName} speaking`,
  ai2: "AI agent speaking",
  lead2: `${leadFirstName} speaking`,
  qualified: "Wrapping up",
  crm: "Call complete",
};

const toneClass: Record<Status["tone"], string> = {
  idle: "bg-slate-100 text-slate-600",
  lead: "bg-nova-100 text-nova-700",
  connecting: "bg-amber-50 text-amber-700",
  live: "bg-emerald-50 text-emerald-700",
  ended: "bg-slate-100 text-slate-600",
};

const dotClass: Record<Status["tone"], string> = {
  idle: "bg-slate-400",
  lead: "bg-nova-500",
  connecting: "bg-amber-500",
  live: "bg-emerald-500",
  ended: "bg-slate-400",
};

function CallPanel({
  phase,
  waveRef,
  timerRef,
}: {
  phase: HeroPhase;
  waveRef: React.RefObject<HTMLDivElement | null>;
  timerRef: React.RefObject<HTMLSpanElement | null>;
}) {
  const status = statusFor(phase);
  const showTimer = status.tone === "live" || status.tone === "ended";
  const cues: HeroPhase[] = ["ai1", "lead1", "ai2", "lead2"];
  const visibleLines = heroDemo.transcript.filter((_, i) => reached(phase, cues[i]));

  return (
    <Glass strong className="w-full rounded-[2rem] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nova-100 to-nova-300 text-[14px] font-bold text-nova-800 ring-2 ring-white">
          {heroDemo.lead.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-nova-ink">{heroDemo.lead.name}</p>
          <p className="truncate text-[12px] text-nova-muted">{heroDemo.lead.detail}</p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors duration-300", toneClass[status.tone])}>
          <span className={cn("size-1.5 rounded-full", dotClass[status.tone])} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={status.label} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.2 }}>
              {status.label}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>

      <div className="mt-4">
        <p className="flex h-4 items-center justify-between text-[10.5px] font-semibold tracking-wide text-nova-muted uppercase">
          {speakerLabel[phase] ?? "Waiting for a new lead"}
          <span ref={timerRef} className={cn("font-mono text-[12px] tracking-normal text-nova-ink tabular-nums", !showTimer && "invisible")}>
            00:00
          </span>
        </p>
        <div ref={waveRef} className="mt-2 flex h-10 items-center justify-between">
          {waveBase.map((_, i) => (
            <span key={i} style={{ transform: "scaleY(0.1)" }} className="h-full w-[3px] rounded-full bg-gradient-to-t from-nova-600 to-nova-pink" />
          ))}
        </div>
      </div>

      <ul className="mt-4 flex h-[226px] flex-col gap-2.5 overflow-hidden lg:h-[268px]">
        <AnimatePresence initial={false}>
          {visibleLines.map((line, i) => (
            <motion.li
              key={i}
              layout="position"
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={enter}
              className={line.from === "ai" ? "mr-4" : "ml-10 flex justify-end"}
            >
              <p
                className={
                  line.from === "ai"
                    ? "rounded-2xl rounded-tl-md bg-gradient-to-r from-nova-600 to-nova-500 px-3.5 py-2.5 text-[13px] leading-snug text-white shadow-[0_8px_20px_-10px_rgb(124_58_237/0.8)]"
                    : "rounded-2xl rounded-tr-md border border-nova-100 bg-white px-3.5 py-2.5 text-[13px] leading-snug text-nova-ink shadow-nova"
                }
              >
                {line.text}
              </p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* Call controls are illustration only — not buttons. */}
      <div className="mt-3 flex items-center justify-center gap-5 border-t border-nova-100 pt-4">
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
      <p className="mt-3 text-center">
        <PreviewTag>Simulation · not a real call</PreviewTag>
      </p>
    </Glass>
  );
}
