import type { RobotArm, RobotExpression } from "./robot-mascot";

/**
 * Declarative personality presets for NOVA in the static sections. The hero (hero-timeline.ts) and
 * the Problem (problem-story.ts), Instant calling (instant-timeline.ts), Bulk calling
 * (bulk-timeline.ts), Multilingual (multilingual-timeline.ts), Handoff (handoff-timeline.ts) and Call
 * intelligence (intelligence-timeline.ts) stories drive their robots from their own story clocks instead.
 *
 * Each preset is a short entrance reaction followed by a gentle idle. Rules:
 *  - `arm` / `expression` are the resting pose. They are also what the server renders and what
 *    reduced-motion visitors see, so the robot looks finished before any script runs.
 *  - Every track starts from that static pose (look 0, tilt 0, the static arm angles) so the first
 *    animated frame never jumps, and ends at the preset's rest values (`look`, `tilt`).
 *  - Times are seconds from the moment the section becomes visible.
 */

export type NovaChannel = "armLeft" | "armRight" | "lookX" | "lookY" | "tilt";
/** Keyframe times (s) and values. Arms are degrees about the shoulder; look is SVG units; tilt is degrees. */
export type NovaTrack = readonly [times: readonly number[], values: readonly number[]];

export type NovaPreset = {
  arm: RobotArm;
  expression: RobotExpression;
  /** Resting eye direction once the reaction has finished. */
  look: readonly [x: number, y: number];
  /** Resting head tilt once the reaction has finished. */
  tilt: number;
  /** Length of the entrance reaction in seconds. */
  duration: number;
  tracks: Partial<Record<NovaChannel, NovaTrack>>;
  /** Expression cues during the reaction: [time, expression]. After it, `expression` applies. */
  expressions?: readonly (readonly [number, RobotExpression])[];
  /** Times of small, excited hops. */
  hops?: readonly number[];
  /** A tiny forward-and-back roll on arrival (the only time the wheels turn). */
  settle?: boolean;
};

export const novaPresets = {
  /** A confident, welcoming open-arms gesture. */
  scale: {
    arm: "open",
    expression: "happy",
    look: [0, -1],
    tilt: 2,
    duration: 1.7,
    tracks: {
      armLeft: [[0, 0.4, 0.95, 1.35], [55, 22, 78, 55]],
      armRight: [[0, 0.4, 0.95, 1.35], [-55, -22, -78, -55]],
      tilt: [[0, 0.5, 1.3], [0, 4, 2]],
      lookY: [[0, 0.6], [0, -1]],
    },
    hops: [0.9],
    settle: true,
  },

  /** Waves goodbye with a happy face. */
  final: {
    arm: "wave",
    expression: "happy",
    look: [0, 0],
    tilt: 0,
    duration: 1.8,
    tracks: {
      armRight: [[0, 0.3, 0.5, 0.7, 0.9, 1.1, 1.5], [-125, -150, -122, -150, -122, -140, -125]],
      tilt: [[0, 0.4, 1.2, 1.6], [0, 5, 5, 0]],
    },
    hops: [0.2],
    settle: true,
  },
} satisfies Record<string, NovaPreset>;

export type NovaPresetName = keyof typeof novaPresets;
