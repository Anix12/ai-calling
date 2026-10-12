"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { useMotionValueEvent } from "motion/react";
import { ArrowRight, BadgeCheck, Check, Globe, PhoneCall, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { instantFlow, instantStory, product } from "@/data/ai-calling";
import { Avatar, Glass, GlowIcon, Platform, PreviewTag, RobotSlot } from "./primitives";
import { CallControls } from "./call-ui";
import { RobotMascot } from "./robot-mascot";
import { useNovaWriter } from "./animated-nova";
import { useStoryClock } from "./story-clock";
import { StoryControls } from "./story-controls";
import {
  INSTANT_FINAL,
  INSTANT_TOTAL,
  barNoise,
  callLevel,
  callPillFrame,
  callSeconds,
  callStatus,
  delayProgress,
  instantCues,
  instantNovaExpression,
  instantNovaPose,
  instantNovaTalking,
  leadCardFrame,
  pipelinePos,
  pipelineStepState,
  reachedI,
  type InstantPhase,
  type SceneMetrics,
} from "./instant-timeline";

const r2 = (n: number) => Math.round(n * 100) / 100;
const WAVE_BARS = 34;
const waveBase = Array.from({ length: WAVE_BARS }, (_, i) => 0.45 + 0.55 * Math.abs(Math.sin(i * 1.37) * Math.cos(i * 0.41)));
const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const reveal = (on: boolean) =>
  cn("transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none", on ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0");
const lead = instantStory.lead;

/**
 * Instant AI calling, as one synchronized simulation: NOVA catches the incoming lead, the card
 * becomes a calling indicator, the call plays out, the lead is qualified and moves through the
 * pipeline into the CRM. One story clock drives everything; per-frame values are written to the
 * DOM, and React re-renders only when the story phase changes.
 *
 * The catch is computed in shared scene coordinates: the robot box, card and scene are measured
 * on mount and on resize (never per frame), and the card is placed from the same arm angle that
 * animates NOVA's hand (instant-story.ts → handAt), so they meet at every viewport width.
 */
export function InstantStory({ heading }: { heading: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { time, phase, reduced, userPaused, replay, togglePause } = useStoryClock(rootRef, {
    total: INSTANT_TOTAL,
    finalFrame: INSTANT_FINAL,
    phaseAt: instantCues.phaseAt,
    amount: 0.25,
  });

  const sceneRef = useRef<HTMLDivElement>(null);
  const robotBoxRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardGlowRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const delayBarRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  const metrics = useRef<SceneMetrics | null>(null);
  const trackW = useRef(0);
  const scale = useRef(1);
  const writeNova = useNovaWriter(robotRef, scale);

  const apply = useCallback(
    (t: number) => {
      const m = metrics.current;
      if (m) {
        writeNova(instantNovaPose(t, m.robotW));
        const c = leadCardFrame(t, m);
        if (cardRef.current) {
          cardRef.current.style.transform = `translate3d(${r2(c.x)}px, ${r2(c.y)}px, 0) rotate(${r2(c.rotate)}deg) scale(${r2(c.scale)})`;
          cardRef.current.style.opacity = String(r2(c.opacity));
        }
        if (cardGlowRef.current) cardGlowRef.current.style.opacity = String(r2(c.glow));
        const p = callPillFrame(t, m);
        if (pillRef.current) {
          pillRef.current.style.transform = `translate3d(${r2(p.x)}px, ${r2(p.y)}px, 0) scale(${r2(p.scale)})`;
          pillRef.current.style.opacity = String(r2(p.opacity));
        }
      }
      if (delayBarRef.current) delayBarRef.current.style.transform = `scaleX(${r2(delayProgress(t))})`;
      if (timerRef.current) timerRef.current.textContent = fmt(callSeconds(t));
      const level = callLevel(t);
      waveRef.current?.childNodes.forEach((bar, i) => {
        (bar as HTMLElement).style.transform = `scaleY(${r2(0.1 + 0.9 * level * waveBase[i] * (0.35 + 0.65 * barNoise(i, t)))})`;
      });
      const pos = pipelinePos(t);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${r2(pos / 3)})`;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${r2((pos / 3) * trackW.current)}px, 0, 0)`;
    },
    [writeNova],
  );

  useMotionValueEvent(time, "change", apply);

  // Measure the scene once, and again whenever its size changes.
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const box = robotBoxRef.current;
    if (!scene || !box) return;
    const measure = () => {
      const sr = scene.getBoundingClientRect();
      const rr = box.getBoundingClientRect();
      metrics.current = {
        robotX: rr.left - sr.left,
        robotY: rr.top - sr.top,
        robotW: rr.width,
        sceneW: sr.width,
        cardW: cardRef.current?.offsetWidth ?? 220,
        cardH: cardRef.current?.offsetHeight ?? 64,
        pillW: pillRef.current?.offsetWidth ?? 170,
        pillH: pillRef.current?.offsetHeight ?? 36,
      };
      scale.current = Math.max(0.1, rr.width / 200);
      trackW.current = trackRef.current?.offsetWidth ?? 0;
      apply(time.get());
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scene);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [apply, time]);

  const expression = instantNovaExpression(phase);
  const talking = instantNovaTalking(phase);
  // React resets the arm transforms when the expression or mouth re-renders; re-apply right away.
  useLayoutEffect(() => apply(time.get()), [expression, talking, apply, time]);

  return (
    <div ref={rootRef} data-instant-phase={phase}>
      <div className="grid items-center gap-12 xl:grid-cols-[380px_minmax(0,1fr)] xl:gap-10">
        {heading}

        {/* ---------------- Scene: card, NOVA, calling indicator, phone ---------------- */}
        <div ref={sceneRef} aria-hidden className="relative mx-auto w-full max-w-[760px]">
          <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,320px)] sm:items-end sm:gap-6">
            {/* Robot cell: the top padding is the card's flight path and the indicator's dock */}
            <div className="relative flex justify-end pt-[150px] pb-8 sm:pt-[170px]">
              <div ref={robotBoxRef} className="relative z-10 w-[180px] sm:w-[210px] lg:w-[230px]">
                <Platform className="-bottom-10 left-1/2 h-[96px] w-[290px] -translate-x-1/2" />
                <RobotSlot name="instant-call">
                  <div ref={robotRef} data-nova="instant-story" className="will-change-transform">
                    <RobotMascot arm="rest" expression={expression} talking={talking} glow={false} />
                  </div>
                </RobotSlot>
              </div>
            </div>
            <PhonePanel phase={phase} delayBarRef={delayBarRef} timerRef={timerRef} waveRef={waveRef} />
          </div>

          {/* Lead notification: in front of NOVA, its corner resting on the raised hand */}
          <div ref={cardRef} data-anim="lead-card" style={{ opacity: 0 }} className="absolute top-0 left-0 z-20 w-[180px] origin-bottom-right will-change-transform sm:w-[190px]">
            <span
              ref={cardGlowRef}
              className="absolute -inset-2 rounded-[1.4rem] bg-[radial-gradient(closest-side,rgb(139_92_246/0.45),transparent)] blur-md"
            />
            <div className="relative flex items-center gap-2.5 rounded-2xl bg-white/95 px-3 py-2.5 shadow-nova-lg ring-1 ring-nova-200">
              <Avatar name={lead.name} tone={2} className="size-9 text-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-[12.5px] font-bold text-nova-ink">
                  <Globe className="size-3 text-emerald-600" /> {lead.source}
                </p>
                <p className="text-[11.5px] leading-tight text-nova-muted">
                  {lead.name}
                  <span className="block">{lead.received}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Calling indicator the caught card turns into */}
          <div ref={pillRef} data-anim="call-pill" style={{ opacity: 0 }} className="absolute top-0 left-0 z-30 w-[176px] origin-bottom will-change-transform">
            <span className="flex items-center gap-2 rounded-full bg-gradient-to-r from-nova-600 to-nova-500 py-1.5 pr-3.5 pl-1.5 text-[12.5px] font-semibold whitespace-nowrap text-white shadow-nova-glow">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-white/20">
                {reachedI(phase, "crm") ? <Check className="size-3.5" strokeWidth={3} /> : <PhoneCall className="size-3.5" />}
              </span>
              {callStatus(phase)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-16 lg:mt-20">
        <Pipeline phase={phase} trackRef={trackRef} fillRef={fillRef} dotRef={dotRef} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <PreviewTag>Illustrative simulation · sample 1-minute delay within 09:00–19:00 calling hours</PreviewTag>
        {!reduced && <StoryControls paused={userPaused} onTogglePause={togglePause} onReplay={replay} label="instant calling" />}
      </div>

      <p className="sr-only">
        Illustrative simulation. A website enquiry from {lead.name} arrives at {lead.received}. NOVA, the {product.name} assistant,
        picks it up, waits the configured one-minute delay and calls at {lead.callAt}, within the sample calling hours. Aarav says
        he would like the team to follow up, so the lead is marked interested, moves through the pipeline from new lead to AI call,
        qualification and CRM update, and the CRM is updated with status interested and a team follow-up.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phone                                                                */
/* ------------------------------------------------------------------ */

function PhonePanel({
  phase,
  delayBarRef,
  timerRef,
  waveRef,
}: {
  phase: InstantPhase;
  delayBarRef: React.RefObject<HTMLSpanElement | null>;
  timerRef: React.RefObject<HTMLSpanElement | null>;
  waveRef: React.RefObject<HTMLDivElement | null>;
}) {
  const status = callStatus(phase);
  const live = reachedI(phase, "connected") && !reachedI(phase, "qualified");
  const qualified = reachedI(phase, "qualified");
  const cues: InstantPhase[] = ["ai1", "lead1", "ai2", "lead2"];
  const speaking = phase === "ai1" || phase === "ai2" ? "NOVA speaking" : phase === "lead1" || phase === "lead2" ? "Aarav speaking" : null;
  return (
    <Glass
      strong
      data-anim="phone"
      className={cn(
        "mx-auto w-full max-w-[360px] rounded-[2rem] p-4 transition-shadow duration-500 sm:p-5",
        reachedI(phase, "calling") && !qualified && "shadow-[0_0_0_3px_rgb(196_181_253/0.5),0_40px_90px_-30px_rgb(76_29_149/0.45)]",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={lead.name} tone={2} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-nova-ink">{lead.name}</p>
          <p className="truncate text-[12px] text-nova-muted">
            {lead.source} · {lead.received}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap transition-colors duration-300",
            live ? "bg-emerald-50 text-emerald-700" : reachedI(phase, "delay") ? "bg-nova-100 text-nova-700" : "bg-slate-100 text-slate-600",
          )}
        >
          <span className={cn("size-1.5 rounded-full", live ? "bg-emerald-500" : reachedI(phase, "delay") ? "bg-nova-500" : "bg-slate-400")} />
          {status}
        </span>
      </div>

      {/* Configured delay (sample rule: 1 minute) */}
      <div className="mt-4 rounded-xl bg-nova-50/80 px-3 py-2 ring-1 ring-nova-100">
        <div className="flex flex-wrap items-center justify-between gap-x-2 text-[11.5px]">
          <span className="font-semibold text-nova-ink">Configured delay · 1 min</span>
          <span className="font-mono whitespace-nowrap text-nova-600">
            {lead.received} → {lead.callAt}
          </span>
        </div>
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-nova-100">
          <span ref={delayBarRef} style={{ transform: "scaleX(0)" }} className="block h-full origin-left rounded-full bg-gradient-to-r from-nova-500 to-nova-600" />
        </span>
      </div>

      <div className="mt-3">
        <p className="flex h-4 items-center justify-between text-[10.5px] font-semibold tracking-wide text-nova-muted uppercase">
          {speaking ?? (live ? "Line open" : qualified ? "Call complete" : "Waiting")}
          <span ref={timerRef} className={cn("font-mono text-[12px] tracking-normal text-nova-ink tabular-nums", !reachedI(phase, "connected") && "invisible")}>
            00:00
          </span>
        </p>
        <div ref={waveRef} className="mt-2 flex h-9 items-center justify-between">
          {waveBase.map((_, i) => (
            <span key={i} style={{ transform: "scaleY(0.1)" }} className="h-full w-[3px] rounded-full bg-gradient-to-t from-nova-600 to-nova-pink" />
          ))}
        </div>
      </div>

      <ul className="mt-3 grid gap-2">
        {instantStory.transcript.map((line, i) => (
          <li key={i} className={cn(line.from === "ai" ? "mr-6" : "ml-10 flex justify-end", reveal(reachedI(phase, cues[i])))}>
            <span
              className={cn(
                "inline-block rounded-2xl px-3 py-2 text-[12.5px] leading-snug",
                line.from === "ai"
                  ? "rounded-bl-md bg-gradient-to-r from-nova-600 to-nova-500 text-white"
                  : "rounded-br-md border border-nova-100 bg-white text-nova-ink shadow-nova",
              )}
            >
              {line.text}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-nova-100">
        <span className="text-[12px] whitespace-nowrap text-nova-muted">Lead status</span>
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11.5px] font-semibold transition-colors duration-500",
              qualified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
            )}
          >
            {qualified ? instantStory.crm.status : "New"}
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-nova-600 to-nova-500 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white", reveal(qualified))}>
            <BadgeCheck className="size-3" /> Qualified by AI
          </span>
        </span>
      </div>

      <CallControls className="mt-4 border-t border-nova-100 pt-3" />
    </Glass>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                             */
/* ------------------------------------------------------------------ */

function Pipeline({
  phase,
  trackRef,
  fillRef,
  dotRef,
}: {
  phase: InstantPhase;
  trackRef: React.RefObject<HTMLSpanElement | null>;
  fillRef: React.RefObject<HTMLSpanElement | null>;
  dotRef: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {/* Track between the first and last pedestal, a fill that follows the lead, and the lead itself */}
      <span ref={trackRef} aria-hidden className="absolute top-[52px] right-[12.5%] left-[12.5%] hidden h-[3px] rounded-full bg-nova-200/70 lg:block">
        <span ref={fillRef} style={{ transform: "scaleX(0)" }} className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-nova-500 to-nova-pink shadow-[0_0_10px_rgb(139_92_246/0.7)]" />
        <span ref={dotRef} className="absolute top-1/2 -left-4 z-20 -mt-4 will-change-transform">
          <span className={cn("inline-flex size-8 items-center justify-center rounded-full bg-white text-[10px] font-bold text-nova-700 shadow-nova-glow ring-2 ring-nova-500", reveal(reachedI(phase, "arrive")))}>
            {lead.initials}
          </span>
        </span>
      </span>
      {instantFlow.map((s, i) => {
        const state = pipelineStepState(phase, i);
        return (
          <li key={s.step} data-anim={`step-${s.step}`} data-state={state} className="relative flex flex-col items-center text-center">
            <div className="relative flex h-[104px] w-full items-start justify-center">
              <span aria-hidden className="absolute top-[70px] h-8 w-36 rounded-[100%] bg-gradient-to-b from-white to-nova-100 shadow-[0_10px_24px_-10px_rgb(76_29_149/0.45)] ring-1 ring-white" />
              <span
                className={cn(
                  "relative z-10 mt-4 rounded-[1.4rem] transition-[opacity,transform,box-shadow] duration-500 motion-reduce:transition-none",
                  state === "pending" && "opacity-45",
                  state === "active" && "scale-110 shadow-[0_0_0_6px_rgb(237_233_254),0_0_30px_rgb(139_92_246/0.55)]",
                )}
              >
                <GlowIcon icon={s.icon} className="size-16 rounded-[1.25rem] [&_svg]:size-7" />
                {state === "done" && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </span>
              {i < instantFlow.length - 1 && (
                <ArrowRight aria-hidden className="absolute top-[42px] -right-5 hidden size-5 text-nova-500 lg:block" strokeWidth={2.5} />
              )}
            </div>
            <Glass className={cn("mt-1 w-full flex-1 rounded-2xl px-4 py-3.5 text-left transition-shadow duration-500", state === "active" && "ring-2 ring-nova-300")}>
              <p className="flex items-center gap-2 text-[15px] font-bold text-nova-ink">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-nova-600 text-[12px] text-white">{s.step}</span>
                {s.title}
              </p>
              <p className="mt-1 text-[13.5px] leading-snug text-nova-muted">{s.detail}</p>
              {i === instantFlow.length - 1 && (
                <p aria-hidden className={cn("mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[12px] font-semibold text-emerald-700", reveal(reachedI(phase, "crm")))}>
                  <Star className="size-3" fill="currentColor" /> {lead.name} → {instantStory.crm.status} · {instantStory.crm.next}
                </p>
              )}
            </Glass>
          </li>
        );
      })}
    </ol>
  );
}

