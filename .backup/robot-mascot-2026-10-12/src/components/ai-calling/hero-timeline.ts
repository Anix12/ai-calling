"use client";

import { cubicBezier, easeInOut, interpolate } from "motion/react";
import { useStoryClock, type StoryTime } from "./story-clock";

/**
 * One timeline drives the whole hero: the robot entrance, the live-call story and every
 * UI state. Time is a single MotionValue (seconds) advanced by one requestAnimationFrame
 * loop; everything else is a pure function of it.
 *
 *   0 ─ INTRO         robot rolls in, bounces, blinks, waves, settles (plays once)
 *   INTRO ─ TOTAL     20 s call story, then loops back to INTRO
 */
export const INTRO = 4;
export const STORY = 20;
export const TOTAL = INTRO + STORY;
/** Frame shown to reduced-motion visitors: the finished story, robot at rest. */
export const FINAL_FRAME = INTRO + 18;

/** Story cues, in seconds from the start of the story. Order matters. */
const storyCues = [
  ["notify", 0.2],
  ["notice", 0.8],
  ["connecting", 2.6],
  ["connected", 4.4],
  ["ai1", 5.0],
  ["lead1", 7.8],
  ["ai2", 9.4],
  ["lead2", 11.4],
  ["qualified", 13.0],
  ["crm", 15.0],
  ["reset", 19.3],
] as const;

export type HeroPhase = "enter" | "wave" | "settled" | (typeof storyCues)[number][0];
const order: HeroPhase[] = ["enter", "wave", "settled", ...storyCues.map(([p]) => p)];

const cue = (name: (typeof storyCues)[number][0]) => storyCues.find(([p]) => p === name)![1];

export function phaseAt(t: number): HeroPhase {
  if (t < INTRO) return t < 2.35 ? "enter" : t < 3.7 ? "wave" : "settled";
  const s = t - INTRO;
  let phase: HeroPhase = "settled";
  for (const [p, at] of storyCues) if (s >= at) phase = p;
  return phase;
}

/** True once the story has reached `target` (and not yet reset). */
export function reached(phase: HeroPhase, target: HeroPhase) {
  return phase !== "reset" && order.indexOf(phase) >= order.indexOf(target);
}

/* ------------------------------------------------------------------ */
/* Clock                                                               */
/* ------------------------------------------------------------------ */

/** The hero's story clock: the intro plays once, then the call story loops from INTRO. */
export function useHeroTimeline(ref: React.RefObject<Element | null>) {
  return useStoryClock(ref, { total: TOTAL, loopTo: INTRO, finalFrame: FINAL_FRAME, phaseAt });
}

export type HeroTime = StoryTime;

/* ------------------------------------------------------------------ */
/* Robot pose (pure)                                                   */
/* ------------------------------------------------------------------ */

const ROLL = 1.5; // seconds to roll in
const rollEase = cubicBezier(0.22, 0.85, 0.3, 1);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Damped spring impulse that starts at `at`. */
const spring = (t: number, at: number, amp: number, decay: number, freq: number) =>
  t < at || t > at + 3 ? 0 : amp * Math.exp(-decay * (t - at)) * Math.sin(freq * (t - at));
const keys = (times: number[], values: number[]) => interpolate(times, values, { ease: easeInOut });
/** Quick bump: 0 → 1 → 0 over `dur` seconds from `at`. */
const bump = (t: number, at: number, dur: number) => (t < at || t > at + dur ? 0 : Math.sin(((t - at) / dur) * Math.PI));

const introRightArm = keys([0, 2.35, 2.6, 2.8, 3.0, 3.2, 3.4, 3.85], [-14, -14, -128, -150, -126, -150, -128, -14]);
const introTilt = keys([0, 2.35, 2.6, 3.5, 3.9], [0, 0, 5, 5, 0]);
const introLookX = keys([0, 1.7, 2.25], [4, 4, 0]);

const storyRightArm = keys(
  [0, 2.6, 3.0, 15.0, 15.3, 15.5, 15.7, 15.9, 16.1, 16.6],
  [-14, -14, -112, -112, -142, -122, -142, -122, -136, -14],
);
const storyLeftArm = keys([0, 15.0, 15.3, 15.5, 15.7, 15.9, 16.1, 16.6], [14, 14, 142, 122, 142, 122, 136, 14]);
const storyLookX = keys([0, 0.8, 1.1, 2.5, 2.9, 12.8, 13.2], [0, 0, -5, -5, 4, 4, 0]);
const storyLookY = keys([0, 0.8, 1.1, 2.5, 2.9], [0, 0, -4, -4, 0]);
const storyTilt = keys(
  [0, 0.8, 1.1, 2.4, 2.7, 7.8, 8.1, 8.9, 9.2, 11.4, 11.7, 12.4, 12.7, 13.0, 13.3, 16.5, 17],
  [0, 0, -7, -7, 0, 0, 5, 5, 0, 0, 5, 5, 0, 0, 4, 4, 0],
);

export type RobotPose = {
  /** 0–1 roll progress (multiplied by the measured off-screen distance). */
  roll: number;
  opacity: number;
  /** Whole-robot hop in px (negative = up). */
  hop: number;
  lean: number;
  bodyY: number;
  headTilt: number;
  antenna: number;
  armLeft: number;
  armRight: number;
  lookX: number;
  lookY: number;
  /** Eye scaleY: 1 open, ~0.1 closed. */
  blink: number;
  eyeGlow: number;
  /** 0–1 mouth movement while the AI speaks. */
  talk: number;
};

function blinkAt(t: number, times: number[]) {
  for (const b of times) {
    const d = Math.abs(t - b);
    if (d < 0.09) return 0.1 + (d / 0.09) * 0.9;
  }
  return 1;
}

export function robotPose(t: number): RobotPose {
  // Gentle idle "breathing" once the robot has arrived.
  const idle = t > ROLL ? Math.sin((t * Math.PI * 2) / 3.2) * 0.7 : 0;
  const antennaIdle = t > ROLL ? Math.sin((t * Math.PI * 2) / 2.6 + 1) * 2 : 0;

  if (t < INTRO) {
    const p = clamp01(t / ROLL);
    const eased = rollEase(p);
    const rolling = t < ROLL;
    return {
      roll: eased,
      opacity: clamp01(t / 0.55),
      hop: 0,
      // Leans into the stop, then the suspension settles it.
      lean: rolling ? 4 * p * p : 4 * Math.exp(-5 * (t - ROLL)) * Math.cos(12 * (t - ROLL)),
      bodyY: spring(t, ROLL, 2.6, 6, 14) + idle,
      headTilt: introTilt(t),
      // Antenna trails the motion, then whips forward and wobbles out.
      antenna: (rolling ? -12 * (1 - eased) : spring(t, ROLL, 14, 4, 15)) + antennaIdle,
      armLeft: 14 + 8 * (1 - eased),
      armRight: introRightArm(t),
      lookX: introLookX(t),
      lookY: 0,
      blink: blinkAt(t, [2.1, 2.42]),
      eyeGlow: 0.15 + 0.5 * bump(t, 1.9, 0.9),
      talk: 0,
    };
  }

  const s = t - INTRO;
  const blinks = [1.8, 5.4, 9.0, 12.6, 16.2, 18.6];
  const reactions = [cue("notice"), cue("qualified"), cue("crm")];
  return {
    roll: 1,
    opacity: 1,
    hop: -10 * bump(s, cue("qualified"), 0.45) - 14 * bump(s, cue("crm") + 0.05, 0.5) - 7 * bump(s, cue("crm") + 0.6, 0.4),
    lean: 0,
    bodyY: idle,
    headTilt: storyTilt(s),
    antenna: antennaIdle + reactions.reduce((sum, at) => sum + spring(s, at, 14, 4, 15), 0),
    armLeft: storyLeftArm(s),
    armRight: storyRightArm(s),
    lookX: storyLookX(s),
    lookY: storyLookY(s),
    blink: blinkAt(s, blinks),
    eyeGlow: 0.2 + reactions.reduce((sum, at) => sum + (s >= at ? 0.75 * Math.exp(-1.6 * (s - at)) : 0), 0),
    talk: speaking(s) === "ai" ? 1 : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Call signal                                                          */
/* ------------------------------------------------------------------ */

const speech: [from: number, to: number, who: "ai" | "lead"][] = [
  [5.0, 7.6, "ai"],
  [7.8, 9.2, "lead"],
  [9.4, 11.2, "ai"],
  [11.4, 12.8, "lead"],
];

function speaking(s: number) {
  return speech.find(([a, b]) => s >= a && s < b)?.[2] ?? null;
}

/** Waveform energy 0–1 at time `t` (ringing pulse, speech, line noise). */
export function callLevel(t: number) {
  if (t < INTRO) return 0.04;
  const s = t - INTRO;
  const who = speaking(s);
  if (who === "ai") return 1;
  if (who === "lead") return 0.72;
  if (s >= cue("connecting") && s < cue("connected")) return 0.12 + 0.12 * Math.abs(Math.sin(s * Math.PI * 1.6));
  if (s >= cue("connected") && s < cue("crm")) return 0.14;
  return 0.04;
}

/** Seconds on the call clock (counts from "connected", freezes when the call ends). */
export function callSeconds(t: number) {
  if (t < INTRO) return 0;
  const s = t - INTRO;
  return Math.max(0, Math.min(s, cue("crm")) - cue("connected"));
}

/** Smooth pseudo-random bar movement, deterministic for a given time. */
export function barNoise(i: number, t: number) {
  return 0.5 + 0.5 * Math.sin(t * 9.1 + i * 1.7) * Math.sin(t * 5.3 + i * 0.63);
}
