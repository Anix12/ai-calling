import { easeInOut, interpolate } from "motion/react";
import type { RobotExpression } from "./robot-mascot";
import { blinkAt, bump, spring, type NovaPose } from "./nova-personality";
import { storyCues } from "./story-clock";

/**
 * Call intelligence: one master clock (seconds) drives the sample call's playback, the transcript,
 * the AI summary and outcome, the separate campaign drop-off chart, the insight highlight and NOVA.
 *
 *   0.3 completed call appears · 1.0–4.2 transcript lines (playhead 00:00 → 00:48)
 *   5.2 AI summary (NOVA points at it) · 6.0 outcome · 7.2 campaign drop-off sample, bars grow
 *   8.8 top reason highlighted · 9.6 matching insight · 10.6 dashboard settles
 *   13.6 fade · loop at 14.2
 */
export const INTEL_TOTAL = 14.2;
export const INTEL_FINAL = 12;

export const intelCues = storyCues(
  [
    ["call", 0.3],
    ["line1", 1.0],
    ["line2", 1.8],
    ["line3", 2.6],
    ["line4", 3.4],
    ["line5", 4.2],
    ["summary", 5.2],
    ["outcome", 6.0],
    ["dropoff", 7.2],
    ["reason", 8.8],
    ["insight", 9.6],
    ["settled", 10.6],
    ["reset", 13.6],
  ] as const,
  "idle",
);

export type IntelPhase = ReturnType<typeof intelCues.phaseAt>;
const { at } = intelCues;
export const reachedI = (phase: IntelPhase, target: IntelPhase) => phase !== "reset" && intelCues.reached(phase, target);
export const transcriptCues: IntelPhase[] = ["line1", "line2", "line3", "line4", "line5"];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const keys = (times: number[], values: number[]) => interpolate(times, values, { ease: easeInOut });

/** Recording playhead in seconds of the sample call (follows the transcript, 00:00 → 00:48). */
export const playheadSeconds = keys([0, at("line1"), at("line5") + 0.6], [0, 0, 48]);

/** Drop-off bars grow in one after another (0–1 for bar i). */
export const barGrow = (i: number, t: number) => easeInOut(clamp01((t - at("dropoff") - 0.2 - i * 0.18) / 0.6));

/* ------------------------------------------------------------------ */
/* NOVA                                                                 */
/* ------------------------------------------------------------------ */

/** Unit directions from NOVA's face to the transcript and to the summary, plus the pointing angle. */
export type IntelGaze = { transcript: { x: number; y: number }; summary: { x: number; y: number }; point: number };

const toTranscript = keys([0, at("line1"), at("line1") + 0.4, at("summary"), at("summary") + 0.4], [0, 0, 1, 1, 0]);
const toSummary = keys([0, at("summary"), at("summary") + 0.4, at("settled"), at("settled") + 0.5], [0, 0, 1, 1, 0]);
const pointK = keys([0, at("summary"), at("summary") + 0.45, at("outcome") + 1.0, at("outcome") + 1.5], [0, 0, 1, 1, 0]);
const cheerL = keys([0, at("insight"), at("insight") + 0.3, at("insight") + 1.0, at("insight") + 1.4], [14, 14, 130, 130, 14]);

export function intelNovaExpression(phase: IntelPhase): RobotExpression {
  if (reachedI(phase, "insight")) return "happy";
  if (reachedI(phase, "line1")) return "focused";
  return "neutral";
}

export function intelNovaPose(t: number, gaze: IntelGaze): NovaPose {
  const a = toTranscript(t);
  const b = toSummary(t);
  const reacts = [at("call"), at("summary"), at("reason"), at("insight")];
  return {
    armLeft: cheerL(t),
    armRight: -14 + (gaze.point + 14) * pointK(t),
    lookX: 5 * (gaze.transcript.x * a + gaze.summary.x * b),
    lookY: 4.5 * (gaze.transcript.y * a + gaze.summary.y * b),
    // A small reading nod on each new transcript line.
    tilt: 3 * gaze.summary.x * b + transcriptCues.reduce((s, c) => s + 3 * bump(t, at(c), 0.5), 0) + 1.2 * Math.sin((t * Math.PI * 2) / 6.5),
    bodyY: 0.8 * Math.sin((t * Math.PI * 2) / 3.4),
    lean: 0,
    antenna: 2.2 * Math.sin((t * Math.PI * 2) / 2.7) + reacts.reduce((s, r) => s + spring(t, r, 9), 0),
    blink: blinkAt(t, 6.3),
    eyeGlow: 0.15 + reacts.reduce((s, r) => s + (t >= r ? 0.5 * Math.exp(-1.6 * (t - r)) : 0), 0),
    x: 0,
    y: -8 * bump(t, at("insight"), 0.42),
  };
}
