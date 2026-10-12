"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { BadgeCheck, Check, Clock3, Database, Headset, PhoneMissed, PhoneOutgoing, Star, UserRound, X } from "lucide-react";
import { useMotionValueEvent } from "motion/react";
import { cn } from "@/lib/utils";
import { aiStrengths, manualIssues, problemCompare, problemStory, product } from "@/data/ai-calling";
import { Avatar, Glass, Platform, PreviewTag, RobotSlot } from "./primitives";
import { RobotMascot } from "./robot-mascot";
import { useNovaWriter } from "./animated-nova";
import { useStoryClock, type StoryTime } from "./story-clock";
import { StoryControls } from "./story-controls";
import {
  PROBLEM_FINAL,
  PROBLEM_TOTAL,
  aiClock,
  aiDelay,
  barNoise,
  callLevel,
  manualClock,
  manualWait,
  problemCues,
  problemNovaExpression,
  problemNovaPose,
  problemNovaTalking,
  reachedP,
  type ProblemPhase,
} from "./problem-story";

const r2 = (n: number) => Math.round(n * 1000) / 1000;
const WAVE_BARS = 30;
const waveBase = Array.from({ length: WAVE_BARS }, (_, i) => 0.45 + 0.55 * Math.abs(Math.sin(i * 1.37) * Math.cos(i * 0.41)));

/** Fades content in place (always mounted, so nothing ever shifts the layout). */
const reveal = (on: boolean) =>
  cn("transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none", on ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0");

/* ------------------------------------------------------------------ */
/* Controller                                                          */
/* ------------------------------------------------------------------ */

/**
 * Manual vs LeadsZone AI calling, told as one synchronized simulation. A single story clock
 * (useStoryClock) drives both journeys and NOVA; per-frame values (clocks, meters, waveform,
 * robot pose) are written to the DOM, and React re-renders only when the story phase changes.
 */
export function ProblemComparison() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { time, phase, reduced, userPaused, replay, togglePause } = useStoryClock(rootRef, {
    total: PROBLEM_TOTAL,
    finalFrame: PROBLEM_FINAL,
    phaseAt: problemCues.phaseAt,
    amount: 0.25,
  });

  const refs = {
    manualClock: useRef<HTMLSpanElement>(null),
    waitLabel: useRef<HTMLSpanElement>(null),
    waitBar: useRef<HTMLSpanElement>(null),
    aiClock: useRef<HTMLSpanElement>(null),
    delayBar: useRef<HTMLSpanElement>(null),
    wave: useRef<HTMLDivElement>(null),
  };

  const apply = useCallback((t: number) => {
    if (refs.manualClock.current) refs.manualClock.current.textContent = manualClock(t);
    if (refs.aiClock.current) refs.aiClock.current.textContent = aiClock(t);
    const wait = manualWait(t);
    if (refs.waitLabel.current) refs.waitLabel.current.textContent = wait.label;
    if (refs.waitBar.current) refs.waitBar.current.style.transform = `scaleX(${r2(wait.progress)})`;
    if (refs.delayBar.current) refs.delayBar.current.style.transform = `scaleX(${r2(aiDelay(t))})`;
    const level = callLevel(t);
    refs.wave.current?.childNodes.forEach((bar, i) => {
      (bar as HTMLElement).style.transform = `scaleY(${r2(0.1 + 0.9 * level * waveBase[i] * (0.35 + 0.65 * barNoise(i, t)))})`;
    });
    // `refs` holds stable useRef objects, so the first render's copy stays valid.
  }, []);

  useMotionValueEvent(time, "change", apply);
  useEffect(() => apply(time.get()), [apply, time]);

  const final = reachedP(phase, "final");

  return (
    <div ref={rootRef} data-problem-phase={phase} className="mt-14">
      <div className="relative grid gap-5 lg:grid-cols-2 lg:gap-10">
        {/* ---------------- Manual follow-up: muted neutrals + amber ---------------- */}
        <Glass className={cn("flex flex-col p-5 transition-opacity duration-700 sm:p-6", final && "opacity-90")}>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-slate-700 text-white">
              <UserRound className="size-5" />
            </span>
            <h3 className="text-[18px] font-bold text-nova-ink">Manual calling</h3>
          </div>
          <div className="mt-5 grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ManualVisual />
            <ul className="grid gap-2">
              {manualIssues.map((issue) => (
                <li key={issue} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-700 ring-1 ring-slate-200/80">
                  <X className="size-3.5 shrink-0 text-amber-600" strokeWidth={3} /> {issue}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden className="mt-5 flex flex-1 flex-col rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-200/70">
            <JourneyHeader clockRef={refs.manualClock} tone="manual" />
            <LeadCard show={reachedP(phase, "arrive")} tone="manual" />
            <ol className="mt-3 grid gap-1.5">
              {problemStory.manualSteps.map((s, i) => (
                <Step key={s.label} time={s.time} label={s.label} tone="manual" state={stepState(phase, manualStepCues, i)} />
              ))}
            </ol>
            <div className="mt-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200/70">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-slate-600">Time waiting for a callback</span>
                <span ref={refs.waitLabel} className="font-mono font-semibold text-amber-700 tabular-nums">
                  0 min
                </span>
              </div>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                <span ref={refs.waitBar} style={{ transform: "scaleX(0)" }} className="block h-full origin-left rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
              </span>
            </div>
            <div className={cn("mt-3 flex items-start gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200/70", reveal(reachedP(phase, "callback")))}>
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <PhoneOutgoing className="size-4" />
              </span>
              <span className="min-w-0 text-[12.5px] leading-snug">
                <span className="block font-semibold text-slate-700">First callback attempt · 2:00 PM</span>
                <span className="block text-slate-500">4 hours after the enquiry arrived, once the team was free.</span>
              </span>
            </div>
            <div className="mt-auto pt-3">
              <p className={cn("flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[14px] font-bold text-amber-800 ring-1 ring-amber-200", reveal(final))}>
                <Clock3 className="size-4" /> {problemStory.manualOutcome}
              </p>
            </div>
          </div>

          <CompareRow side="manual" highlight={final} />
        </Glass>

        {/* VS medallion */}
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 z-10 hidden size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-nova-600 to-nova-800 text-[17px] font-bold text-white shadow-[0_0_0_8px_rgb(255_255_255/0.8),0_16px_40px_-10px_rgb(76_29_149/0.7)] lg:flex"
        >
          VS
        </span>

        {/* ---------------- LeadsZone AI calling: violet ---------------- */}
        <Glass
          strong
          className={cn(
            "flex flex-col overflow-hidden p-5 ring-2 ring-nova-200 transition-shadow duration-700 sm:p-6",
            final && "shadow-[0_0_0_4px_rgb(196_181_253/0.45),0_40px_90px_-30px_rgb(76_29_149/0.45)]",
          )}
        >
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgb(196_181_253/0.45),transparent_60%)]" />
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500 to-nova-700 text-white">
              <Headset className="size-5" />
            </span>
            <h3 className="text-[18px] font-bold text-nova-700">{product.name}</h3>
          </div>
          <div className="mt-5 grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <RobotSlot name="problem" className="relative mx-auto w-[150px]">
              <Platform className="-bottom-6 left-1/2 h-16 w-[200px] -translate-x-1/2" />
              <StoryNova time={time} phase={phase} />
            </RobotSlot>
            <ul className="grid gap-2">
              {aiStrengths.map((s) => (
                <li key={s} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[13px] font-medium text-nova-ink shadow-[0_1px_2px_rgb(76_29_149/0.06)] ring-1 ring-nova-100">
                  <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-nova-600 text-white">
                    <Check className="size-2.5" strokeWidth={3.5} />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden className="mt-5 flex flex-1 flex-col rounded-2xl bg-nova-50/80 p-4 ring-1 ring-nova-100">
            <JourneyHeader clockRef={refs.aiClock} tone="ai" />
            <LeadCard show={reachedP(phase, "arrive")} tone="ai" />
            <ol className="mt-3 grid gap-1.5">
              {problemStory.aiSteps.map((s, i) => (
                <Step key={s.label} time={s.time} label={s.label} tone="ai" state={stepState(phase, aiStepCues, i)}>
                  {i === 1 && (
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-nova-100">
                      <span ref={refs.delayBar} style={{ transform: "scaleX(0)" }} className="block h-full origin-left rounded-full bg-gradient-to-r from-nova-500 to-nova-600" />
                    </span>
                  )}
                </Step>
              ))}
            </ol>
            <CallCard phase={phase} waveRef={refs.wave} />
            <div className="mt-auto pt-3">
              <p className={cn("flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nova-600 to-nova-500 px-3 py-2.5 text-center text-[14px] font-bold text-white shadow-nova-glow", reveal(final))}>
                <BadgeCheck className="size-4 shrink-0" /> {problemStory.aiOutcome}
              </p>
            </div>
          </div>

          <CompareRow side="ai" highlight={final} />
        </Glass>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <PreviewTag>Illustrative simulation · sample times within 09:00–19:00 calling hours</PreviewTag>
        {!reduced && <StoryControls paused={userPaused} onTogglePause={togglePause} onReplay={replay} label="comparison" />}
      </div>

      {/* One static explanation for assistive tech; the animated journeys above are hidden from it. */}
      <p className="sr-only">
        Illustrative simulation. The same course enquiry from {problemStory.lead.name} arrives at {problemStory.lead.received}. With
        manual calling, the sales team is busy, the lead waits in the callback queue, is still waiting at 11:00 AM, and a manual
        callback is attempted at 2:00 PM: the follow-up is delayed. With {product.name}, NOVA picks up the enquiry, waits the
        configured one-minute delay, calls at 10:01 AM, Priya says she is interested, and the lead is marked interested and the CRM
        updated: a qualified lead, ready for follow-up.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const manualStepCues: ProblemPhase[] = ["busy", "queue", "hour", "callback"];
const aiStepCues: ProblemPhase[] = ["notice", "busy", "calling", "crm"];

type StepState = "pending" | "active" | "done";
function stepState(phase: ProblemPhase, cues: ProblemPhase[], i: number): StepState {
  if (!reachedP(phase, cues[i])) return "pending";
  return i < cues.length - 1 && reachedP(phase, cues[i + 1]) ? "done" : "active";
}

function Step({
  time,
  label,
  tone,
  state,
  children,
}: {
  time: string;
  label: string;
  tone: "manual" | "ai";
  state: StepState;
  children?: React.ReactNode;
}) {
  const manual = tone === "manual";
  return (
    <li
      className={cn(
        "grid grid-cols-[64px_minmax(0,1fr)_16px] items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-[opacity,background-color,box-shadow] duration-500 motion-reduce:transition-none",
        state === "pending" && "opacity-35",
        state === "active" && (manual ? "bg-amber-50 ring-1 ring-amber-200/80" : "bg-white ring-1 ring-nova-200 shadow-[0_6px_16px_-10px_rgb(124_58_237/0.6)]"),
      )}
    >
      <span className={cn("font-mono text-[11px]", manual ? "text-slate-500" : "text-nova-600")}>{time}</span>
      <span className={cn("min-w-0 font-semibold", manual ? "text-slate-700" : "text-nova-ink")}>
        {label}
        {children}
      </span>
      <span className="flex justify-end">
        {state === "done" && <Check className={cn("size-3.5", manual ? "text-slate-400" : "text-nova-600")} strokeWidth={3} />}
        {state === "active" && <span className={cn("size-2 rounded-full", manual ? "bg-amber-500" : "bg-nova-500 shadow-[0_0_8px_rgb(139_92_246/0.8)]")} />}
      </span>
    </li>
  );
}

function JourneyHeader({ clockRef, tone }: { clockRef: React.RefObject<HTMLSpanElement | null>; tone: "manual" | "ai" }) {
  const manual = tone === "manual";
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[13px] font-bold tabular-nums",
          manual ? "bg-white text-slate-700 ring-1 ring-slate-200" : "bg-white text-nova-700 ring-1 ring-nova-200",
        )}
      >
        <Clock3 className="size-3.5" />
        <span ref={clockRef}>10:00 AM</span>
      </span>
      <span className={cn("text-[11px] font-semibold tracking-wide uppercase", manual ? "text-slate-500" : "text-nova-600")}>
        {manual ? "Manual follow-up" : "AI follow-up"}
      </span>
    </div>
  );
}

function LeadCard({ show, tone }: { show: boolean; tone: "manual" | "ai" }) {
  const lead = problemStory.lead;
  return (
    <div
      className={cn(
        "mt-3 flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1",
        tone === "manual" ? "ring-slate-200" : "ring-nova-200 shadow-[0_8px_20px_-14px_rgb(124_58_237/0.7)]",
        reveal(show),
      )}
    >
      <Avatar name={lead.name} tone={1} className="size-9 text-[12px]" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-nova-ink">{lead.title}</p>
        <p className="text-[11.5px] text-nova-muted">Received {lead.received}</p>
      </div>
    </div>
  );
}

/** The AI call: status, live waveform and a four-line transcript preview in a fixed-height area. */
function CallCard({ phase, waveRef }: { phase: ProblemPhase; waveRef: React.RefObject<HTMLDivElement | null> }) {
  const connected = reachedP(phase, "connected");
  const ended = reachedP(phase, "qualified");
  const status = ended ? "Call complete" : connected ? "Connected" : reachedP(phase, "calling") ? "Connecting…" : "Waiting";
  const cues: ProblemPhase[] = ["ai1", "lead1", "ai2", "lead2"];
  return (
    <div className={cn("mt-3 rounded-xl bg-white p-3 ring-1 ring-nova-100", reveal(reachedP(phase, "calling")))}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-nova-ink">Simulated AI call</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors duration-300",
            connected && !ended ? "bg-emerald-50 text-emerald-700" : ended ? "bg-slate-100 text-slate-600" : "bg-nova-100 text-nova-700",
          )}
        >
          {status}
        </span>
      </div>
      <div ref={waveRef} className="mt-2 flex h-6 items-center justify-between">
        {waveBase.map((_, i) => (
          <span key={i} style={{ transform: "scaleY(0.1)" }} className="h-full w-[2.5px] rounded-full bg-gradient-to-t from-nova-600 to-nova-pink" />
        ))}
      </div>
      <ul className="mt-2 grid gap-1.5">
        {problemStory.transcript.map((line, i) => (
          <li key={i} className={cn(line.from === "ai" ? "mr-6" : "ml-8 flex justify-end", reveal(reachedP(phase, cues[i])))}>
            <span
              className={cn(
                "inline-block rounded-xl px-2.5 py-1.5 text-[12px] leading-snug",
                line.from === "ai" ? "rounded-bl-sm bg-gradient-to-r from-nova-600 to-nova-500 text-white" : "rounded-br-sm bg-nova-50 text-nova-ink ring-1 ring-nova-100",
              )}
            >
              {line.text}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className={cn("inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-700 ring-1 ring-emerald-100", reveal(ended))}>
          <Star className="size-3" fill="currentColor" /> Interested
        </span>
        <span className={cn("inline-flex items-center gap-1 rounded-full bg-nova-100 px-2 py-0.5 text-[11.5px] font-semibold text-nova-700", reveal(reachedP(phase, "crm")))}>
          <Database className="size-3" /> CRM updated
        </span>
      </div>
    </div>
  );
}

function CompareRow({ side, highlight }: { side: "manual" | "ai"; highlight: boolean }) {
  const ai = side === "ai";
  return (
    <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-nova-100 pt-4">
      {problemCompare.map((c) => (
        <div key={c.label}>
          <dt className="text-[11px] font-semibold tracking-wide text-nova-muted uppercase">{c.label}</dt>
          <dd
            className={cn(
              "mt-1 rounded-lg text-[14px] leading-snug font-bold transition-[background-color,padding,color] duration-500 motion-reduce:transition-none",
              ai ? "text-nova-700" : "text-slate-600",
              ai && highlight && "bg-nova-100/80 px-1.5 py-0.5",
            )}
          >
            {ai ? c.ai : c.manual}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* NOVA (driven by the comparison clock; no AnimatedNova here)          */
/* ------------------------------------------------------------------ */

function StoryNova({ time, phase }: { time: StoryTime; phase: ProblemPhase }) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = useRef(1);
  const write = useNovaWriter(ref, scale);
  const expression = problemNovaExpression(phase);
  const talking = problemNovaTalking(phase);

  useMotionValueEvent(time, "change", (t) => write(problemNovaPose(t)));
  // React resets the arm transforms when the expression or mouth re-renders; re-apply right away.
  useLayoutEffect(() => write(problemNovaPose(time.get())), [expression, talking, time, write]);

  return (
    <div ref={ref} data-nova="problem-story" className="will-change-transform">
      <RobotMascot arm="point" expression={expression} talking={talking} glow={false} />
    </div>
  );
}

/** The struggling manual desk: a headset agent surrounded by unanswered-call notes (neutral + amber). */
function ManualVisual() {
  return (
    <div aria-hidden className="relative mx-auto h-[190px] w-full max-w-[220px]">
      <div className="absolute inset-x-6 top-6 bottom-4 rounded-[2rem] bg-gradient-to-b from-slate-100 to-slate-200/70" />
      <span className="absolute top-1/2 left-1/2 inline-flex size-20 -translate-x-1/2 -translate-y-[40%] items-center justify-center rounded-full bg-gradient-to-b from-slate-300 to-slate-400 text-white ring-8 ring-white/80">
        <Headset className="size-9" strokeWidth={1.6} />
      </span>
      {[
        { label: "Missed call", cls: "top-0 left-0 -rotate-6" },
        { label: "Call back later", cls: "top-10 -right-2 rotate-3" },
        { label: "Missed call", cls: "bottom-2 left-2 rotate-2" },
      ].map((n, i) => (
        <span
          key={i}
          className={cn("absolute inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 shadow-nova ring-1 ring-amber-100", n.cls)}
        >
          <PhoneMissed className="size-3.5" /> {n.label}
        </span>
      ))}
    </div>
  );
}
