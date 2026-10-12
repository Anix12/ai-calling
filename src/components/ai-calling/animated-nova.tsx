"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { usePageVisible, usePrefersReducedMotion } from "@/lib/browser-hooks";
import { cn } from "@/lib/utils";
import { RobotMascot, WHEEL_RADIUS, type RobotExpression } from "./robot-mascot";
import { novaPresets, type NovaPreset, type NovaPresetName } from "./nova-presets";
import { novaPose, staticPose, type NovaPose } from "./nova-personality";

/**
 * NOVA with a personality, for the static sections. Wraps the unchanged <RobotMascot> and
 * animates its `data-part` groups from a declarative preset (nova-presets.ts).
 *
 * Lifecycle:
 *  - Renders the preset's resting pose on the server and for reduced-motion visitors.
 *  - When the robot scrolls into view, plays the preset's short reaction, then idles gently.
 *  - Off-screen or in a hidden tab, its clock stops; it resumes exactly where it was.
 *  - Re-entering after a finished reaction starts a fresh reaction (one per visibility cycle).
 *
 * The hero robot is driven by hero-timeline.ts instead and must never use this component,
 * so no two controllers ever write to the same SVG.
 */
export function AnimatedNova({
  preset: name,
  talking,
  chest,
  label,
  className,
}: {
  preset: NovaPresetName;
  talking?: boolean;
  chest?: string;
  label?: string;
  className?: string;
}) {
  const preset: NovaPreset = novaPresets[name];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const pageVisible = usePageVisible();
  const reduced = usePrefersReducedMotion();
  const playing = inView && pageVisible && !reduced;

  // Clocks live in refs: advancing them never re-renders React.
  const clock = useRef({ reaction: -1, idle: 0 });
  const scale = useRef(1);
  // Per-robot offset so neighbouring robots never breathe or blink in sync.
  const seed = useRef(name.length * 1.37);

  const [expression, setExpression] = useState<RobotExpression>(preset.expression);
  const expressionRef = useRef(expression);

  const write = useNovaWriter(ref, scale);

  const frame = useCallback(() => {
    const { reaction, idle } = clock.current;
    write(novaPose(preset, reaction, idle, seed.current));
    // Expression is the only React state, and it changes only at scene cues.
    let next: RobotExpression = preset.expression;
    if (reaction >= 0 && reaction < preset.duration) {
      for (const [at, e] of preset.expressions ?? []) if (reaction >= at) next = e;
    }
    if (next !== expressionRef.current) {
      expressionRef.current = next;
      setExpression(next);
    }
  }, [preset, write]);

  // Start a fresh reaction each time the robot comes into view after the previous one finished.
  useEffect(() => {
    if (!inView || reduced) return;
    const c = clock.current;
    if (c.reaction < 0 || c.reaction >= preset.duration) c.reaction = 0;
  }, [inView, reduced, preset.duration]);

  // One rAF loop per robot, running only while it is visible.
  useEffect(() => {
    if (!playing) return;
    const root = ref.current;
    if (root) scale.current = Math.max(0.1, root.offsetWidth / 200);
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      clock.current.reaction += dt;
      clock.current.idle += dt;
      frame();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, frame]);

  // Re-apply after React re-renders the SVG for an expression change (it resets the arm transforms).
  useLayoutEffect(() => {
    if (!reduced && clock.current.reaction >= 0) frame();
  }, [expression, reduced, frame]);

  // Reduced motion (including switching it on mid-session): settle into the static pose.
  useEffect(() => {
    if (!reduced) return;
    clock.current.reaction = -1;
    write(staticPose(preset));
    expressionRef.current = preset.expression;
    setExpression(preset.expression);
  }, [reduced, preset, write]);

  return (
    <div ref={ref} data-nova={name} className={cn("will-change-transform", className)}>
      <RobotMascot arm={preset.arm} expression={expression} talking={talking} chest={chest} label={label} glow={false} />
    </div>
  );
}

/**
 * Returns a function that writes one NovaPose straight onto the robot's SVG `data-part`
 * groups inside `ref` (no React render). Shared by every non-hero NOVA controller.
 * `scale` holds the rendered width / 200, used to turn travel distance into wheel rotation.
 */
export function useNovaWriter(ref: React.RefObject<HTMLDivElement | null>, scale: React.RefObject<number>) {
  const parts = useRef<Record<string, SVGGElement | null> | null>(null);
  return useCallback(
    (pose: NovaPose) => {
      const root = ref.current;
      if (!root) return;
      if (!parts.current) {
        const q = (p: string) => root.querySelector<SVGGElement>(`[data-part="${p}"]`);
        parts.current = Object.fromEntries(
          ["wheel-left", "wheel-right", "body", "arm-left", "arm-right", "head", "antenna", "eyes", "eye-glow", "mouth"].map((p) => [p, q(p)]),
        );
      }
      const part = parts.current;
      const r = (n: number) => Math.round(n * 100) / 100;

      root.style.transform = pose.x || pose.y ? `translate3d(${r(pose.x)}px, ${r(pose.y)}px, 0)` : "";
      const wheel = r((pose.x / scale.current / WHEEL_RADIUS) * (180 / Math.PI));
      part["wheel-left"]?.setAttribute("transform", `rotate(${wheel} 66 204)`);
      part["wheel-right"]?.setAttribute("transform", `rotate(${wheel} 134 204)`);

      const upper = `rotate(${r(pose.lean)} 100 204) translate(0 ${r(pose.bodyY)})`;
      part.body?.setAttribute("transform", upper);
      part["arm-left"]?.setAttribute("transform", `${upper} rotate(${r(pose.armLeft)} 54 138)`);
      part["arm-right"]?.setAttribute("transform", `${upper} rotate(${r(pose.armRight)} 146 138)`);
      part.head?.setAttribute("transform", `rotate(${r(pose.lean)} 100 204) translate(0 ${r(pose.bodyY * 1.2)}) rotate(${r(pose.tilt)} 100 116)`);
      part.antenna?.setAttribute("transform", `rotate(${r(pose.antenna)} 100 30)`);
      part.eyes?.setAttribute("transform", `translate(${r(pose.lookX)} ${r(pose.lookY)}) translate(0 68) scale(1 ${r(pose.blink)}) translate(0 -68)`);
      part["eye-glow"]?.setAttribute("opacity", String(r(Math.min(0.85, pose.eyeGlow))));
      // Talking mouth: bars only exist while <RobotMascot talking>, so query them each frame.
      if (pose.mouth) {
        part.mouth?.querySelectorAll("rect").forEach((bar, i) => {
          bar.setAttribute("transform", `translate(0 89) scale(1 ${r(pose.mouth!(i))}) translate(0 -89)`);
        });
      }
    },
    [ref, scale],
  );
}
