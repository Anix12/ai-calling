import { easeInOut, interpolate } from "motion/react";
import { armAngles, type RobotExpression } from "./robot-mascot";
import { blinkAt, bump, spring, type NovaPose } from "./nova-personality";
import { storyCues } from "./story-clock";

/**
 * The Problem comparison: one master clock (seconds) drives BOTH journeys and NOVA.
 *
 *   0.3   lead arrives on both sides (10:00 AM)
 *   ──────────── manual ────────────   ───────────── LeadsZone AI ─────────────
 *   1.8   team busy                     0.9  NOVA notices · 1.8 configured delay
 *   3.4   waiting in queue              3.8  delay done → calling (10:01 AM)
 *   6.2   11:00 still awaiting          4.6  connected · 5.0–11.6 transcript
 *   9.6   2:00 PM callback attempted    11.8 interested · 12.8 CRM updated
 *   14.0  final comparison on both sides, hold, 18.0 fade, loop at 18.6
 */
export const PROBLEM_TOTAL = 18.6;
export const PROBLEM_FINAL = 15.5;

export const problemCues = storyCues(
  [
    ["arrive", 0.3],
    ["notice", 0.9],
    ["busy", 1.8],
    ["queue", 3.4],
    ["calling", 3.8],
    ["connected", 4.6],
    ["ai1", 5.0],
    ["hour", 6.2],
    ["lead1", 7.0],
    ["ai2", 8.4],
    ["callback", 9.6],
    ["lead2", 10.4],
    ["qualified", 11.8],
    ["crm", 12.8],
    ["final", 14.0],
    ["reset", 18.0],
  ] as const,
  "idle",
);

export type ProblemPhase = ReturnType<typeof problemCues.phaseAt>;
const { at } = problemCues;

/** True once the story has reached `target` and not yet faded out for the loop. */
export const reachedP = (phase: ProblemPhase, target: ProblemPhase) => phase !== "reset" && problemCues.reached(phase, target);

/* ------------------------------------------------------------------ */
/* Clocks                                                              */
/* ------------------------------------------------------------------ */

// Illustrative clock times, in minutes after 10:00 AM, keyed to the master time.
const manualMinutes = interpolate([0, at("busy"), at("queue"), at("hour"), at("callback")], [0, 2, 15, 60, 240]);
const aiMinutes = interpolate([0, at("busy"), at("calling"), at("crm")], [0, 0, 1, 3]);

const clock = (min: number) => {
  const total = 10 * 60 + Math.floor(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export const manualClock = (t: number) => clock(manualMinutes(t));
export const aiClock = (t: number) => clock(aiMinutes(t));

/** Manual side: share of the illustrated wait elapsed (0–1) and its label. */
export function manualWait(t: number) {
  const min = Math.max(0, manualMinutes(t));
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return { progress: Math.min(1, min / 240), label: h ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min` };
}

/** AI side: progress (0–1) through the configured one-minute delay. */
export const aiDelay = (t: number) => Math.min(1, Math.max(0, (t - at("busy")) / (at("calling") - at("busy"))));

/* ------------------------------------------------------------------ */
/* Call signal                                                          */
/* ------------------------------------------------------------------ */

const speech: [from: number, to: number, who: "ai" | "lead"][] = [
  [at("ai1"), at("lead1") - 0.3, "ai"],
  [at("lead1"), at("ai2") - 0.3, "lead"],
  [at("ai2"), at("lead2") - 0.3, "ai"],
  [at("lead2"), at("qualified") - 0.3, "lead"],
];
export const speaker = (t: number) => speech.find(([a, b]) => t >= a && t < b)?.[2] ?? null;

/** Waveform energy 0–1: ringing pulse, then speech, then silence. */
export function callLevel(t: number) {
  const who = speaker(t);
  if (who === "ai") return 1;
  if (who === "lead") return 0.7;
  if (t >= at("calling") && t < at("connected")) return 0.12 + 0.12 * Math.abs(Math.sin(t * Math.PI * 1.6));
  if (t >= at("connected") && t < at("qualified")) return 0.12;
  return 0.04;
}

export const barNoise = (i: number, t: number) => 0.5 + 0.5 * Math.sin(t * 9.1 + i * 1.7) * Math.sin(t * 5.3 + i * 0.63);

/* ------------------------------------------------------------------ */
/* NOVA                                                                 */
/* ------------------------------------------------------------------ */

const keys = (times: number[], values: number[]) => interpolate(times, values, { ease: easeInOut });
const [restL, restR] = armAngles.point;

// Notices the enquiry below, raises an arm, focuses while it calls, celebrates the qualified lead.
const armL = keys(
  [0, at("notice"), at("notice") + 0.35, at("busy") + 0.6, at("busy") + 1.0, at("qualified"), at("qualified") + 0.3, at("crm") + 0.4, at("crm") + 0.9],
  [restL, restL, 118, 118, restL, restL, 130, 130, restL],
);
const armR = keys(
  [0, at("calling"), at("calling") + 0.4, at("qualified"), at("qualified") + 0.3, at("crm") + 0.4, at("crm") + 0.9, at("final") + 0.4],
  [restR, restR, -40, -40, -130, -130, restR, restR],
);
const lookX = keys([0, at("notice"), at("notice") + 0.3, at("calling"), at("calling") + 0.3, at("qualified"), at("qualified") + 0.3], [0, 0, 3, 3, 4, 4, 2]);
const lookY = keys([0, at("notice"), at("notice") + 0.3, at("calling"), at("calling") + 0.3], [0, 0, 4, 4, 1]);
const tilt = keys(
  [0, at("notice"), at("notice") + 0.3, at("calling"), at("calling") + 0.3, at("qualified"), at("qualified") + 0.3, at("final")],
  [0, 0, 6, 6, -3, -3, 5, 0],
);

export function problemNovaExpression(phase: ProblemPhase): RobotExpression {
  if (!reachedP(phase, "notice")) return "neutral";
  if (reachedP(phase, "qualified")) return "happy";
  if (reachedP(phase, "calling")) return "focused";
  return "happy";
}

export const problemNovaTalking = (phase: ProblemPhase) => phase === "ai1" || phase === "ai2";

export function problemNovaPose(t: number): NovaPose {
  const breathe = 0.8 * Math.sin((t * Math.PI * 2) / 3.4);
  const reacts = [at("notice"), at("qualified"), at("crm")];
  const ai = speaker(t) === "ai";
  return {
    armLeft: armL(t),
    armRight: armR(t),
    lookX: lookX(t),
    lookY: lookY(t),
    tilt: tilt(t) + 1.2 * Math.sin((t * Math.PI * 2) / 6.5),
    bodyY: breathe,
    lean: 0.5 * Math.sin((t * Math.PI * 2) / 7.3),
    antenna: 2.2 * Math.sin((t * Math.PI * 2) / 2.7) + reacts.reduce((s, r) => s + spring(t, r, 11), 0),
    blink: blinkAt(t, 1.7),
    eyeGlow: 0.15 + reacts.reduce((s, r) => s + (t >= r ? 0.6 * Math.exp(-1.6 * (t - r)) : 0), 0),
    x: 0,
    y: -8 * bump(t, at("qualified"), 0.42) - 10 * bump(t, at("crm"), 0.45),
    mouth: ai ? (i) => 0.3 + 0.9 * barNoise(i, t * 1.4) : (_i) => 0.3,
  };
}
