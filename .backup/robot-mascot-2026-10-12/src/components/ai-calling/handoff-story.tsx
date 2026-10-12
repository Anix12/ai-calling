"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { useMotionValueEvent } from "motion/react";
import { BadgeCheck, Check, Clock3, Database, PhoneCall, Star, UserRoundCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { counsellors, crmRecord, handoffConversation, handoffSteps } from "@/data/ai-calling";
import { Avatar, Glass, GlowIcon, Platform, PreviewTag, RobotSlot, StatusPill } from "./primitives";
import { ChatBubble } from "./call-ui";
import { RobotMascot } from "./robot-mascot";
import { useNovaWriter } from "./animated-nova";
import { useStoryClock } from "./story-clock";
import { StoryControls } from "./story-controls";
import {
  HANDOFF_FINAL,
  HANDOFF_TOTAL,
  cardFrame,
  crmCues,
  handPoint,
  handoffCues,
  handoffNovaExpression,
  handoffNovaPose,
  handoffNovaTalking,
  lineCues,
  reachAngle,
  reachedH,
  stepCues,
  type HandoffGaze,
  type HandoffPhase,
  type HandoffScene,
} from "./handoff-timeline";

const r2 = (n: number) => Math.round(n * 100) / 100;
const reveal = (on: boolean) =>
  cn("transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none", on ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0");

/**
 * Hot lead handoff as one synchronized simulation. A single story clock drives the end of the AI
 * call, NOVA handing the interested-lead card to the counsellor list, the round-robin assignment and
 * the CRM record. The card's path is computed from measured layout (NOVA's hand → the assigned
 * counsellor's row) on mount and resize, never per frame.
 */
export function HandoffStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { time, phase, reduced, userPaused, replay, togglePause } = useStoryClock(rootRef, {
    total: HANDOFF_TOTAL,
    finalFrame: HANDOFF_FINAL,
    phaseAt: handoffCues.phaseAt,
    amount: 0.2,
  });

  const robotRef = useRef<HTMLDivElement>(null);
  const robotBoxRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const targetRowRef = useRef<HTMLLIElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scale = useRef(1);
  const gaze = useRef<HandoffGaze>({ chat: { x: -1, y: 0 }, team: { x: 1, y: 0 }, reach: -96 });
  const scene = useRef<HandoffScene | null>(null);
  const writeNova = useNovaWriter(robotRef, scale);

  const apply = useCallback(
    (t: number) => {
      writeNova(handoffNovaPose(t, gaze.current));
      const s = scene.current;
      const card = cardRef.current;
      if (s && card) {
        const f = cardFrame(t, s);
        card.style.transform = `translate3d(${r2(f.x)}px, ${r2(f.y)}px, 0) rotate(${r2(f.rotate)}deg) scale(${r2(f.scale)})`;
        card.style.opacity = String(r2(f.opacity));
      }
    },
    [writeNova],
  );

  useMotionValueEvent(time, "change", apply);

  // Layout-aware geometry: gaze directions, reach angle and the card's start/end points.
  const measure = useCallback(() => {
    const root = rootRef.current;
    const box = robotBoxRef.current;
    if (!root || !box) return;
    const rr = root.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    const k = b.width / 200;
    scale.current = Math.max(0.1, k);
    const face = { x: b.left + b.width / 2, y: b.top + b.height * 0.3 };
    const centre = (el: Element | null) => {
      const r = el?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    };
    const unit = (p: { x: number; y: number } | null, fallback: { x: number; y: number }) => {
      if (!p) return fallback;
      const dx = p.x - face.x;
      const dy = p.y - face.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: dx / len, y: dy / len };
    };
    const row = centre(targetRowRef.current);
    // The reach points from the shoulder (SVG 146,138) toward the assigned counsellor's row.
    const shoulder = { x: b.left + 146 * k, y: b.top + 138 * k };
    const reach = row ? reachAngle({ x: row.x - shoulder.x, y: row.y - shoulder.y }) : -96;
    gaze.current = { chat: unit(centre(chatRef.current), { x: -1, y: 0 }), team: unit(row ?? centre(teamRef.current), { x: 1, y: 0 }), reach };
    const hand = handPoint(reach);
    if (row) {
      scene.current = {
        from: { x: b.left - rr.left + hand.x * k, y: b.top - rr.top + hand.y * k },
        to: { x: row.x - rr.left, y: row.y - rr.top },
        cardW: cardRef.current?.offsetWidth ?? 190,
        cardH: cardRef.current?.offsetHeight ?? 56,
      };
    }
    apply(time.get());
  }, [apply, time]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const expression = handoffNovaExpression(phase);
  const talking = handoffNovaTalking(phase);
  useLayoutEffect(() => apply(time.get()), [expression, talking, apply, time]);

  const assigned = reachedH(phase, "assigned");
  const final = reachedH(phase, "final");

  return (
    <div ref={rootRef} data-handoff-phase={phase} className="relative min-w-0">
      <div aria-hidden className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)] lg:gap-5">
        <div ref={chatRef} className="min-w-0">
          <ConversationPanel phase={phase} />
        </div>

        {/* NOVA qualifies the lead and passes it on */}
        <div className="flex min-w-0 flex-col items-center gap-6 lg:pt-6">
          <Glass strong className={cn("flex items-center gap-3 rounded-2xl px-3.5 py-3 lg:rotate-[-3deg]", reveal(reachedH(phase, "qualified")))}>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
              <Star className="size-5" fill="currentColor" />
            </span>
            <span className="text-[14px] leading-tight font-bold text-nova-ink">
              Interested lead
              <span className="flex items-center gap-1 text-[12px] font-medium text-nova-muted">
                <BadgeCheck className="size-3.5 text-nova-600" /> Qualified by AI
              </span>
            </span>
          </Glass>
          <div ref={robotBoxRef} className="relative w-[170px]">
            <Platform className="-bottom-9 left-1/2 h-[90px] w-[260px] -translate-x-1/2" />
            <RobotSlot name="handoff">
              <div ref={robotRef} data-nova="handoff-story" className="will-change-transform">
                <RobotMascot arm="rest" expression={expression} talking={talking} glow={false} />
              </div>
            </RobotSlot>
          </div>
        </div>

        <div ref={teamRef} className="grid min-w-0 gap-5">
          <CounsellorPanel assigned={assigned} targetRowRef={targetRowRef} />
          <CrmPanel phase={phase} />
        </div>
      </div>

      {/* The interested-lead card NOVA hands to the team (positioned per frame) */}
      <div
        ref={cardRef}
        aria-hidden
        data-anim="handoff-card"
        style={{ opacity: 0 }}
        className="pointer-events-none absolute top-0 left-0 z-30 flex w-[190px] items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-nova-lg ring-2 ring-nova-300 will-change-transform"
      >
        <Avatar name="Priya Nair" tone={1} className="size-8 text-[11px]" />
        <span className="min-w-0 text-[12.5px] leading-tight font-bold text-nova-ink">
          Priya Nair
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <Star className="size-3" fill="currentColor" /> Interested
          </span>
        </span>
      </div>

      <p
        aria-hidden
        className={cn(
          "mx-auto mt-8 flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-nova-600 to-nova-500 px-5 py-2.5 text-[15px] font-bold text-white shadow-nova-glow",
          reveal(final),
        )}
      >
        <Users className="size-4" /> AI qualifies. Your team follows up.
      </p>

      <StepStrip phase={phase} />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <PreviewTag>Illustrative simulation · sample lead and team</PreviewTag>
        {!reduced && <StoryControls paused={userPaused} onTogglePause={togglePause} onReplay={replay} label="lead handoff" />}
      </div>

      <p className="sr-only">
        Illustrative simulation. The AI finishes a call with Priya Nair, who says she is interested, and marks her as a qualified,
        interested lead. NOVA hands the lead to the team: by round-robin, the next counsellor in rotation, Neha Gupta, is
        assigned. The CRM record is updated with status interested, assigned to Neha Gupta, a pending follow-up for tomorrow at
        10:00 AM, and the call notes. AI qualifies; your team follows up.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panels                                                               */
/* ------------------------------------------------------------------ */

function ConversationPanel({ phase }: { phase: HandoffPhase }) {
  const completed = reachedH(phase, "completed");
  return (
    <Glass strong data-anim="handoff-conversation" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500 to-nova-700 text-white">
            <PhoneCall className="size-4" />
          </span>
          <p className="text-[16px] font-bold whitespace-nowrap text-nova-ink">AI conversation</p>
        </div>
        <StatusPill tone={completed ? "slate" : "green"} className="px-2 text-[11px]">
          {completed ? (
            <>
              <Check className="size-3" strokeWidth={3} /> Call completed
            </>
          ) : (
            <>
              <Clock3 className="size-3" /> 02:14
            </>
          )}
        </StatusPill>
      </div>
      <div className="mt-4 grid gap-2.5">
        {handoffConversation.map((l, i) => (
          <div key={i} className={reveal(reachedH(phase, lineCues[i]))}>
            <ChatBubble from={l.from} withIcon={l.from === "ai" ? true : "Priya Nair"} highlight={i === 3 && reachedH(phase, "yes")}>
              {l.text}
            </ChatBubble>
          </div>
        ))}
      </div>
    </Glass>
  );
}

function CounsellorPanel({ assigned, targetRowRef }: { assigned: boolean; targetRowRef: React.RefObject<HTMLLIElement | null> }) {
  const state = (i: number) => (assigned ? ["Assigned", "Next in rotation", "In rotation"][i] : ["Next in rotation", "In rotation", "In rotation"][i]);
  return (
    <Glass strong data-anim="counsellor-assignment" className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500 to-nova-700 text-white">
          <UserRoundCheck className="size-4" />
        </span>
        <div>
          <p className="text-[16px] font-bold text-nova-ink">Assign to counsellor</p>
          <p className="text-[12px] text-nova-muted">Round-robin · next in rotation</p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2">
        {counsellors.map((c, i) => {
          const s = state(i);
          return (
            <li
              key={c.name}
              ref={i === 0 ? targetRowRef : undefined}
              data-state={s}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-2.5 py-2 transition-[background-color,box-shadow] duration-500",
                s === "Assigned" ? "bg-nova-50 shadow-[0_8px_22px_-14px_rgb(124_58_237/0.9)] ring-2 ring-nova-300" : s === "Next in rotation" ? "ring-1 ring-nova-200" : "ring-1 ring-nova-100/70",
              )}
            >
              <Avatar name={c.name} tone={i + 1} className="size-9 text-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-nova-ink">{c.name}</p>
                <p className="truncate text-[12px] text-nova-muted">{c.role}</p>
              </div>
              <StatusPill tone={s === "Assigned" ? "violet" : s === "Next in rotation" ? "blue" : "slate"} className="px-2 text-[11px]">
                {s}
              </StatusPill>
            </li>
          );
        })}
      </ul>
    </Glass>
  );
}

function CrmPanel({ phase }: { phase: HandoffPhase }) {
  return (
    <Glass strong data-anim="crm-record" className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500 to-nova-700 text-white">
            <Database className="size-4" />
          </span>
          <p className="text-[16px] font-bold text-nova-ink">{reachedH(phase, "crm4") ? "CRM updated" : "CRM record"}</p>
        </div>
        <PreviewTag>Sample</PreviewTag>
      </div>
      <dl className="mt-4 grid gap-2.5">
        {crmRecord.map((r, i) => {
          const on = reachedH(phase, crmCues[i]);
          return (
            <div key={r.label} className="grid grid-cols-[84px_minmax(0,1fr)] items-start gap-2.5">
              <dt className="pt-1.5 text-[12.5px] text-nova-muted">{r.label}</dt>
              <dd
                className={cn(
                  "rounded-xl px-3 py-1.5 text-[13px] leading-snug font-semibold ring-1 transition-[background-color,color,box-shadow] duration-500",
                  on ? "bg-white text-nova-ink ring-nova-200" : "bg-nova-50/60 text-transparent ring-nova-100",
                  on && i === 0 && "text-emerald-700",
                  on && i === 2 && "text-amber-700",
                )}
              >
                {r.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </Glass>
  );
}

function StepStrip({ phase }: { phase: HandoffPhase }) {
  return (
    <ol aria-hidden className="mt-10 grid gap-4 sm:grid-cols-2">
      {handoffSteps.map((s, i) => {
        const done = reachedH(phase, stepCues[i]);
        const current = done && (i === handoffSteps.length - 1 || !reachedH(phase, stepCues[i + 1]));
        return (
          <li key={s.title} data-anim={`handoff-step-${i + 1}`} className="relative">
            <Glass
              className={cn(
                "flex h-full items-start gap-3.5 rounded-2xl p-4 transition-[opacity,box-shadow] duration-500",
                !done && "opacity-50",
                current && "ring-2 ring-nova-300",
              )}
            >
              <GlowIcon icon={s.icon} tone={i === 1 ? "green" : "solid"} />
              <div>
                <p className="flex items-center gap-2 text-[15px] font-bold text-nova-ink">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-nova-600 text-[11px] text-white">{i + 1}</span>
                  {s.title}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-nova-muted">{s.body}</p>
              </div>
            </Glass>
          </li>
        );
      })}
    </ol>
  );
}
