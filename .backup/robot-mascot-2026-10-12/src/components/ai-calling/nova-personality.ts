import { easeInOut, interpolate } from "motion/react";
import { armAngles } from "./robot-mascot";
import type { NovaChannel, NovaPreset } from "./nova-presets";

/**
 * Pure pose maths for NOVA's personality in static sections. No DOM, no React:
 * `novaPose(preset, reaction, idle)` → one frame. animated-nova.tsx writes it to the SVG.
 *
 *   reaction  seconds since the current entrance reaction started (−1 = never started)
 *   idle      seconds the robot has been on screen in total (drives breathing, blinks, glances)
 */

export type NovaPose = {
  armLeft: number;
  armRight: number;
  lookX: number;
  lookY: number;
  tilt: number;
  /** Vertical breathing offset of body and head (SVG units). */
  bodyY: number;
  /** Body sway around the axle (degrees). */
  lean: number;
  antenna: number;
  /** Eye scaleY: 1 open, ~0.1 closed. */
  blink: number;
  eyeGlow: number;
  /** Whole-robot offsets in CSS px (hop / settling roll). */
  x: number;
  y: number;
  /** Optional talking-mouth bar scale for bar `i` (only used while the robot is talking). */
  mouth?: (i: number) => number;
};

const TAU = Math.PI * 2;
export const bump = (t: number, at: number, dur: number) => (t < at || t > at + dur ? 0 : Math.sin(((t - at) / dur) * Math.PI));
export const spring = (t: number, at: number, amp: number) => (t < at || t > at + 2.5 ? 0 : amp * Math.exp(-4 * (t - at)) * Math.sin(15 * (t - at)));

// Interpolators are built once per track and reused every frame.
const cache = new WeakMap<object, (t: number) => number>();
function sample(track: readonly [readonly number[], readonly number[]], t: number) {
  let f = cache.get(track);
  if (!f) {
    f = interpolate(track[0] as number[], track[1] as number[], { ease: easeInOut });
    cache.set(track, f);
  }
  return f(t);
}

/** Resting value of a channel once the reaction is over. */
function rest(p: NovaPreset, ch: NovaChannel) {
  const [l, r] = armAngles[p.arm];
  return { armLeft: l, armRight: r, lookX: p.look[0], lookY: p.look[1], tilt: p.tilt }[ch];
}

/** Static pose (what the server renders): arms from the preset, eyes and head centred. */
export function staticPose(p: NovaPreset): NovaPose {
  const [armLeft, armRight] = armAngles[p.arm];
  return { armLeft, armRight, lookX: 0, lookY: 0, tilt: 0, bodyY: 0, lean: 0, antenna: 0, blink: 1, eyeGlow: 0, x: 0, y: 0 };
}

/**
 * Double blink every third cycle; the period varies slightly per robot (seed) so
 * neighbouring sections never blink in unison.
 */
export function blinkAt(idle: number, seed: number) {
  const period = 4.2 + (seed % 5) * 0.35;
  const cycle = Math.floor((idle + seed) / period);
  const local = (idle + seed) % period;
  const blinks = cycle % 3 === 2 ? [0, 0.3] : [0];
  for (const b of blinks) {
    const d = Math.abs(local - 3 - b);
    if (d < 0.08) return 0.1 + (d / 0.08) * 0.9;
  }
  return 1;
}

/** Occasional small glances: hold, then move quickly (so the eyes are still most of the time). */
const glances: readonly (readonly [number, number])[] = [
  [0, 0],
  [1.5, -0.5],
  [0, 0],
  [-1.5, 0.5],
  [0.8, -1],
];
function glance(idle: number, seed: number) {
  const period = 3.6;
  const i = Math.floor((idle + seed) / period);
  const local = (idle + seed) % period;
  const from = glances[(i + glances.length - 1) % glances.length];
  const to = glances[i % glances.length];
  const k = easeInOut(Math.min(1, local / 0.25));
  return [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k] as const;
}

export function novaPose(p: NovaPreset, reaction: number, idle: number, seed = 0): NovaPose {
  if (reaction < 0) return staticPose(p);
  const reacting = reaction < p.duration;
  const channel = (ch: NovaChannel) => {
    const track = p.tracks[ch];
    return reacting && track ? sample(track, reaction) : reacting && !track ? startValue(p, ch, reaction) : rest(p, ch);
  };

  // Idle layers fade in after the reaction so they never fight the keyframes.
  const calm = reacting ? 0 : Math.min(1, (reaction - p.duration) / 0.8);
  const [gx, gy] = glance(idle, seed);
  const hops = p.hops ?? [];

  return {
    armLeft: channel("armLeft"),
    armRight: channel("armRight"),
    lookX: channel("lookX") + gx * calm,
    lookY: channel("lookY") + gy * calm,
    tilt: channel("tilt") + 1.4 * Math.sin((idle * TAU) / 6.5 + seed) * calm,
    bodyY: 0.8 * Math.sin((idle * TAU) / 3.4 + seed),
    lean: 0.6 * Math.sin((idle * TAU) / 7.3 + seed) * calm + (p.settle ? spring(reaction, 0, 2.2) : 0),
    antenna:
      2.4 * Math.sin((idle * TAU) / 2.7 + seed) +
      spring(reaction, 0, 10) +
      hops.reduce((sum, h) => sum + spring(reaction, h + 0.2, 9), 0),
    blink: reacting ? blinkDuring(reaction) : blinkAt(idle, seed),
    eyeGlow: 0.12 + 0.55 * Math.exp(-1.4 * reaction),
    // A short roll forward and back: the only movement that turns the wheels.
    x: p.settle && reaction < 0.9 ? 5 * Math.sin((reaction / 0.9) * Math.PI) * (1 - reaction / 0.9) : 0,
    y: -hops.reduce((sum, h) => sum + 7 * bump(reaction, h, 0.42), 0),
  };
}

/** A track-less channel eases from its static start value to its rest value over the reaction. */
function startValue(p: NovaPreset, ch: NovaChannel, t: number) {
  const start = staticPose(p)[ch];
  const end = rest(p, ch);
  return start + (end - start) * easeInOut(Math.min(1, t / Math.min(0.6, p.duration)));
}

/** One noticing double-blink right as the section appears. */
function blinkDuring(t: number) {
  for (const b of [0.18, 0.42]) {
    const d = Math.abs(t - b);
    if (d < 0.08) return 0.1 + (d / 0.08) * 0.9;
  }
  return 1;
}

/** Right-arm angle (degrees about the shoulder) that points NOVA's hand along screen direction `dir`. */
export function reachAngle(dir: { x: number; y: number }) {
  const deg = (Math.atan2(-dir.x, dir.y) * 180) / Math.PI;
  return Math.max(-135, Math.min(-25, deg));
}
