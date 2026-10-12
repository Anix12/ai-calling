import { easeInOut, interpolate } from "motion/react";
import type { RobotExpression } from "./robot-mascot";
import { blinkAt, bump, spring, type NovaPose } from "./nova-personality";
import { storyCues } from "./story-clock";

/**
 * Bulk campaign: one master clock (seconds) drives the CSV import, the queue, each call,
 * the retry, the counters and NOVA. Calls happen one at a time.
 *
 *   0.3 file selected · 1.2 importing · 3.0 six leads added · 4.8 campaign ready
 *   5.8 NOVA starts the campaign
 *   6.6 A calling · 7.8 connected · 9.6 interested
 *   11.0 B calling · 13.2 no answer · 14.2 retry scheduled (12:04 PM, try 2 of 3)
 *   16.4 C calling · 17.6 connected · 19.4 not interested (no retry)
 *   20.6 summary · hold · 25.4 fade · loop at 26.0
 */
export const BULK_TOTAL = 26;
export const BULK_FINAL = 22.5;

export const bulkCues = storyCues(
  [
    ["file", 0.3],
    ["import", 1.2],
    ["added", 3.0],
    ["notice", 3.3],
    ["ready", 4.8],
    ["start", 5.8],
    ["callA", 6.6],
    ["connA", 7.8],
    ["interestA", 9.6],
    ["callB", 11.0],
    ["noAnswerB", 13.2],
    ["retryB", 14.2],
    ["callC", 16.4],
    ["connC", 17.6],
    ["declineC", 19.4],
    ["summary", 20.6],
    ["reset", 25.4],
  ] as const,
  "idle",
);

export type BulkPhase = ReturnType<typeof bulkCues.phaseAt>;
const { at } = bulkCues;
export const reachedB = (phase: BulkPhase, target: BulkPhase) => phase !== "reset" && bulkCues.reached(phase, target);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const keys = (times: number[], values: number[]) => interpolate(times, values, { ease: easeInOut });

/* ------------------------------------------------------------------ */
/* Import and queue                                                     */
/* ------------------------------------------------------------------ */

/** CSV import progress, 0–1. */
export const importProgress = (t: number) => easeInOut(clamp01((t - at("import")) / (at("added") - at("import"))));

/** Row i slides into the queue, one after another, once the leads are added (0–1). */
export const rowIn = (i: number, t: number) => easeInOut(clamp01((t - at("added") - i * 0.24) / 0.45));

export type LeadStatus = "pending" | "queued" | "calling" | "connected" | "interested" | "no-answer" | "retry" | "not-interested";

/** Each lead's status, as a function of the story phase (changes only at cues). */
export function leadStatus(i: number, phase: BulkPhase): LeadStatus {
  if (!reachedB(phase, "added")) return "pending";
  const r = (p: BulkPhase) => reachedB(phase, p);
  if (i === 0) return r("interestA") ? "interested" : r("connA") ? "connected" : r("callA") ? "calling" : "queued";
  if (i === 1) return r("retryB") ? "retry" : r("noAnswerB") ? "no-answer" : r("callB") ? "calling" : "queued";
  if (i === 2) return r("declineC") ? "not-interested" : r("connC") ? "connected" : r("callC") ? "calling" : "queued";
  return "queued";
}

/** Index of the lead currently on a call, or -1. */
export function activeLead(phase: BulkPhase) {
  for (let i = 0; i < 3; i++) {
    const s = leadStatus(i, phase);
    if (s === "calling" || s === "connected") return i;
  }
  return -1;
}

/**
 * Campaign counters, derived from the lead statuses so they always add up:
 * attempted = calls placed (a scheduled retry is not a call); queued = imported − attempted.
 */
export function bulkCounts(phase: BulkPhase) {
  const statuses = [0, 1, 2, 3, 4, 5].map((i) => leadStatus(i, phase));
  const imported = statuses.filter((s) => s !== "pending").length;
  const attempted = statuses.filter((s) => s !== "pending" && s !== "queued").length;
  const has = (...ss: LeadStatus[]) => statuses.filter((s) => ss.includes(s)).length;
  return {
    imported,
    attempted,
    connected: has("connected", "interested", "not-interested"),
    interested: has("interested"),
    noAnswer: has("no-answer", "retry"),
    retryScheduled: has("retry"),
    notInterested: has("not-interested"),
    queued: imported - attempted,
  };
}

/** Campaign progress through the six leads (0–1), easing forward as each call starts. */
export const campaignProgress = keys(
  [0, at("callA"), at("callA") + 0.5, at("callB"), at("callB") + 0.5, at("callC"), at("callC") + 0.5],
  [0, 0, 1 / 6, 1 / 6, 2 / 6, 2 / 6, 3 / 6],
);

/** Connector from NOVA to the queue draws itself when the campaign starts (0–1). */
export const connectorDraw = (t: number) => easeInOut(clamp01((t - at("start") - 0.2) / 0.7));

/** Retry clock hand: one sweep as the retry is scheduled (degrees). */
export const retryClockDeg = (t: number) => 360 * easeInOut(clamp01((t - at("retryB")) / 1.4));

/** Live-call energy for the active row's mini waveform. */
export function callLevel(t: number, phase: BulkPhase) {
  const i = activeLead(phase);
  if (i < 0) return 0;
  const s = leadStatus(i, phase);
  if (s === "calling") return 0.18 + 0.15 * Math.abs(Math.sin(t * Math.PI * 1.6));
  return 0.75;
}
export const barNoise = (i: number, t: number) => 0.5 + 0.5 * Math.sin(t * 9.1 + i * 1.7) * Math.sin(t * 5.3 + i * 0.63);

/* ------------------------------------------------------------------ */
/* NOVA                                                                 */
/* ------------------------------------------------------------------ */

// Points up at "Start campaign", then toward the queue; up-right at the retry; open arms to finish.
const armR = keys(
  [0, at("start"), at("start") + 0.35, at("start") + 0.8, at("start") + 1.1, at("retryB"), at("retryB") + 0.35, at("retryB") + 1.6, at("retryB") + 2.0, at("summary"), at("summary") + 0.45],
  [-14, -14, -158, -158, -96, -96, -128, -128, -96, -96, -58],
);
const armL = keys(
  [0, at("interestA"), at("interestA") + 0.3, at("interestA") + 1.0, at("interestA") + 1.4, at("summary"), at("summary") + 0.45],
  [14, 14, 130, 130, 14, 14, 58],
);
const lookX = keys(
  [0, at("notice"), at("notice") + 0.3, at("start") + 0.8, at("start") + 1.2, at("summary"), at("summary") + 0.4],
  [0, 0, -2, -2, 5, 5, 0],
);
const lookY = keys(
  [0, at("notice"), at("notice") + 0.3, at("start") + 0.8, at("start") + 1.2, at("noAnswerB"), at("noAnswerB") + 0.3, at("retryB"), at("retryB") + 0.3, at("callC"), at("callC") + 0.3],
  [0, 0, -5, -5, 0, 0, 3, 3, -2, -2, 0],
);
const tilt = keys(
  [0, at("notice"), at("notice") + 0.3, at("start") + 0.8, at("start") + 1.2, at("noAnswerB"), at("noAnswerB") + 0.35, at("retryB") + 0.2, at("retryB") + 0.5,
    at("declineC"), at("declineC") + 0.25, at("declineC") + 0.5, at("declineC") + 0.75, at("summary"), at("summary") + 0.4],
  [0, 0, -5, -5, 3, 3, 9, 9, 3, 3, -3, 3, 0, 0, 3],
);
/** Roll toward the queue while working, back home for the summary (share of rendered width). */
const roll = keys([0, at("start") + 0.4, at("start") + 1.0, at("summary"), at("summary") + 0.6], [0, 0, 0.05, 0.05, 0]);

export function bulkNovaExpression(phase: BulkPhase): RobotExpression {
  if (!reachedB(phase, "notice")) return "neutral";
  if (reachedB(phase, "summary")) return "happy";
  if (phase === "noAnswerB" || phase === "declineC") return "neutral";
  if (phase === "interestA" || phase === "ready" || phase === "start") return "happy";
  return "focused";
}
export const bulkNovaTalking = (phase: BulkPhase) => phase === "connA" || phase === "connC";

export function bulkNovaPose(t: number, width: number): NovaPose {
  const reacts = [at("notice"), at("start"), at("interestA"), at("retryB"), at("summary")];
  const talking = t >= at("connA") && t < at("interestA") - 0.3 ? true : t >= at("connC") && t < at("declineC") - 0.3;
  return {
    armLeft: armL(t),
    armRight: armR(t),
    lookX: lookX(t),
    lookY: lookY(t),
    tilt: tilt(t) + 1.2 * Math.sin((t * Math.PI * 2) / 6.5),
    bodyY: 0.8 * Math.sin((t * Math.PI * 2) / 3.4),
    lean: 0,
    antenna: 2.2 * Math.sin((t * Math.PI * 2) / 2.7) + reacts.reduce((s, r) => s + spring(t, r, 10), 0),
    blink: blinkAt(t, 3.1),
    eyeGlow: 0.15 + reacts.reduce((s, r) => s + (t >= r ? 0.55 * Math.exp(-1.6 * (t - r)) : 0), 0),
    x: roll(t) * width,
    y: -9 * bump(t, at("interestA"), 0.42) - 8 * bump(t, at("summary") + 0.1, 0.45),
    mouth: talking ? (i) => 0.3 + 0.9 * barNoise(i, t * 1.4) : () => 0.3,
  };
}
