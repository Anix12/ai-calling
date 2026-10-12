import { easeInOut, interpolate } from "motion/react";
import type { RobotExpression } from "./robot-mascot";
import { blinkAt, bump, spring, type NovaPose } from "./nova-personality";
export { reachAngle } from "./nova-personality";
import { storyCues } from "./story-clock";

/**
 * Hot lead handoff: one master clock (seconds) drives the end of the call, the lead card's
 * flight from NOVA's hand to the counsellor list, the round-robin assignment, the CRM record
 * and NOVA.
 *
 *   0.8 lead says yes · 2.0 AI wraps up · 3.2 call completed · 4.0 interested + qualified
 *   5.2 NOVA turns and reaches toward the team · 5.9 card leaves the hand · 7.6 card lands
 *   7.9 assigned (round-robin) · 9.4–11.2 CRM fields fill · 12.2 final message, NOVA waves
 *   16.0 fade · loop at 16.6
 */
export const HANDOFF_TOTAL = 16.6;
export const HANDOFF_FINAL = 14;

export const handoffCues = storyCues(
  [
    ["yes", 0.8],
    ["wrap", 2.0],
    ["completed", 3.2],
    ["qualified", 4.0],
    ["turn", 5.2],
    ["release", 5.9],
    ["land", 7.6],
    ["assigned", 7.9],
    ["crm1", 9.4],
    ["crm2", 10.0],
    ["crm3", 10.6],
    ["crm4", 11.2],
    ["final", 12.2],
    ["reset", 16.0],
  ] as const,
  "talk",
);

export type HandoffPhase = ReturnType<typeof handoffCues.phaseAt>;
const { at } = handoffCues;
export const reachedH = (phase: HandoffPhase, target: HandoffPhase) => phase !== "reset" && handoffCues.reached(phase, target);

/** Phase at which each conversation line is visible (the first three are already on screen). */
export const lineCues: HandoffPhase[] = ["talk", "talk", "talk", "yes", "wrap"];
/** Phase at which each CRM field is written. */
export const crmCues: HandoffPhase[] = ["crm1", "crm2", "crm3", "crm4"];
/** Phase at which each step of the strip below becomes current. */
export const stepCues: HandoffPhase[] = ["talk", "qualified", "assigned", "crm1"];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const keys = (times: number[], values: number[]) => interpolate(times, values, { ease: easeInOut });

/* ------------------------------------------------------------------ */
/* NOVA                                                                 */
/* ------------------------------------------------------------------ */

/** Unit directions from NOVA's face, plus the arm angle that points the right hand at the team. */
export type HandoffGaze = { chat: { x: number; y: number }; team: { x: number; y: number }; reach: number };

const toChat = keys([0, at("completed"), at("completed") + 0.4], [1, 1, 0]);
const toTeam = keys([0, at("turn"), at("turn") + 0.4, at("final"), at("final") + 0.4], [0, 0, 1, 1, 0]);
/** 0 → arm at rest, 1 → arm reaching at the team (holding through the release, then lowering). */
const reachK = keys([0, at("turn"), at("release") - 0.1, at("release") + 0.5, at("land")], [0, 0, 1, 1, 0]);
const waveR = keys(
  [0, at("final"), at("final") + 0.3, at("final") + 0.5, at("final") + 0.7, at("final") + 0.9, at("final") + 1.1, at("final") + 1.5],
  [0, 0, -150, -122, -150, -122, -140, 0],
);
const waving = (t: number) => t >= at("final") && t < at("final") + 1.5;

export function handoffNovaExpression(phase: HandoffPhase): RobotExpression {
  if (reachedH(phase, "final") || phase === "qualified") return "happy";
  if (reachedH(phase, "turn")) return "focused";
  return phase === "yes" ? "happy" : "neutral";
}
export const handoffNovaTalking = (phase: HandoffPhase) => phase === "wrap";

export function handoffNovaPose(t: number, gaze: HandoffGaze): NovaPose {
  const c = toChat(t);
  const m = toTeam(t);
  const reacts = [at("yes"), at("qualified"), at("assigned"), at("final")];
  const speaking = t >= at("wrap") && t < at("completed") - 0.3;
  return {
    armLeft: 14 + 110 * bump(t, at("qualified"), 0.9),
    armRight: waving(t) ? waveR(t) : -14 + (gaze.reach + 14) * reachK(t),
    lookX: 5 * (gaze.chat.x * c + gaze.team.x * m),
    lookY: 4.5 * (gaze.chat.y * c + gaze.team.y * m),
    tilt: 4 * gaze.team.x * m + 1.2 * Math.sin((t * Math.PI * 2) / 6.5),
    bodyY: 0.8 * Math.sin((t * Math.PI * 2) / 3.4),
    lean: 0,
    antenna: 2.2 * Math.sin((t * Math.PI * 2) / 2.7) + reacts.reduce((s, r) => s + spring(t, r, 10), 0),
    blink: blinkAt(t, 5.1),
    eyeGlow: 0.15 + reacts.reduce((s, r) => s + (t >= r ? 0.55 * Math.exp(-1.6 * (t - r)) : 0), 0),
    x: 0,
    y: -8 * bump(t, at("qualified"), 0.42) - 7 * bump(t, at("final") + 0.1, 0.42),
    mouth: speaking ? (i) => 0.3 + 0.9 * (0.5 + 0.5 * Math.sin(t * 12.8 + i * 1.7) * Math.sin(t * 7.4 + i * 0.63)) : () => 0.3,
  };
}

/** Right-hand centre in SVG units for a given arm angle (pivot 146,138; hand 36 below it). */
export function handPoint(armDeg: number) {
  const a = (armDeg * Math.PI) / 180;
  return { x: 146 - 36 * Math.sin(a), y: 138 + 36 * Math.cos(a) };
}

/* ------------------------------------------------------------------ */
/* Lead card flight (scene px, relative to the story root)              */
/* ------------------------------------------------------------------ */

export type HandoffScene = {
  /** Hand position when the card is released. */
  from: { x: number; y: number };
  /** Centre of the assigned counsellor's row. */
  to: { x: number; y: number };
  cardW: number;
  cardH: number;
};

/** Card centre, scale and opacity: held at the hand, arcs over to the counsellor, fades into the row. */
export function cardFrame(t: number, s: HandoffScene) {
  const u = easeInOut(clamp01((t - at("release")) / (at("land") - at("release"))));
  const lift = Math.min(90, Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y) * 0.25);
  const mid = { x: (s.from.x + s.to.x) / 2, y: Math.min(s.from.y, s.to.y) - lift };
  // Quadratic Bézier from the hand, over the gap, into the row.
  const x = (1 - u) ** 2 * s.from.x + 2 * (1 - u) * u * mid.x + u ** 2 * s.to.x;
  const y = (1 - u) ** 2 * s.from.y + 2 * (1 - u) * u * mid.y + u ** 2 * s.to.y;
  const appear = clamp01((t - at("release") + 0.35) / 0.35);
  const vanish = clamp01((t - at("land")) / 0.35);
  return { x: x - s.cardW / 2, y: y - s.cardH / 2, scale: 0.9 + 0.1 * Math.sin(Math.PI * u), opacity: appear * (1 - vanish), rotate: -4 * (1 - u) };
}
