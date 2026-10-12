"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { useMotionValueEvent } from "motion/react";
import { FileAudio, FileText, Play, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { dropOffReasons, intelligenceInsights, sampleCall } from "@/data/ai-calling";
import { Glass, GlowIcon, Platform, PreviewTag, RobotSlot } from "./primitives";
import { RobotMascot } from "./robot-mascot";
import { useNovaWriter } from "./animated-nova";
import { reachAngle } from "./nova-personality";
import { useStoryClock } from "./story-clock";
import { StoryControls } from "./story-controls";
import {
  INTEL_FINAL,
  INTEL_TOTAL,
  barGrow,
  intelCues,
  intelNovaExpression,
  intelNovaPose,
  playheadSeconds,
  reachedI,
  transcriptCues,
  type IntelGaze,
  type IntelPhase,
} from "./intelligence-timeline";

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const reveal = (on: boolean) =>
  cn("transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none", on ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0");
const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
/** Sample call length in seconds (02:34). */
const CALL_SECONDS = 154;
const WAVE = [30, 55, 80, 45, 95, 70, 40, 85, 60, 100, 50, 75, 35, 90, 65, 45, 80, 55, 30, 70, 95, 60, 40, 75, 50, 85, 35, 65];
/** The top drop-off reason is highlighted, with the insight that addresses it. */
const HIGHLIGHT_REASON = 0;
const HIGHLIGHT_INSIGHT = intelligenceInsights.findIndex((i) => i.title === "Fix drop-off points");

/**
 * Call intelligence as one synchronized simulation: a completed sample call is reviewed line by
 * line, the AI summary and outcome appear, then a SEPARATE illustrative campaign sample shows why
 * calls don't convert and which insight follows. One story clock drives everything; continuous
 * values (playhead, bars, robot pose) are written to the DOM per frame.
 */
export function IntelligenceStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { time, phase, reduced, userPaused, replay, togglePause } = useStoryClock(rootRef, {
    total: INTEL_TOTAL,
    finalFrame: INTEL_FINAL,
    phaseAt: intelCues.phaseAt,
    amount: 0.2,
  });

  const robotRef = useRef<HTMLDivElement>(null);
  const robotBoxRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLOListElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<HTMLSpanElement>(null);
  const barsRef = useRef<HTMLUListElement>(null);
  const scale = useRef(1);
  const gaze = useRef<IntelGaze>({ transcript: { x: 0, y: -1 }, summary: { x: 1, y: 0 }, point: -96 });
  const writeNova = useNovaWriter(robotRef, scale);

  const apply = useCallback(
    (t: number) => {
      writeNova(intelNovaPose(t, gaze.current));
      const sec = playheadSeconds(t);
      if (positionRef.current) positionRef.current.textContent = fmt(sec);
      if (playedRef.current) playedRef.current.style.clipPath = `inset(0 ${r3(100 - (sec / CALL_SECONDS) * 100)}% 0 0)`;
      barsRef.current?.querySelectorAll<HTMLElement>("[data-bar]").forEach((bar) => {
        bar.style.transform = `scaleX(${r3(barGrow(Number(bar.dataset.bar), t))})`;
      });
    },
    [writeNova],
  );

  useMotionValueEvent(time, "change", apply);

  const measure = useCallback(() => {
    const box = robotBoxRef.current;
    if (!box) return;
    const b = box.getBoundingClientRect();
    const k = b.width / 200;
    scale.current = Math.max(0.1, k);
    const face = { x: b.left + b.width / 2, y: b.top + b.height * 0.3 };
    const shoulder = { x: b.left + 146 * k, y: b.top + 138 * k };
    const centre = (el: Element | null) => {
      const r = el?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    };
    const unit = (p: { x: number; y: number } | null, from: { x: number; y: number }, fallback: { x: number; y: number }) => {
      if (!p) return fallback;
      const len = Math.hypot(p.x - from.x, p.y - from.y) || 1;
      return { x: (p.x - from.x) / len, y: (p.y - from.y) / len };
    };
    const summary = centre(summaryRef.current);
    gaze.current = {
      transcript: unit(centre(transcriptRef.current), face, { x: 0, y: -1 }),
      summary: unit(summary, face, { x: 1, y: 0 }),
      point: summary ? reachAngle({ x: summary.x - shoulder.x, y: summary.y - shoulder.y }) : -96,
    };
    apply(time.get());
  }, [apply, time]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const expression = intelNovaExpression(phase);
  useLayoutEffect(() => apply(time.get()), [expression, apply, time]);

  return (
    <div ref={rootRef} data-intel-phase={phase} className="min-w-0">
      <div aria-hidden className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <Glass strong data-anim="recording" className={cn("p-4 sm:p-5", reveal(reachedI(phase, "call")))}>
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[16px] font-bold text-nova-ink">
                <FileAudio className="size-4 text-nova-600" /> Completed call · {sampleCall.lead}
              </p>
              <PreviewTag>Sample call</PreviewTag>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-nova-50/80 p-3 ring-1 ring-nova-100">
              {/* Visual only: there is no audio on this page. */}
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nova-500 to-nova-700 text-white shadow-nova-glow">
                <Play className="ml-0.5 size-4 fill-current" />
              </span>
              <div className="relative h-9 min-w-0 flex-1">
                <Bars className="bg-nova-200" />
                <div ref={playedRef} style={{ clipPath: "inset(0 100% 0 0)" }} className="absolute inset-0">
                  <Bars className="bg-gradient-to-t from-nova-600 to-nova-pink" />
                </div>
              </div>
              <span className="shrink-0 font-mono text-[12px] font-semibold text-nova-ink">
                <span ref={positionRef}>00:00</span> <span className="text-nova-muted">/ {sampleCall.duration}</span>
              </span>
            </div>
            <ol ref={transcriptRef} className="mt-4 grid gap-1">
              {sampleCall.transcript.map((l, i) => {
                const highlight = "highlight" in l && l.highlight;
                return (
                  <li
                    key={l.time}
                    className={cn(
                      "grid grid-cols-[42px_64px_minmax(0,1fr)] items-start gap-2 rounded-xl px-2 py-2 text-[13px] transition-colors duration-500",
                      reveal(reachedI(phase, transcriptCues[i])),
                      highlight && reachedI(phase, transcriptCues[i]) && "bg-nova-100/80",
                    )}
                  >
                    <span className="font-mono text-[11.5px] text-nova-muted">{l.time}</span>
                    <span className={cn("text-[12px] font-bold", l.from === "ai" ? "text-nova-700" : "text-fuchsia-700")}>{l.from === "ai" ? "AI" : "Customer"}</span>
                    <span className="leading-snug text-nova-ink">
                      {l.text}
                      {highlight && (
                        <span className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700">
                          <Sparkles className="size-3" /> Interest expressed
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Glass>

          <div className="relative flex items-end justify-center pt-2 pb-8">
            <div ref={robotBoxRef} className="relative w-[190px]">
              <Platform className="-bottom-9 left-1/2 h-[90px] w-[270px] -translate-x-1/2" />
              <RobotSlot name="intelligence">
                <div ref={robotRef} data-nova="intelligence-story" className="will-change-transform">
                  <RobotMascot arm="rest" expression={expression} glow={false} />
                </div>
              </RobotSlot>
            </div>
            <Glass strong className={cn("absolute top-8 right-0 flex items-center gap-2 rounded-2xl px-3 py-2 sm:right-4 lg:-right-2", reveal(reachedI(phase, "summary")))}>
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-nova-500 to-nova-700 text-white">
                <Sparkles className="size-4" />
              </span>
              <span className="text-[13px] leading-tight font-bold text-nova-ink">
                Key points
                <span className="block text-[11.5px] font-medium text-nova-muted">extracted by AI</span>
              </span>
            </Glass>
          </div>
        </div>

        <div className="grid min-w-0 content-start gap-5">
          <div ref={summaryRef}>
            <Glass strong className={cn("p-4 sm:p-5 transition-shadow duration-500", reachedI(phase, "summary") && !reachedI(phase, "dropoff") && "ring-2 ring-nova-300")}>
              <p className="flex items-center gap-2 text-[16px] font-bold text-nova-ink">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-nova-100 text-nova-700">
                  <FileText className="size-4" />
                </span>
                AI call summary
              </p>
              <p className={cn("mt-3 rounded-xl bg-nova-50/70 px-3.5 py-3 text-[13.5px] leading-relaxed text-nova-body ring-1 ring-nova-100", reveal(reachedI(phase, "summary")))}>
                {sampleCall.summary}
              </p>
            </Glass>
          </div>
          <OutcomePanel phase={phase} />
          <DropOffPanel phase={phase} barsRef={barsRef} />
        </div>
      </div>

      <ul aria-hidden className="mt-12 grid gap-4 md:grid-cols-3">
        {intelligenceInsights.map((ins, i) => {
          const lit = i === HIGHLIGHT_INSIGHT && reachedI(phase, "insight");
          return (
            <li key={ins.title}>
              <Glass className={cn("flex h-full items-start gap-4 rounded-2xl p-5 transition-[box-shadow,transform] duration-500", lit && "-translate-y-1 ring-2 ring-nova-300 shadow-nova-lg")}>
                <GlowIcon icon={ins.icon} />
                <div>
                  <p className="text-[16px] font-bold text-nova-ink">{ins.title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-nova-muted">{ins.body}</p>
                </div>
              </Glass>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <PreviewTag>Illustrative simulation · one sample call plus a separate sample campaign</PreviewTag>
        {!reduced && <StoryControls paused={userPaused} onTogglePause={togglePause} onReplay={replay} label="call intelligence" />}
      </div>

      <p className="sr-only">
        Illustrative simulation. A completed sample call with {sampleCall.lead}, {sampleCall.duration} long, is reviewed line by
        line; the lead says she is interested. The AI summary reads: {sampleCall.summary} The call outcome is interested, with a
        counsellor callback as the next step. Separately, an illustrative sample of 100 non-converted calls from a campaign shows
        the reasons calls did not convert; the most common is no answer at {dropOffReasons[0].value} percent, which points to the
        insight: fix drop-off points.
      </p>
    </div>
  );
}

function Bars({ className }: { className: string }) {
  return (
    <span className="absolute inset-0 flex items-center justify-between overflow-hidden">
      {Array.from({ length: 40 }, (_, i) => (
        <span key={i} style={{ height: `${WAVE[i % WAVE.length]}%` }} className={cn("w-[3px] shrink-0 rounded-full", className)} />
      ))}
    </span>
  );
}

function OutcomePanel({ phase }: { phase: IntelPhase }) {
  const tiles = [
    { label: "Talk time", value: sampleCall.talkTime },
    { label: "Outcome", value: "Interested", accent: true },
    { label: "Next step", value: "Counsellor callback" },
    { label: "Recording", value: "Saved with transcript" },
  ];
  const on = reachedI(phase, "outcome");
  return (
    <Glass strong className="p-4 sm:p-5">
      <p className="text-[16px] font-bold text-nova-ink">Call outcome</p>
      <div className={cn("mt-3 flex items-center gap-3", reveal(on))}>
        <GlowIcon icon={Star} tone="green" className="size-10 rounded-xl" />
        <div>
          <p className="text-[15px] font-bold text-nova-ink">Interested</p>
          <p className="text-[12.5px] text-nova-muted">Lead qualified by AI</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2">
        {tiles.map((t, i) => (
          <div
            key={t.label}
            style={{ transitionDelay: on ? `${i * 90}ms` : "0ms" }}
            className={cn("rounded-xl px-3 py-2.5 ring-1", t.accent ? "bg-emerald-50 ring-emerald-100" : "bg-white ring-nova-100", reveal(on))}
          >
            <dt className="text-[11.5px] text-nova-muted">{t.label}</dt>
            <dd className={cn("mt-0.5 text-[14px] leading-tight font-bold", t.accent ? "text-emerald-700" : "text-nova-ink")}>{t.value}</dd>
          </div>
        ))}
      </dl>
    </Glass>
  );
}

function DropOffPanel({ phase, barsRef }: { phase: IntelPhase; barsRef: React.RefObject<HTMLUListElement | null> }) {
  const max = Math.max(...dropOffReasons.map((d) => d.value));
  const lit = reachedI(phase, "reason");
  return (
    <Glass strong className={cn("p-4 sm:p-5", reveal(reachedI(phase, "dropoff")))}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[16px] font-bold text-nova-ink">Why calls don&apos;t convert</p>
        <PreviewTag>Separate sample</PreviewTag>
      </div>
      <p className="mt-0.5 text-[12px] text-nova-muted">Illustrative campaign · share of 100 non-converted calls, by reason</p>
      {/* Single series → one hue, every bar directly labelled. */}
      <ul ref={barsRef} className="mt-4 grid gap-3">
        {dropOffReasons.map((d, i) => (
          <li
            key={d.reason}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_40px] items-center gap-x-3 gap-y-1 rounded-lg transition-[background-color,box-shadow] duration-500",
              i === HIGHLIGHT_REASON && lit && "bg-nova-50 ring-4 ring-nova-50",
            )}
          >
            <span className={cn("text-[13px]", i === HIGHLIGHT_REASON && lit ? "font-semibold text-nova-ink" : "text-nova-body")}>{d.reason}</span>
            <span className="text-right text-[13px] font-bold text-nova-ink tabular-nums">{d.value}%</span>
            <span className="col-span-2 h-2 overflow-hidden rounded-full bg-nova-100">
              <span style={{ width: `${(d.value / max) * 100}%` }} className="block h-full">
                <span data-bar={i} style={{ transform: "scaleX(0)" }} className="block h-full origin-left rounded-r-[4px] bg-gradient-to-r from-nova-600 to-nova-500" />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Glass>
  );
}
