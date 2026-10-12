import { easeInOut, interpolate } from "motion/react";
import type { RobotExpression } from "./robot-mascot";
import { blinkAt, bump, spring, type NovaPose } from "./nova-personality";
import { storyCues } from "./story-clock";

/**
 * Multilingual demo: one master clock (seconds) per selected language. Choosing a language
 * restarts it from 0, so the halo sweep, the conversation, the waveform and NOVA always agree.
 *
 *   0.0–1.3 halo sweeps once around the orbit and lands on the chosen language
 *   0.3 NOVA acknowledges (double blink, hop) · 1.4 connecting · 2.4 connected
 *   2.8 AI · 5.0 lead · 6.8 AI · 9.0 lead · 10.4 call complete → friendly wave
 *   13.6 fade · loop at 14.2
 */
export const LANG_TOTAL = 14.2;
export const LANG_FINAL = 12;

export const langCues = storyCues(
  [
    ["ack", 0.3],
    ["connecting", 1.4],
    ["connected", 2.4],
    ["ai1", 2.8],
    ["lead1", 5.0],
    ["ai2", 6.8],
    ["lead2", 9.0],
    ["done", 10.4],
    ["reset", 13.6],
  ] as const,
  "select",
);

export type LangPhase = ReturnType<typeof langCues.phaseAt>;
const { at } = langCues;
export const reachedL = (phase: LangPhase, target: LangPhase) => phase !== "reset" && langCues.reached(phase, target);

/** Phase at which conversation line i appears. */
export const lineCues: LangPhase[] = ["ai1", "lead1", "ai2", "lead2"];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const keys = (times: number[], values: number[]) => interpolate(times, values, { ease: easeInOut });

/* ------------------------------------------------------------------ */
/* Orbit halo                                                          */
/* ------------------------------------------------------------------ */

const SWEEP = 1.3;

/**
 * Halo strength (0–1) for a language `offset` steps after the selected one (0…count−1).
 * One gentle pass around the ring that comes to rest on the selected language; labels never move.
 */
export function haloAt(t: number, offset: number, count: number) {
  if (t >= SWEEP) return 0;
  const pos = (easeInOut(clamp01(t / SWEEP)) * count) % count;
  const d = Math.min(Math.abs(pos - offset), count - Math.abs(pos - offset));
  return Math.max(0, 1 - d / 0.9) * (1 - clamp01((t - SWEEP + 0.25) / 0.25));
}

/* ------------------------------------------------------------------ */
/* Call signal                                                          */
/* ------------------------------------------------------------------ */

const speech: [number, number, "ai" | "lead"][] = [
  [at("ai1"), at("lead1") - 0.4, "ai"],
  [at("lead1"), at("ai2") - 0.4, "lead"],
  [at("ai2"), at("lead2") - 0.4, "ai"],
  [at("lead2"), at("done") - 0.4, "lead"],
];
export const speaker = (t: number) => speech.find(([a, b]) => t >= a && t < b)?.[2] ?? null;
export const barNoise = (i: number, t: number) => 0.5 + 0.5 * Math.sin(t * 9.1 + i * 1.7) * Math.sin(t * 5.3 + i * 0.63);

export function callLevel(t: number) {
  const who = speaker(t);
  if (who === "ai") return 1;
  if (who === "lead") return 0.7;
  if (t >= at("connecting") && t < at("connected")) return 0.12 + 0.12 * Math.abs(Math.sin(t * Math.PI * 1.6));
  if (t >= at("connected") && t < at("done")) return 0.12;
  return 0.04;
}

/** Seconds on the call clock (from "connected", frozen when the call completes). */
export const callSeconds = (t: number) => Math.max(0, Math.min(t, at("done")) - at("connected"));

export function callStatus(phase: LangPhase) {
  if (reachedL(phase, "done")) return "Call complete";
  if (reachedL(phase, "connected")) return "Connected";
  if (reachedL(phase, "connecting")) return "Connecting…";
  return "Language selected";
}

/* ------------------------------------------------------------------ */
/* NOVA                                                                 */
/* ------------------------------------------------------------------ */

/** Unit directions from NOVA's face to the selected language and to the conversation panel. */
export type Gaze = { lang: { x: number; y: number }; panel: { x: number; y: number } };

// 0 → look at the language, 1 → look at the conversation, back to centre for the wave.
const toPanel = keys([0, at("connecting"), at("connecting") + 0.5, at("done"), at("done") + 0.4], [0, 0, 1, 1, 0]);
const toLang = keys([0, 0.25, at("connecting"), at("connecting") + 0.5], [0, 1, 1, 0]);
const armR = keys(
  [0, at("ack"), at("ack") + 0.35, at("ack") + 1.0, at("ack") + 1.4, at("done"), at("done") + 0.3, at("done") + 0.5, at("done") + 0.7, at("done") + 0.9, at("done") + 1.1, at("done") + 1.5],
  [-14, -14, -70, -70, -14, -14, -150, -122, -150, -122, -140, -125],
);
/** 0–1 "listening" weight while the lead speaks, eased in and out over 0.3 s. */
const tiltK = (() => {
  const samples = speech.filter(([, , w]) => w === "lead");
  return (t: number) => samples.reduce((s, [a, b]) => s + clamp01((t - a) / 0.3) * (1 - clamp01((t - b) / 0.3)), 0);
})();

export function langNovaExpression(phase: LangPhase): RobotExpression {
  if (phase === "select") return "neutral";
  if (phase === "ack" || reachedL(phase, "done")) return "happy";
  return "focused";
}
export const langNovaTalking = (phase: LangPhase) => phase === "ai1" || phase === "ai2";

export function langNovaPose(t: number, gaze: Gaze): NovaPose {
  const l = toLang(t);
  const p = toPanel(t);
  const reacts = [at("ack"), at("done")];
  return {
    armLeft: 14,
    armRight: armR(t),
    lookX: 5 * (gaze.lang.x * l + gaze.panel.x * p),
    lookY: 4.5 * (gaze.lang.y * l + gaze.panel.y * p),
    tilt: 4 * gaze.lang.x * l + 7 * tiltK(t) + 1.2 * Math.sin((t * Math.PI * 2) / 6.5),
    bodyY: 0.8 * Math.sin((t * Math.PI * 2) / 3.4),
    lean: 0,
    antenna: 2.2 * Math.sin((t * Math.PI * 2) / 2.7) + reacts.reduce((s, r) => s + spring(t, r, 11), 0),
    blink: t < 1 ? ackBlink(t) : blinkAt(t, 4.3),
    eyeGlow: 0.15 + reacts.reduce((s, r) => s + (t >= r ? 0.6 * Math.exp(-1.6 * (t - r)) : 0), 0),
    x: 0,
    y: -7 * bump(t, at("ack"), 0.4) - 6 * bump(t, at("done") + 0.2, 0.4),
    mouth: speaker(t) === "ai" ? (i) => 0.3 + 0.9 * barNoise(i, t * 1.4) : () => 0.3,
  };
}

/** Double blink that acknowledges the new language. */
function ackBlink(t: number) {
  for (const b of [at("ack"), at("ack") + 0.24]) {
    const d = Math.abs(t - b);
    if (d < 0.08) return 0.1 + (d / 0.08) * 0.9;
  }
  return 1;
}
