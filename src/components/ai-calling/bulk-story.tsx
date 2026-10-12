"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion, useMotionValueEvent } from "motion/react";
import { Check, Clock3, FileSpreadsheet, PhoneCall, Play, RefreshCw, Rocket, Star, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { bulkSetup, bulkStory } from "@/data/ai-calling";
import { Avatar, Glass, Platform, PreviewTag, RobotSlot, StatusPill } from "./primitives";
import { RobotMascot } from "./robot-mascot";
import { useNovaWriter } from "./animated-nova";
import { useStoryClock } from "./story-clock";
import { StoryControls } from "./story-controls";
import {
  BULK_FINAL,
  BULK_TOTAL,
  activeLead,
  barNoise,
  bulkCounts,
  bulkCues,
  bulkNovaExpression,
  bulkNovaPose,
  bulkNovaTalking,
  callLevel,
  campaignProgress,
  connectorDraw,
  importProgress,
  leadStatus,
  reachedB,
  retryClockDeg,
  rowIn,
  type BulkPhase,
  type LeadStatus,
} from "./bulk-timeline";

const r2 = (n: number) => Math.round(n * 1000) / 1000;
const reveal = (on: boolean) =>
  cn("transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none", on ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0");
const leads = bulkStory.leads;

const statusView: Record<Exclude<LeadStatus, "pending">, { label: string; tone: "violet" | "green" | "blue" | "rose" | "amber" | "slate" }> = {
  queued: { label: "Queued", tone: "slate" },
  calling: { label: "Calling…", tone: "violet" },
  connected: { label: "Connected", tone: "green" },
  interested: { label: "Interested", tone: "blue" },
  "no-answer": { label: "No answer", tone: "amber" },
  retry: { label: "Retry scheduled", tone: "amber" },
  "not-interested": { label: "Not interested", tone: "rose" },
};

/**
 * Bulk campaign simulation. One story clock drives the import, the queue, each call, the retry,
 * the counters and NOVA. Continuous values (import bar, row slide-in, progress, connector, retry
 * clock, waveform, robot pose) are written to the DOM per frame; React re-renders only at cues.
 */
export function BulkStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { time, phase, reduced, userPaused, replay, togglePause } = useStoryClock(rootRef, {
    total: BULK_TOTAL,
    finalFrame: BULK_FINAL,
    phaseAt: bulkCues.phaseAt,
    amount: 0.2,
  });

  const robotRef = useRef<HTMLDivElement>(null);
  const robotBoxRef = useRef<HTMLDivElement>(null);
  const scale = useRef(1);
  const robotW = useRef(170);
  const writeNova = useNovaWriter(robotRef, scale);
  const importBarRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const connectorRefs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];
  const queueRef = useRef<HTMLUListElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const apply = useCallback(
    (t: number) => {
      writeNova(bulkNovaPose(t, robotW.current));
      if (importBarRef.current) importBarRef.current.style.transform = `scaleX(${r2(importProgress(t))})`;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${r2(campaignProgress(t))})`;
      const c = r2(connectorDraw(t));
      if (connectorRefs[0].current) connectorRefs[0].current.style.transform = `scaleX(${c})`;
      if (connectorRefs[1].current) connectorRefs[1].current.style.transform = `scaleY(${c})`;
      const queue = queueRef.current;
      if (queue) {
        queue.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
          const k = rowIn(Number(row.dataset.row), t);
          row.style.opacity = String(r2(k));
          row.style.transform = k < 1 ? `translate3d(${r2((1 - k) * 28)}px, 0, 0)` : "";
        });
        const level = callLevel(t, phaseRef.current);
        queue.querySelectorAll<HTMLElement>("[data-mini-wave] > span").forEach((bar, i) => {
          bar.style.transform = `scaleY(${r2(0.15 + 0.85 * level * (0.35 + 0.65 * barNoise(i, t)))})`;
        });
        queue.querySelectorAll<HTMLElement>("[data-retry-hand]").forEach((hand) => (hand.style.transform = `rotate(${r2(retryClockDeg(t))}deg)`));
      }
    },
    // connectorRefs holds stable useRef objects, so the first render's copy stays valid.
    [writeNova],
  );

  useMotionValueEvent(time, "change", apply);

  // Robot size (for roll distance and wheel rotation): measured on mount and resize only.
  useLayoutEffect(() => {
    const box = robotBoxRef.current;
    if (!box) return;
    const measure = () => {
      robotW.current = box.offsetWidth;
      scale.current = Math.max(0.1, box.offsetWidth / 200);
      apply(time.get());
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [apply, time]);

  const expression = bulkNovaExpression(phase);
  const talking = bulkNovaTalking(phase);
  // React resets transforms when the robot or the rows re-render; re-apply this frame right away.
  useLayoutEffect(() => apply(time.get()), [phase, expression, talking, apply, time]);

  const counts = bulkCounts(phase);

  return (
    <div ref={rootRef} data-bulk-phase={phase} className="min-w-0">
      <div aria-hidden className="relative grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-6">
        <div className="flex flex-col gap-5">
          <SetupPanel phase={phase} importBarRef={importBarRef} />

          {/* NOVA orchestrates the campaign; the connector links it to the queue */}
          <div className="relative mx-auto flex w-full max-w-[300px] flex-col items-center gap-3 pt-2 pb-10">
            <Glass strong className={cn("flex items-center gap-2 rounded-2xl px-3 py-2", reveal(reachedB(phase, "added")))}>
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-nova-100 text-nova-700">
                  <FileSpreadsheet className="size-4" />
                </span>
                <span className="text-[13px] leading-tight font-bold text-nova-ink">
                  6 sample leads
                  <span className="block text-[11.5px] font-medium text-emerald-600">{reachedB(phase, "start") ? "Campaign running" : "Ready to call"}</span>
                </span>
              </Glass>
            <div ref={robotBoxRef} className="relative w-[160px] sm:w-[170px]">
              <Platform className="-bottom-9 left-1/2 h-[90px] w-[250px] -translate-x-1/2" />
              <RobotSlot name="bulk-sort">
                <div ref={robotRef} data-nova="bulk-story" className="will-change-transform">
                  <RobotMascot arm="rest" expression={expression} talking={talking} glow={false} />
                </div>
              </RobotSlot>
            </div>
            {/* Desktop: horizontal link into the queue column */}
            <span className="absolute top-[62%] left-[calc(50%+70px)] hidden h-[3px] w-[calc(50%-46px)] overflow-hidden rounded-full bg-nova-200/60 lg:block">
              <span
                ref={connectorRefs[0]}
                style={{ transform: "scaleX(0)" }}
                className="block h-full origin-left rounded-full bg-[repeating-linear-gradient(90deg,var(--color-nova-500)_0_8px,transparent_8px_14px)]"
              />
            </span>
            {/* Stacked layouts: short vertical link down to the queue */}
            <span className="absolute -bottom-5 left-1/2 h-10 w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-nova-200/60 lg:hidden">
              <span
                ref={connectorRefs[1]}
                style={{ transform: "scaleY(0)" }}
                className="block h-full origin-top rounded-full bg-[repeating-linear-gradient(180deg,var(--color-nova-500)_0_8px,transparent_8px_14px)]"
              />
            </span>

          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <QueuePanel phase={phase} queueRef={queueRef} progressRef={progressRef} />
          <SummaryPanel counts={counts} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <PreviewTag>Illustrative simulation · sample campaign, no real calls or uploads</PreviewTag>
        {!reduced && <StoryControls paused={userPaused} onTogglePause={togglePause} onReplay={replay} label="bulk campaign" />}
      </div>

      <p className="sr-only">
        Illustrative simulation of a bulk campaign called {bulkStory.campaign}. Six sample leads are imported from a CSV file and
        the campaign starts at {bulkStory.startedAt}. The AI calls one lead at a time: {leads[0].name} answers and is interested,
        and the outcome is recorded. {leads[1].name} does not answer, so a retry is scheduled for {leads[1].retryAt}, try 2 of 3,
        under the campaign&apos;s retry rule; it has not been called again yet. {leads[2].name} answers and is not interested; the
        outcome is recorded and no retry is scheduled. Three leads remain queued. Summary: 6 imported, 3 attempted, 2 connected,
        1 interested, 1 not interested, 1 no answer with a retry scheduled, 3 still queued.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Setup                                                                */
/* ------------------------------------------------------------------ */

function SetupPanel({ phase, importBarRef }: { phase: BulkPhase; importBarRef: React.RefObject<HTMLSpanElement | null> }) {
  const added = reachedB(phase, "added");
  const importing = reachedB(phase, "import") && !added;
  const started = reachedB(phase, "start");
  const status = started ? "Running" : reachedB(phase, "ready") ? "Ready" : "Draft";
  return (
    <Glass strong data-anim="campaign-setup" className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500 to-nova-700 text-white">
            <Rocket className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] leading-tight font-bold text-nova-ink">{bulkStory.campaign}</p>
            <p className="text-[11.5px] text-nova-muted">Source: CSV import</p>
          </div>
        </div>
        <StatusPill tone={started ? "green" : status === "Ready" ? "violet" : "slate"} className="shrink-0 px-2 text-[11px]">
          {status}
        </StatusPill>
      </div>

      <div
        className={cn(
          "mt-4 rounded-2xl border-2 border-dashed px-3.5 py-3 transition-colors duration-500",
          added ? "border-emerald-300 bg-emerald-50/60" : reachedB(phase, "file") ? "border-nova-400 bg-nova-50" : "border-nova-200 bg-nova-50/40",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-nova-600 shadow-nova">
            {added ? <Check className="size-4 text-emerald-600" strokeWidth={3} /> : <Upload className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-nova-ink">{reachedB(phase, "file") ? bulkStory.file : "Choose a CSV file"}</p>
            <p className="text-[11.5px] text-nova-muted">
              {added ? "6 sample leads added · columns mapped" : importing ? "Importing sample leads…" : reachedB(phase, "file") ? "CSV selected" : "Sample file"}
            </p>
          </div>
        </div>
        <span className="mt-2.5 block h-1 overflow-hidden rounded-full bg-white">
          <span ref={importBarRef} style={{ transform: "scaleX(0)" }} className="block h-full origin-left rounded-full bg-gradient-to-r from-nova-500 to-emerald-500" />
        </span>
      </div>

      <ul className="mt-3 grid gap-1.5">
        {bulkSetup.map(({ label, value, icon: Icon }) => (
          <li key={label} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 ring-1 ring-nova-100">
            <Icon className="size-3.5 shrink-0 text-nova-600" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-nova-ink">{label}</p>
              <p className="text-[11.5px] leading-snug text-nova-muted">{value}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Visual only — not a working control */}
      <span
        className={cn(
          "mt-3 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-[background-color,color,box-shadow,transform] duration-300",
          started
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : reachedB(phase, "ready")
              ? "bg-gradient-to-r from-nova-600 to-nova-500 text-white shadow-nova-glow"
              : "bg-nova-100 text-nova-400",
          phase === "start" && "scale-[0.97]",
        )}
      >
        {started ? <Check className="size-4" strokeWidth={3} /> : <Play className="size-4" />}
        {started ? `Campaign started · ${bulkStory.startedAt}` : "Start campaign"}
      </span>
    </Glass>
  );
}

/* ------------------------------------------------------------------ */
/* Queue                                                                */
/* ------------------------------------------------------------------ */

function rowNote(i: number, s: LeadStatus) {
  const lead = leads[i];
  if (s === "interested") return "Outcome saved to CRM";
  if (s === "not-interested") return "Outcome recorded · no retry";
  if (s === "retry" && "retryAt" in lead) return `Retry 2 of 3 · ${lead.retryAt}`;
  if (s === "no-answer") return `Called ${"calledAt" in lead ? lead.calledAt : ""} · no answer`;
  if ((s === "calling" || s === "connected") && "calledAt" in lead) return `Called ${lead.calledAt}`;
  return lead.phone;
}

function QueuePanel({
  phase,
  queueRef,
  progressRef,
}: {
  phase: BulkPhase;
  queueRef: React.RefObject<HTMLUListElement | null>;
  progressRef: React.RefObject<HTMLSpanElement | null>;
}) {
  const active = activeLead(phase);
  const counts = bulkCounts(phase);
  return (
    <Glass strong data-anim="calling-queue" className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500 to-nova-700 text-white">
            <PhoneCall className="size-4" />
          </span>
          <p className="text-[16px] font-bold text-nova-ink">
            Calling queue <span className="text-[13px] font-medium text-nova-muted">({counts.imported} leads)</span>
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full bg-gradient-to-r from-nova-600 to-nova-500 px-3 py-1 text-[12px] font-semibold text-white", reveal(reachedB(phase, "start")))}>
          One call at a time
        </span>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[11.5px] text-nova-muted">
          <span>Campaign progress</span>
          <span className="font-semibold text-nova-ink tabular-nums">
            {counts.attempted} of 6 attempted
          </span>
        </div>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-nova-100">
          <span ref={progressRef} style={{ transform: "scaleX(0)" }} className="block h-full origin-left rounded-full bg-gradient-to-r from-nova-500 to-nova-pink" />
        </span>
      </div>
      <ul ref={queueRef} className="mt-3 grid gap-1">
        {leads.map((lead, i) => {
          const s = leadStatus(i, phase);
          const live = i === active;
          return (
            <li
              key={lead.name}
              data-row={i}
              data-status={s}
              style={{ opacity: 0 }}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-2 py-2 transition-[background-color,box-shadow] duration-300 will-change-transform",
                live && "bg-nova-50 shadow-[0_8px_20px_-14px_rgb(124_58_237/0.8)] ring-1 ring-nova-200",
                s === "retry" && "bg-amber-50/60 ring-1 ring-amber-100",
              )}
            >
              <Avatar name={lead.name} tone={i} className="size-9 text-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-nova-ink">{lead.name}</p>
                <p className={cn("truncate text-[11.5px]", s === "retry" ? "font-semibold text-amber-700" : "font-mono text-nova-muted")}>{rowNote(i, s)}</p>
                {/* Phones: status under the name so nothing is clipped */}
                <span className="mt-1 flex items-center gap-1.5 sm:hidden">
                  <RowPill status={s} />
                  {s === "retry" && <RetryClock />}
                </span>
              </div>
              <span className="hidden sm:inline-flex">
                <RowPill status={s} />
              </span>
              <span className="hidden w-8 justify-center sm:flex">
                {live && (
                  <span data-mini-wave className="flex h-5 items-center gap-[2px]">
                    {[0, 1, 2, 3, 4].map((b) => (
                      <span key={b} style={{ transform: "scaleY(0.2)" }} className="h-full w-[3px] rounded-full bg-gradient-to-t from-nova-600 to-nova-pink" />
                    ))}
                  </span>
                )}
                {s === "retry" && <RetryClock />}
              </span>
            </li>
          );
        })}
      </ul>
    </Glass>
  );
}

function RowPill({ status: s }: { status: LeadStatus }) {
  const view = s === "pending" ? statusView.queued : statusView[s];
  return (
    <StatusPill tone={view.tone} className="px-2 text-[11.5px]">
      {s === "interested" && <Star className="size-3" fill="currentColor" />}
      {s === "not-interested" && <X className="size-3" strokeWidth={3} />}
      {s === "retry" && <RefreshCw className="size-3" />}
      {view.label}
    </StatusPill>
  );
}

/** Small clock whose hand sweeps once as the retry is scheduled (hand rotated per frame). */
function RetryClock() {
  return (
    <span className="relative inline-flex size-6 items-center justify-center rounded-full bg-white ring-2 ring-amber-400">
      <Clock3 className="absolute size-4 text-amber-200" strokeWidth={1.5} />
      <span data-retry-hand className="absolute inset-0 flex justify-center will-change-transform">
        <span className="mt-[4px] h-[8px] w-[2px] rounded-full bg-amber-600" />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Summary                                                              */
/* ------------------------------------------------------------------ */

function SummaryPanel({ counts }: { counts: ReturnType<typeof bulkCounts> }) {
  const items: { label: string; value: number; tone?: string }[] = [
    { label: "Imported", value: counts.imported },
    { label: "Attempted", value: counts.attempted },
    { label: "Connected", value: counts.connected },
    { label: "Interested", value: counts.interested, tone: "text-sky-700" },
    { label: "Not interested", value: counts.notInterested, tone: "text-rose-700" },
    { label: "No answer", value: counts.noAnswer, tone: "text-amber-700" },
    { label: "Retry scheduled", value: counts.retryScheduled, tone: "text-amber-700" },
    { label: "Still queued", value: counts.queued },
  ];
  return (
    <Glass strong data-anim="campaign-summary" className="px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-semibold tracking-wide text-nova-muted uppercase">Campaign summary</p>
        <PreviewTag>Sample data</PreviewTag>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((m) => (
          <div key={m.label} className="rounded-xl bg-white px-3 py-2 ring-1 ring-nova-100">
            <dd className={cn("h-7 overflow-hidden text-[22px] leading-7 font-bold tracking-tight tabular-nums", m.tone ?? "text-nova-ink")}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={m.value}
                  className="inline-block"
                  initial={{ y: "70%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-70%", opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {m.value}
                </motion.span>
              </AnimatePresence>
            </dd>
            <dt className="text-[11.5px] text-nova-muted">{m.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 text-[11.5px] leading-snug text-nova-muted">
        Attempted counts calls placed. A scheduled retry has not been called yet.
      </p>
    </Glass>
  );
}
