"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * NOVA — the LeadsZone AI Calling mascot: a baby Siberian Husky with a purple calling headset
 * and the LeadsZone AI growth logo on its shirt. Used in every section of the page.
 *
 * Layered SVG (gradients only, no filters, so per-frame transforms stay cheap). The component
 * name, props and every animation hook are unchanged from the original robot, so all writers,
 * story clocks and geometry helpers keep working:
 *   head        pivot (100, 116)  – tilt / nod (ears, face, headset move with it)
 *   antenna     pivot (100, 30)   – the fur tuft on top of the head (wobble)
 *   arm-left    pivot (54, 138)   – rotation driven by `arm`; paw centre 36 units below the pivot
 *   arm-right   pivot (146, 138)
 *   body        –                 – shirt, logo and tail; bounce / lean around (100, 204)
 *   eyes        centre (100, 68)  – blink (scaleY) / look (translate) / expression swap
 *   eye-glow    –                 – cheek blush reaction (opacity, 0 when static)
 *   mouth       centre y 89       – while talking, its single <rect> is scaled open/closed;
 *                                   resting mouths are paths, so writers leave them alone
 *   chest-wave                    – the shirt logo group (kept for later animation)
 *   wheel-left / wheel-right      – the two feet (legs + paws). Writers still encode travel as a
 *                                   wheel rotation; `PawStepper` turns it into stepping.
 *
 * Client component only because gradient ids must be unique per instance (useId);
 * duplicate ids break fills when an earlier copy is hidden (e.g. display:none on mobile).
 */

export type RobotExpression = "neutral" | "happy" | "focused";
export type RobotArm = "rest" | "wave" | "raise" | "point" | "catch" | "open";

/**
 * Travel is still passed around as a wheel rotation (distance / WHEEL_RADIUS, in degrees) so
 * existing writers and story maths stay untouched; `PawStepper` converts it back to distance.
 */
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

/** The provided LeadsZone AI growth logo (unmodified asset). */
const LOGO_SRC = "/brand/leadszone-ai-growth-logo.png";

/** Length of one full step cycle, in SVG units of travel. */
const STEP_LENGTH = 26;

/**
 * Turns the writers' wheel rotation (accumulated travel) into alternating paw steps.
 * Step height follows travel speed and eases back to zero when NOVA stops, so the paws
 * always land flat — no sliding wheels, and no paw left hanging in the air.
 */
export class PawStepper {
  private last: number | null = null;
  private amp = 0;

  /** `wheelDeg`: the travel the writer computed, as a wheel rotation. Returns [left, right] transforms. */
  update(wheelDeg: number): [string, string] {
    const dist = ((wheelDeg * Math.PI) / 180) * WHEEL_RADIUS;
    const speed = this.last === null ? 0 : Math.abs(dist - this.last);
    this.last = dist;
    // Ease the stride in while moving and out when still (≈ 0.2 s either way).
    this.amp += (Math.min(1, speed * 1.4) - this.amp) * 0.22;
    if (this.amp < 0.01) return ["translate(0 0)", "translate(0 0)"];
    const p = (dist / STEP_LENGTH) * Math.PI * 2;
    const lift = (s: number) => 6 * this.amp * Math.max(0, s);
    const swing = (s: number) => 2.5 * this.amp * s;
    const r = (n: number) => Math.round(n * 100) / 100;
    return [
      `translate(${r(swing(Math.cos(p)))} ${r(-lift(Math.sin(p)))})`,
      `translate(${r(swing(-Math.cos(p)))} ${r(-lift(-Math.sin(p)))})`,
    ];
  }
}

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
  /** Shows an open, talking mouth (animated by the writers) instead of the resting smile. */
  talking?: boolean;
  /** Short text on a badge under the shirt logo (e.g. a language code). */
  chest?: string;
  /** Accessible name. Omit when the mascot is decorative (the default). */
  label?: string;
  /** Floor glow under the paws. */
  glow?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `nova-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const [leftAngle, rightAngle] = armAngles[arm];

  const fur = url("fur");
  const white = url("white");
  const shirt = url("shirt");
  const purple = url("purple");
  const pad = "#3a2f3d";

  return (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      className={cn("h-auto w-full overflow-visible", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <defs>
        <linearGradient id={id("fur")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e7186" />
          <stop offset="0.6" stopColor="#4d5064" />
          <stop offset="1" stopColor="#3d3f50" />
        </linearGradient>
        <radialGradient id={id("white")} cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f4f3f8" />
          <stop offset="1" stopColor="#dcdae6" />
        </radialGradient>
        <linearGradient id={id("shirt")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f6f3ff" />
          <stop offset="1" stopColor="#e3dcf7" />
        </linearGradient>
        <linearGradient id={id("purple")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="0.5" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
        <radialGradient id={id("iris")} cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#9fdcff" />
          <stop offset="0.55" stopColor="#2f86e6" />
          <stop offset="1" stopColor="#123f99" />
        </radialGradient>
        <radialGradient id={id("blush")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff8fb3" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ff8fb3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("mouth")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a1d3a" />
          <stop offset="0.55" stopColor="#7d2950" />
          <stop offset="1" stopColor="#f07fa0" />
        </linearGradient>
        <radialGradient id={id("cup")} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#3b1580" />
        </radialGradient>
        <radialGradient id={id("floor")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="0.65" stopColor="#c4b5fd" stopOpacity="0.15" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0" />
        </radialGradient>
      </defs>

      {glow && <ellipse cx="100" cy="226" rx="82" ry="13" fill={url("floor")} />}
      <ellipse cx="100" cy="222" rx="58" ry="6" fill="#2e1065" opacity="0.18" />

      {/* Feet (legs + paws). Kept under the old wheel hooks; writers make them step. */}
      {[66, 134].map((cx, i) => (
        <g key={cx} data-part={i === 0 ? "wheel-left" : "wheel-right"}>
          <rect x={cx - 13} y="184" width="26" height="26" rx="12" fill={white} />
          <ellipse cx={cx} cy="210" rx="17" ry="10.5" fill={white} stroke="#d6d3e3" strokeWidth="1" />
          {[-8, 0, 8].map((dx) => (
            <path key={dx} d={`M${cx + dx} 213v5`} stroke="#c9c5d8" strokeWidth="1.4" strokeLinecap="round" />
          ))}
        </g>
      ))}

      {/* Arms (rendered before the body so the shoulders tuck in). Paw centre: 36 below the pivot. */}
      {(
        [
          ["arm-left", 54, leftAngle],
          ["arm-right", 146, rightAngle],
        ] as const
      ).map(([part, px, angle]) => (
        <g key={part} data-part={part} transform={`rotate(${angle} ${px} 138)`}>
          <rect x={px - 9.5} y="140" width="19" height="34" rx="9.5" fill={fur} />
          <rect x={px - 7} y="150" width="14" height="24" rx="7" fill={white} opacity="0.95" />
          <path d={`M${px - 12} 140Q${px - 13} 126 ${px} 125Q${px + 13} 126 ${px + 12} 140L${px + 11} 147H${px - 11}Z`} fill={shirt} stroke="#e4defa" />
          <path d={`M${px - 11.5} 145.5H${px + 11.5}`} stroke={purple} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx={px} cy="174" r="11.5" fill={white} stroke="#d6d3e3" strokeWidth="1" />
          <ellipse cx={px} cy="177.5" rx="5" ry="3.9" fill={pad} />
          {[-5.4, 0, 5.4].map((dx) => (
            <ellipse key={dx} cx={px + dx} cy={dx === 0 ? 169.2 : 170.6} rx="1.9" ry="2.2" fill={pad} />
          ))}
        </g>
      ))}

      {/* Body: tail, shirt and logo */}
      <g data-part="body">
        {/* Fluffy curled tail behind the body */}
        <path
          d="M140 196C162 200 186 186 186 160C186 140 172 128 162 134C172 140 174 156 166 168C158 178 146 180 138 178Z"
          fill={fur}
        />
        <path d="M166 168C174 156 172 140 162 134C176 132 188 146 184 166C181 178 172 186 160 190C164 184 166 176 166 168Z" fill={white} />

        <path
          d="M66 113Q100 122 134 113Q153 120 152 146Q151 194 122 203H78Q49 194 48 146Q47 120 66 113Z"
          fill={shirt}
          stroke="#e4defa"
          strokeWidth="1.2"
        />
        <path d="M58 136Q61 124 76 119" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
        {/* Purple collar / hood trim and hem */}
        <path d="M68 114Q100 131 132 114" stroke={purple} strokeWidth="7" strokeLinecap="round" />
        <path d="M55 192Q100 207 145 192" stroke={purple} strokeWidth="4" strokeLinecap="round" opacity="0.9" />

        <g data-part="chest-wave">
          {/* Multiply blending drops the PNG's white backdrop so only the purple logo shows. */}
          <image
            href={LOGO_SRC}
            x="73"
            y={chest ? 131 : 135}
            width="54"
            height="54"
            preserveAspectRatio="xMidYMid meet"
            style={{ mixBlendMode: "multiply" }}
          />
        </g>
        {chest && (
          <g>
            <rect x="86" y="184" width="28" height="12" rx="6" fill={purple} />
            <text
              x="100"
              y="193"
              textAnchor="middle"
              fontFamily="var(--font-geist), ui-sans-serif, system-ui"
              fontSize="8.5"
              fontWeight="700"
              letterSpacing="0.6"
              fill="#ffffff"
            >
              {chest}
            </text>
          </g>
        )}
      </g>

      {/* Head */}
      <g data-part="head">
        {/* Neck fluff */}
        <ellipse cx="100" cy="112" rx="26" ry="9" fill={white} />

        {/* Fur tuft on top of the head (the old antenna hook) */}
        <g data-part="antenna">
          <path d="M90 22C92 12 98 8 100 3C102 9 106 12 110 22Z" fill={fur} />
          <path d="M96 20C97 13 100 10 101 7" stroke="#8b8ea3" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* Ears */}
        <path d="M42 54L30 -10Q32 -17 39 -13L84 20Z" fill={fur} />
        <path d="M47 44L37 -1L71 21Z" fill="#f3b4c6" />
        <path d="M44 22L35 -6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <path d="M158 54L170 -10Q168 -17 161 -13L116 20Z" fill={fur} />
        <path d="M153 44L163 -1L129 21Z" fill="#f3b4c6" />
        <path d="M156 22L165 -6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.35" />

        {/* Head: dark Husky cap, fluffy cheeks */}
        <ellipse cx="100" cy="64" rx="61" ry="50" fill={fur} />
        <path d="M42 74C30 82 30 98 42 106C41 99 45 96 50 100C49 92 55 90 59 95C58 88 62 86 64 90L60 70Z" fill={white} />
        <path d="M158 74C170 82 170 98 158 106C159 99 155 96 150 100C151 92 145 90 141 95C142 88 138 86 136 90L140 70Z" fill={white} />
        {/* White Husky face mask with the forehead stripe and brow spots */}
        <path
          d="M100 30C93 30 89 40 88 50C76 43 54 47 49 66C45 85 58 104 78 110C88 114 112 114 122 110C142 104 155 85 151 66C146 47 124 43 112 50C111 40 107 30 100 30Z"
          fill={white}
        />
        <ellipse cx="76" cy="47" rx="7.5" ry="4" fill={white} />
        <ellipse cx="124" cy="47" rx="7.5" ry="4" fill={white} />
        <path d="M70 22Q84 14 100 15" stroke="#8b8ea3" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

        {/* Headset: band over the head, glowing purple ear cups, mic boom */}
        <path d="M40 72Q40 14 100 12Q160 14 160 72" stroke={purple} strokeWidth="6.5" strokeLinecap="round" />
        {[40, 160].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="74" r="15" fill={url("cup")} />
            <circle cx={cx} cy="74" r="10" stroke="#c4b5fd" strokeWidth="2.6" />
            <circle cx={cx} cy="74" r="4.5" fill="#ede9fe" />
          </g>
        ))}
        <path d="M157 88C156 98 146 102 130 101" stroke="#4c1d95" strokeWidth="3" strokeLinecap="round" />
        <circle cx="128" cy="101" r="4.4" fill={purple} />

        {/* Cheek blush: the old eye-glow hook, faded in on reactions */}
        <g data-part="eye-glow" opacity="0">
          <ellipse cx="67" cy="88" rx="10" ry="6" fill={url("blush")} />
          <ellipse cx="133" cy="88" rx="10" ry="6" fill={url("blush")} />
        </g>

        <g data-part="eyes" data-expression={expression}>
          {expression === "happy" ? (
            <>
              <path d="M67 71Q78 59 89 71" stroke="#1d1730" strokeWidth="4" strokeLinecap="round" />
              <path d="M111 71Q122 59 133 71" stroke="#1d1730" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : (
            [78, 122].map((cx) => {
              const focused = expression === "focused";
              return (
                <g key={cx}>
                  <ellipse cx={cx} cy={focused ? 70 : 68} rx="12" ry={focused ? 9 : 13} fill="#1d1730" />
                  <ellipse cx={cx} cy={focused ? 70.5 : 68.5} rx="10.2" ry={focused ? 7.6 : 11.2} fill={url("iris")} />
                  <circle cx={cx + 0.5} cy={focused ? 71 : 69.5} r={focused ? 4 : 5} fill="#0b1020" />
                  <circle cx={cx + 3.6} cy={focused ? 67 : 63.8} r={focused ? 2.4 : 3.3} fill="#fff" />
                  <circle cx={cx - 3.4} cy={focused ? 73 : 73.4} r="1.4" fill="#fff" opacity="0.9" />
                  {focused && <path d={`M${cx - 12} 63Q${cx} 59 ${cx + 12} 63`} stroke="#3d3f50" strokeWidth="2.4" strokeLinecap="round" />}
                </g>
              );
            })
          )}
        </g>

        {/* Muzzle and nose */}
        <ellipse cx="100" cy="88" rx="19" ry="12.5" fill={white} />
        <path d="M92.5 78Q100 74.5 107.5 78Q106 84.5 100 86Q94 84.5 92.5 78Z" fill="#1d1b26" />
        <ellipse cx="97.5" cy="78.6" rx="2.6" ry="1.3" fill="#fff" opacity="0.55" />

        <g data-part="mouth">
          <path d="M100 86V88" stroke="#1d1b26" strokeWidth="1.8" strokeLinecap="round" />
          {talking ? (
            // One rect only: the writers scale every rect in this group to open and close the mouth.
            <rect x="91.5" y="84" width="17" height="10" rx="5" fill={url("mouth")} />
          ) : expression === "happy" ? (
            <path d="M89 88Q100 101 111 88Q100 92 89 88Z" fill="#7d2950" stroke="#1d1b26" strokeWidth="1.4" strokeLinejoin="round" />
          ) : (
            <path d="M90 88Q95 93 100 88Q105 93 110 88" stroke="#1d1b26" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </g>
      </g>
    </svg>
  );
}
