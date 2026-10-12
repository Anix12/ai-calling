import { cubicBezier, easeInOut, interpolate } from "motion/react";
import type { RobotExpression } from "./robot-mascot";
import { blinkAt, bump, spring, type NovaPose } from "./nova-personality";
import { storyCues } from "./story-clock";

/**
 * Instant AI calling: one master clock (seconds) drives the lead card, NOVA, the phone,
 * the pipeline and the CRM confirmation.
 *
 *   0.4  lead notification appears above NOVA        1.0  NOVA notices, looks up
 *   1.6  NOVA reaches up and rolls toward it          2.8  catch (card meets the hand)
 *   3.4  configured 1-minute delay (11:00 → 11:01)    4.4  card becomes a calling indicator
 *   5.4  calling Aarav · 6.4 connecting · 7.2 connected (NOVA turns to the phone)
 *   7.6–14.4 conversation                             14.8 interested · qualified
 *   16.0 CRM updated · 17.0 final hold · 21.0 fade · loop at 21.6
 */
export const INSTANT_TOTAL = 21.6;
export const INSTANT_FINAL = 18.5;

export const instantCues = storyCues(
  [
    ["arrive", 0.4],
    ["notice", 1.0],
    ["reach", 1.6],
    ["catch", 2.8],
    ["delay", 3.4],
    ["morph", 4.4],
    ["calling", 5.4],
    ["connecting", 6.4],
    ["connected", 7.2],
    ["ai1", 7.6],
    ["lead1", 9.8],
    ["ai2", 11.4],
    ["lead2", 13.4],
    ["qualified", 14.8],
    ["crm", 16.0],
    ["final", 17.0],
    ["reset", 21.0],
  ] as const,
  "idle",
);

export type InstantPhase = ReturnType<typeof instantCues.phaseAt>;
const { at } = instantCues;
export const reachedI = (phase: InstantPhase, target: InstantPhase) => phase !== "reset" && instantCues.reached(phase, target);

const keys = (times: number[], values: number[], ease = easeInOut) => interpolate(times, values, { ease });
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ------------------------------------------------------------------ */
/* NOVA                                                                 */
/* ------------------------------------------------------------------ */

/** Left-arm angle while catching (degrees about the shoulder; hand ends up-left of the head). */
export const CATCH_ANGLE = 128;

// The left arm reaches up, gives a small "catch" dip as the card lands, holds, then lowers.
const armL = keys(
  [0, at("reach"), at("reach") + 0.7, at("catch"), at("catch") + 0.18, at("catch") + 0.45, at("morph") + 0.4, at("calling") + 0.2, at("qualified"), at("qualified") + 0.3, at("qualified") + 1.0, at("qualified") + 1.4],
  [14, 14, CATCH_ANGLE + 6, CATCH_ANGLE, CATCH_ANGLE - 14, CATCH_ANGLE, CATCH_ANGLE, 14, 14, 132, 132, 14],
);
// The right arm gestures at the phone during the call, celebrates, then waves at the CRM update.
const armR = keys(
  [0, at("connected"), at("connected") + 0.4, at("lead2") + 0.6, at("qualified"), at("qualified") + 0.3, at("qualified") + 1.0, at("crm"), at("crm") + 0.2, at("crm") + 0.4, at("crm") + 0.6, at("crm") + 0.8, at("crm") + 1.2],
  [-14, -14, -96, -96, -60, -132, -132, -125, -150, -122, -150, -125, -14],
);
const lookX = keys(
  [0, at("notice"), at("notice") + 0.3, at("catch"), at("catch") + 0.3, at("morph"), at("morph") + 0.4, at("connected") - 0.2, at("connected") + 0.2],
  [0, 0, -4, -4, -5, -5, 0, 0, 5],
);
const lookY = keys([0, at("notice"), at("notice") + 0.3, at("catch"), at("catch") + 0.3, at("morph") + 0.4, at("morph") + 0.8], [0, 0, -5, -5, -3, -3, 0]);
const tilt = keys(
  [0, at("notice"), at("notice") + 0.3, at("catch"), at("catch") + 0.3, at("morph") + 0.4, at("morph") + 0.8, at("connected") - 0.2, at("connected") + 0.2,
    at("lead1"), at("lead1") + 0.3, at("lead1") + 0.7, at("lead2"), at("lead2") + 0.3, at("lead2") + 0.7, at("qualified"), at("qualified") + 0.3, at("final")],
  [0, 0, -7, -7, -3, -3, 0, 0, 4, 4, 9, 4, 4, 9, 4, 4, -4, 0],
);
/** Roll toward the falling card and back, as a share of the robot's rendered width. */
const roll = keys([0, at("reach") + 0.2, at("catch") - 0.1, at("morph") + 0.4, at("calling") + 0.2], [0, 0, -0.07, -0.07, 0]);

const speech: [number, number, "ai" | "lead"][] = [
  [at("ai1"), at("lead1") - 0.4, "ai"],
  [at("lead1"), at("ai2") - 0.4, "lead"],
  [at("ai2"), at("lead2") - 0.4, "ai"],
  [at("lead2"), at("qualified") - 0.4, "lead"],
];
export const speaker = (t: number) => speech.find(([a, b]) => t >= a && t < b)?.[2] ?? null;
export const barNoise = (i: number, t: number) => 0.5 + 0.5 * Math.sin(t * 9.1 + i * 1.7) * Math.sin(t * 5.3 + i * 0.63);

export function instantNovaExpression(phase: InstantPhase): RobotExpression {
  if (!reachedI(phase, "notice")) return "neutral";
  if (reachedI(phase, "qualified")) return "happy";
  if (reachedI(phase, "calling")) return "focused";
  if (reachedI(phase, "catch")) return "happy";
  return "focused";
}
export const instantNovaTalking = (phase: InstantPhase) => phase === "ai1" || phase === "ai2";

/** NOVA's pose. `width` is the robot's rendered width in px (roll distance scales with it). */
export function instantNovaPose(t: number, width: number): NovaPose {
  const reacts = [at("notice"), at("catch"), at("qualified"), at("crm")];
  const ai = speaker(t) === "ai";
  // Keep the body still while holding the card so the hand stays exactly on it.
  const holding = t >= at("reach") && t < at("calling") + 0.2;
  return {
    armLeft: armL(t),
    armRight: armR(t),
    lookX: lookX(t),
    lookY: lookY(t),
    tilt: tilt(t) + (holding ? 0 : 1.2 * Math.sin((t * Math.PI * 2) / 6.5)),
    bodyY: holding ? 0 : 0.8 * Math.sin((t * Math.PI * 2) / 3.4),
    lean: 0,
    antenna: 2.2 * Math.sin((t * Math.PI * 2) / 2.7) + reacts.reduce((s, r) => s + spring(t, r, 11), 0),
    blink: blinkAt(t, 2.3),
    eyeGlow: 0.15 + reacts.reduce((s, r) => s + (t >= r ? 0.6 * Math.exp(-1.6 * (t - r)) : 0), 0),
    x: roll(t) * width,
    y: -5 * bump(t, at("catch"), 0.35) - 9 * bump(t, at("qualified"), 0.42) - 8 * bump(t, at("crm"), 0.45),
    mouth: ai ? (i) => 0.3 + 0.9 * barNoise(i, t * 1.4) : () => 0.3,
  };
}

/* ------------------------------------------------------------------ */
/* Catch geometry (shared scene coordinates, px, relative to the scene) */
/* ------------------------------------------------------------------ */

export type SceneMetrics = {
  /** Robot box origin and rendered width inside the scene. */
  robotX: number;
  robotY: number;
  robotW: number;
  sceneW: number;
  cardW: number;
  cardH: number;
  pillW: number;
  pillH: number;
};

/** Where NOVA's left hand is at time t, using the same arm angle, roll and hop as the robot. */
export function handAt(t: number, m: SceneMetrics) {
  const s = m.robotW / 200;
  const pose = instantNovaPose(t, m.robotW);
  const a = (pose.armLeft * Math.PI) / 180;
  // Hand centre is 36 SVG units below the shoulder pivot (54, 138), rotated by the arm angle.
  const hx = 54 - 36 * Math.sin(a);
  const hy = 138 + 36 * Math.cos(a) + pose.bodyY;
  return { x: m.robotX + pose.x + hx * s, y: m.robotY + pose.y + hy * s };
}

/**
 * Card top-left so its lower-right corner sits on NOVA's hand: the card is drawn in front of the
 * robot, and the hand's lower half shows below the corner, holding it up. Clamped inside the scene.
 */
function cardAtHand(hand: { x: number; y: number }, m: SceneMetrics) {
  const x = Math.min(Math.max(4, hand.x - m.cardW + 12), m.sceneW - m.cardW - 4);
  return { x, y: hand.y - m.cardH + 3 };
}

const fall = cubicBezier(0.45, 0, 0.25, 1);

/**
 * Lead card: appears high above NOVA, drifts down with a gentle sway, lands in the raised hand,
 * rides the catch dip, then hands over to the calling indicator.
 */
export function leadCardFrame(t: number, m: SceneMetrics) {
  const catchAt = cardAtHand(handAt(at("catch"), m), m);
  const start = { x: Math.min(catchAt.x + 36, m.sceneW - m.cardW - 4), y: 0 };
  let x: number;
  let y: number;
  let rotate = 0;
  if (t < at("catch")) {
    const u = clamp01((t - at("arrive")) / (at("catch") - at("arrive")));
    const e = fall(u);
    x = start.x + (catchAt.x - start.x) * e + 10 * Math.sin(u * Math.PI * 2) * (1 - u);
    y = start.y + (catchAt.y - start.y) * e;
    rotate = -6 * (1 - e) + 4 * Math.sin(u * Math.PI * 3) * (1 - u);
  } else {
    ({ x, y } = cardAtHand(handAt(t, m), m));
    rotate = -2 * Math.exp(-6 * (t - at("catch")));
  }
  const fadeIn = clamp01((t - at("arrive")) / 0.35);
  const fadeOut = 1 - clamp01((t - at("morph")) / 0.3);
  const scale = 1 - 0.12 * clamp01((t - at("morph")) / 0.3);
  return { x, y, rotate, scale, opacity: fadeIn * fadeOut, glow: t < at("catch") ? 1 : Math.exp(-3 * (t - at("catch"))) };
}

/** Calling indicator: born at the hand as the card fades, floats up to sit above NOVA's head. */
export function callPillFrame(t: number, m: SceneMetrics) {
  const s = m.robotW / 200;
  const from = handAt(at("morph"), m);
  const dock = { x: m.robotX + 100 * s - m.pillW / 2, y: m.robotY - m.pillH - 6 };
  const u = easeInOut(clamp01((t - at("morph") - 0.1) / 0.8));
  const x = from.x - m.pillW / 2 + (dock.x - (from.x - m.pillW / 2)) * u;
  const y = from.y - m.pillH + (dock.y - (from.y - m.pillH)) * u;
  const opacity = clamp01((t - at("morph")) / 0.3) * (1 - clamp01((t - at("reset")) / 0.4));
  return { x, y, scale: 0.85 + 0.15 * u, opacity };
}

/* ------------------------------------------------------------------ */
/* Phone, call and pipeline                                             */
/* ------------------------------------------------------------------ */

/** Progress (0–1) through the configured 1-minute delay. */
export const delayProgress = (t: number) => clamp01((t - at("delay")) / (at("calling") - at("delay")));

export function callLevel(t: number) {
  const who = speaker(t);
  if (who === "ai") return 1;
  if (who === "lead") return 0.7;
  if (t >= at("calling") && t < at("connected")) return 0.12 + 0.12 * Math.abs(Math.sin(t * Math.PI * 1.6));
  if (t >= at("connected") && t < at("qualified")) return 0.12;
  return 0.04;
}

/** Seconds on the call clock (from "connected", frozen once the call ends). */
export const callSeconds = (t: number) => Math.max(0, Math.min(t, at("qualified")) - at("connected"));

/** Lead indicator position along the 4-step pipeline: 0 = New lead … 3 = CRM updated. */
export const pipelinePos = keys(
  [0, at("calling") - 0.4, at("calling") + 0.4, at("qualified") - 0.2, at("qualified") + 0.5, at("crm") - 0.1, at("crm") + 0.6],
  [0, 0, 1, 1, 2, 2, 3],
);

export type PipelineStepState = "pending" | "active" | "done";
export function pipelineStepState(phase: InstantPhase, i: number): PipelineStepState {
  const cues: InstantPhase[] = ["arrive", "calling", "qualified", "crm"];
  if (!reachedI(phase, cues[i])) return "pending";
  if (i === cues.length - 1) return "done";
  return reachedI(phase, cues[i + 1]) ? "done" : "active";
}

/** Short status text shared by the phone header and the calling indicator. */
export function callStatus(phase: InstantPhase): string {
  if (reachedI(phase, "crm")) return "CRM updated";
  if (reachedI(phase, "qualified")) return "Call complete";
  if (reachedI(phase, "connected")) return "Connected";
  if (reachedI(phase, "connecting")) return "Connecting…";
  if (reachedI(phase, "calling")) return "Calling Aarav…";
  if (reachedI(phase, "delay")) return "Preparing call";
  if (reachedI(phase, "arrive")) return "New lead";
  return "Standing by";
}
