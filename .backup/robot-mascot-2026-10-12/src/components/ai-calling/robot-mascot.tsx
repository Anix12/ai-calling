"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * NOVA — the LeadsZone AI robot, the single mascot used across the page.
 *
 * Layered SVG (gradients, specular highlights, glow filters) so it reads as a glossy 3D
 * character while every moving part stays addressable as <g data-part="…">:
 *   head      pivot (100, 116)  – tilt / nod
 *   antenna   pivot (100, 30)   – wobble
 *   arm-left  pivot (54, 138)   – rotation driven by `arm`
 *   arm-right pivot (146, 138)
 *   body      –                 – suspension bounce / lean around the axle (100, 204)
 *   eyes      centre (100, 68)  – blink (scaleY) / look (translate) / expression swap
 *   eye-glow  –                 – glow reaction (opacity, 0 when static)
 *   mouth     centre y 89       – talking bars (each <rect> scaled)
 *   chest-wave                  – chest waveform bars (ready for later animation)
 *   wheel-left / wheel-right    – spin around (66, 204) / (134, 204); radius WHEEL_RADIUS
 *
 * The hero (hero-demo.tsx) drives these parts imperatively from one timeline; static
 * uses elsewhere on the page simply render the pose given by props.
 *
 * Client component only because gradient ids must be unique per instance (useId);
 * duplicate ids break fills when an earlier copy is hidden (e.g. display:none on mobile).
 */

export type RobotExpression = "neutral" | "happy" | "focused";
export type RobotArm = "rest" | "wave" | "raise" | "point" | "catch" | "open";

/** Wheel radius in SVG units — used to turn travel distance into wheel rotation. */
export const WHEEL_RADIUS = 22;

/** Arm rotations (degrees) about the shoulder pivots for each named pose. */
export const armAngles: Record<RobotArm, [left: number, right: number]> = {
  rest: [14, -14],
  wave: [14, -125],
  raise: [125, -125],
  point: [14, -96],
  /** Left arm up, ready to catch something arriving from the left. */
  catch: [118, -14],
  /** Both arms slightly open: a confident, welcoming stance. */
  open: [55, -55],
};

const mouthBars = [5, 9, 13, 8, 11, 6, 4];
const chestBars = [6, 11, 17, 23, 14, 20, 12, 8, 5];

export function RobotMascot({
  expression = "neutral",
  arm = "rest",
  talking,
  chest,
  label,
  glow = true,
  className,
}: {
  expression?: RobotExpression;
  arm?: RobotArm;
  /** Shows a voice-waveform mouth instead of a smile. */
  talking?: boolean;
  /** Short text on the chest display (e.g. a language code). Defaults to a voice waveform. */
  chest?: string;
  /** Accessible name. Omit when the robot is decorative (the default). */
  label?: string;
  /** Floor glow under the wheels. */
  glow?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `nova-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const [leftAngle, rightAngle] = armAngles[arm];

  const shell = url("shell");
  const edge = url("edge");

  return (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      className={cn("h-auto w-full overflow-visible", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <defs>
        <radialGradient id={id("shell")} cx="0.34" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f6f4fd" />
          <stop offset="0.8" stopColor="#dcd6ef" />
          <stop offset="1" stopColor="#bdb4dc" />
        </radialGradient>
        <linearGradient id={id("edge")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c4bbe3" />
        </linearGradient>
        <linearGradient id={id("visor")} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#2a2050" />
          <stop offset="0.55" stopColor="#120c28" />
          <stop offset="1" stopColor="#06040f" />
        </linearGradient>
        <linearGradient id={id("accent")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8b4fe" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={id("eye")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#faf5ff" />
          <stop offset="0.45" stopColor="#e9d5ff" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <radialGradient id={id("dark")} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#4a4068" />
          <stop offset="0.6" stopColor="#1d1734" />
          <stop offset="1" stopColor="#0c0918" />
        </radialGradient>
        <radialGradient id={id("hub")} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c9c2e3" />
        </radialGradient>
        <radialGradient id={id("floor")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.45" />
          <stop offset="0.65" stopColor="#c4b5fd" stopOpacity="0.15" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0" />
        </radialGradient>
        <filter id={id("soft")} x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={id("glow")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {glow && <ellipse cx="100" cy="226" rx="82" ry="13" fill={url("floor")} />}
      <ellipse cx="100" cy="225" rx="56" ry="6" fill="#2e1065" opacity="0.2" />

      {/* Wheels sit behind the body */}
      {[66, 134].map((cx, i) => (
        <g key={cx} data-part={i === 0 ? "wheel-left" : "wheel-right"}>
          <circle cx={cx} cy="204" r={WHEEL_RADIUS} fill={url("dark")} />
          <circle cx={cx} cy="204" r="16.5" stroke={url("accent")} strokeWidth="3.4" filter={url("glow")} />
          <circle cx={cx} cy="204" r="11" fill={url("hub")} />
          {[0, 120, 240].map((a) => (
            <path key={a} d={`M${cx} 204v-8.5`} stroke="#8e86b3" strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${a} ${cx} 204)`} />
          ))}
          <circle cx={cx} cy="204" r="3.6" fill={url("accent")} />
        </g>
      ))}

      {/* Arms (rendered before the body so shoulders tuck in) */}
      <g data-part="arm-left" transform={`rotate(${leftAngle} 54 138)`}>
        <rect x="46" y="132" width="16" height="36" rx="8" fill={shell} stroke={edge} />
        <rect x="47" y="156" width="14" height="4" rx="2" fill={url("accent")} opacity="0.85" />
        <circle cx="54" cy="174" r="8.5" fill={url("dark")} />
        <circle cx="51.5" cy="171" r="2.4" fill="#fff" opacity="0.35" />
      </g>
      <g data-part="arm-right" transform={`rotate(${rightAngle} 146 138)`}>
        <rect x="138" y="132" width="16" height="36" rx="8" fill={shell} stroke={edge} />
        <rect x="139" y="156" width="14" height="4" rx="2" fill={url("accent")} opacity="0.85" />
        <circle cx="146" cy="174" r="8.5" fill={url("dark")} />
        <circle cx="143.5" cy="171" r="2.4" fill="#fff" opacity="0.35" />
      </g>

      {/* Body */}
      <g data-part="body">
        <path
          d="M64 120H136Q150 120 149 136L144 186Q142 208 120 208H80Q58 208 56 186L51 136Q50 120 64 120Z"
          fill={shell}
          stroke={edge}
          strokeWidth="1.5"
        />
        <path d="M62 136Q65 125 82 124" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.95" />
        <rect x="56.5" y="140" width="3" height="32" rx="1.5" fill={url("accent")} filter={url("glow")} />
        <rect x="140.5" y="140" width="3" height="32" rx="1.5" fill={url("accent")} filter={url("glow")} />
        <rect x="73" y="141" width="54" height="38" rx="14" fill={url("visor")} />
        <rect x="73.5" y="141.5" width="53" height="37" rx="13.5" stroke={url("accent")} strokeOpacity="0.55" />
        <path d="M80 147q6-3 14-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.18" />
        {chest ? (
          <text
            x="100"
            y="165.5"
            textAnchor="middle"
            fontFamily="var(--font-geist), ui-sans-serif, system-ui"
            fontSize="15"
            fontWeight="700"
            letterSpacing="1"
            fill={url("eye")}
            filter={url("glow")}
          >
            {chest}
          </text>
        ) : (
          <g data-part="chest-wave" filter={url("glow")}>
            {chestBars.map((h, i) => (
              <rect key={i} x={81 + i * 4.6} y={160 - h / 2} width="2.6" height={h} rx="1.3" fill={url("eye")} />
            ))}
          </g>
        )}
      </g>

      {/* Head */}
      <g data-part="head">
        <rect x="86" y="104" width="28" height="18" rx="7" fill={url("dark")} />
        <rect x="84" y="113" width="32" height="4.5" rx="2.25" fill={url("accent")} filter={url("glow")} />

        <g data-part="antenna">
          <ellipse cx="100" cy="28" rx="8" ry="3.5" fill="#d9d4ec" />
          <path d="M100 28V13" stroke="#cfc9e6" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="100" cy="9" r="6.5" fill={url("accent")} filter={url("glow")} />
          <circle cx="98" cy="7" r="2" fill="#fff" opacity="0.85" />
        </g>

        <rect x="30" y="26" width="140" height="90" rx="44" fill={shell} stroke={edge} strokeWidth="1.5" />
        <path d="M54 42Q72 30 100 30" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="148" cy="96" rx="14" ry="7" fill="#b9b0d8" opacity="0.25" />

        {/* Headset ear pods + mic boom: NOVA is a calling robot */}
        {[28, 172].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="72" r="15" fill={url("dark")} />
            <circle cx={cx} cy="72" r="10" stroke={url("accent")} strokeWidth="3.6" filter={url("glow")} />
            <circle cx={cx} cy="72" r="4" fill="#f5f3ff" />
          </g>
        ))}
        <path d="M171 86c2 14-10 22-34 23" stroke="#1d1734" strokeWidth="3" strokeLinecap="round" />
        <circle cx="136" cy="109" r="4.2" fill={url("accent")} filter={url("glow")} />

        <rect x="42" y="40" width="116" height="64" rx="30" fill={url("visor")} />
        <rect x="42.5" y="40.5" width="115" height="63" rx="29.5" stroke={url("accent")} strokeOpacity="0.35" />
        <path d="M58 52Q64 45 80 45H104" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.16" />

        <ellipse data-part="eye-glow" cx="100" cy="70" rx="44" ry="16" fill="#a855f7" opacity="0" filter={url("soft")} />
        <g data-part="eyes" filter={url("glow")}>
          {expression === "happy" ? (
            <>
              <path d="M66 76q10-13 20 0" stroke={url("eye")} strokeWidth="6.5" strokeLinecap="round" />
              <path d="M114 76q10-13 20 0" stroke={url("eye")} strokeWidth="6.5" strokeLinecap="round" />
            </>
          ) : expression === "focused" ? (
            <>
              <rect x="67" y="63" width="19" height="11" rx="5.5" fill={url("eye")} />
              <rect x="114" y="63" width="19" height="11" rx="5.5" fill={url("eye")} />
            </>
          ) : (
            <>
              <rect x="67" y="55" width="18" height="26" rx="9" fill={url("eye")} />
              <rect x="115" y="55" width="18" height="26" rx="9" fill={url("eye")} />
            </>
          )}
        </g>

        <g data-part="mouth">
          {talking ? (
            mouthBars.map((h, i) => <rect key={i} x={86 + i * 4.4} y={89 - h / 2} width="2.4" height={h} rx="1.2" fill={url("eye")} />)
          ) : (
            <path d="M91 89q9 7 18 0" stroke={url("eye")} strokeWidth="3.2" strokeLinecap="round" />
          )}
        </g>
      </g>
    </svg>
  );
}
