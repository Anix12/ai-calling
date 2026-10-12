"use client";

import { useCallback, useEffect, useState } from "react";
import { useInView, useMotionValue, useMotionValueEvent, type MotionValue } from "motion/react";
import { usePageVisible, usePrefersReducedMotion } from "@/lib/browser-hooks";

/**
 * Master clock for a scripted story (the hero call, the Problem comparison, …).
 *
 * Time is one MotionValue in seconds, advanced by a single requestAnimationFrame loop.
 * It plays only while `ref` is on screen, the tab is visible and the visitor hasn't paused,
 * so pausing for any reason resumes from exactly the same point. Everything the story shows
 * is a pure function of this time; React re-renders only when the discrete `phase` changes.
 *
 * Reduced motion: the clock never runs and is parked on `finalFrame`, the completed story.
 */
export function useStoryClock<Phase extends string>(
  ref: React.RefObject<Element | null>,
  {
    total,
    loopTo = 0,
    finalFrame,
    phaseAt,
    amount = 0.3,
  }: {
    /** Story length in seconds; time wraps to `loopTo` when it reaches this. */
    total: number;
    /** Where the loop restarts (lets an intro play only once). */
    loopTo?: number;
    finalFrame: number;
    phaseAt: (t: number) => Phase;
    /** Share of `ref` that must be visible to play. */
    amount?: number;
  },
) {
  const time = useMotionValue(0);
  const inView = useInView(ref, { amount });
  const pageVisible = usePageVisible();
  const reduced = usePrefersReducedMotion();
  const [userPaused, setUserPaused] = useState(false);
  const playing = inView && pageVisible && !reduced && !userPaused;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Clamp the step so a stalled frame never skips a scene.
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let next = time.get() + dt;
      if (next >= total) next = loopTo + (next - total);
      time.set(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, time, total, loopTo]);

  useEffect(() => {
    if (reduced) time.set(finalFrame);
  }, [reduced, time, finalFrame]);

  const [phase, setPhase] = useState<Phase>(() => phaseAt(time.get()));
  useMotionValueEvent(time, "change", (t) => setPhase(phaseAt(t)));

  const replay = useCallback(() => {
    time.set(0);
    setUserPaused(false);
  }, [time]);
  const togglePause = useCallback(() => setUserPaused((p) => !p), []);

  return { time, phase, reduced, userPaused, replay, togglePause };
}

export type StoryTime = MotionValue<number>;

/** Builds `phaseAt` and `reached` for an ordered list of [phase, startTime] cues. */
export function storyCues<const P extends string>(cues: readonly (readonly [P, number])[], initial: P) {
  const order = [initial, ...cues.map(([p]) => p)];
  const phaseAt = (t: number): P => {
    let phase = initial;
    for (const [p, at] of cues) if (t >= at) phase = p;
    return phase;
  };
  const reached = (phase: P, target: P) => order.indexOf(phase) >= order.indexOf(target);
  const at = (p: P) => cues.find(([q]) => q === p)![1];
  return { phaseAt, reached, at };
}
