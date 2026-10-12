"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useMotionValueEvent } from "motion/react";
import { AudioLines, Bot, Languages, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { conversationMeaning, conversations, conversationSpeakers, languages, previewLanguage } from "@/data/ai-calling";
import { Glass, Platform, PreviewTag, RobotSlot } from "./primitives";
import { RobotMascot } from "./robot-mascot";
import { useNovaWriter } from "./animated-nova";
import { useStoryClock } from "./story-clock";
import { StoryControls } from "./story-controls";
import {
  LANG_FINAL,
  LANG_TOTAL,
  barNoise,
  callLevel,
  callSeconds,
  callStatus,
  haloAt,
  langCues,
  langNovaExpression,
  langNovaPose,
  langNovaTalking,
  lineCues,
  reachedL,
  type Gaze,
  type LangPhase,
} from "./multilingual-timeline";

type Language = (typeof languages)[number];

const r2 = (n: number) => Math.round(n * 1000) / 1000;
const WAVE_BARS = 32;
const waveBase = Array.from({ length: WAVE_BARS }, (_, i) => 0.45 + 0.55 * Math.abs(Math.sin(i * 1.37) * Math.cos(i * 0.41)));
const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const reveal = (on: boolean) =>
  cn("transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none", on ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0");

/** Fixed orbit positions (labels never move or rotate): Hindi at the top, clockwise. */
const orbitAngle = (i: number) => (i / languages.length) * Math.PI * 2 - Math.PI / 2;
/** Orbit offsets as CSS variables, applied only from `sm` up (phones use the grid). */
const orbitPos = (i: number) =>
  ({ "--ox": `${50 + 42 * Math.cos(orbitAngle(i))}%`, "--oy": `${48 + 40 * Math.sin(orbitAngle(i))}%` }) as React.CSSProperties;

const bubbleTints = [
  "from-pink-50 to-white text-pink-700",
  "from-nova-50 to-white text-nova-700",
  "from-sky-50 to-white text-sky-700",
  "from-orange-50 to-white text-orange-700",
  "from-teal-50 to-white text-teal-700",
  "from-fuchsia-50 to-white text-fuchsia-700",
  "from-indigo-50 to-white text-indigo-700",
  "from-violet-50 to-white text-violet-700",
  "from-emerald-50 to-white text-emerald-700",
];

/**
 * Multilingual AI demo. Nine real toggle buttons pick the language; each choice restarts one
 * story clock that drives the halo sweep, the conversation, the waveform and NOVA. Per-frame
 * values are written to the DOM; React re-renders only on a new language or a story cue.
 */
export function MultilingualStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { time, phase, reduced, userPaused, replay, togglePause } = useStoryClock(rootRef, {
    total: LANG_TOTAL,
    finalFrame: LANG_FINAL,
    phaseAt: langCues.phaseAt,
    amount: 0.25,
  });

  const [code, setCode] = useState(() => (languages.find((l) => l.name === previewLanguage) ?? languages[0]).code);
  const active = languages.findIndex((l) => l.code === code);
  const lang = languages[active];

  const robotRef = useRef<HTMLDivElement>(null);
  const robotBoxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const scale = useRef(1);
  const gaze = useRef<Gaze>({ lang: { x: 0, y: -1 }, panel: { x: 1, y: 0 } });
  const activeRef = useRef(active);
  activeRef.current = active;
  const writeNova = useNovaWriter(robotRef, scale);

  const apply = useCallback(
    (t: number) => {
      writeNova(langNovaPose(t, gaze.current));
      const n = languages.length;
      listRef.current?.querySelectorAll<HTMLElement>("[data-halo]").forEach((el) => {
        const i = Number(el.dataset.halo);
        el.style.opacity = String(r2(haloAt(t, (i - activeRef.current + n) % n, n)));
      });
      const level = callLevel(t);
      waveRef.current?.childNodes.forEach((bar, i) => {
        (bar as HTMLElement).style.transform = `scaleY(${r2(0.1 + 0.9 * level * waveBase[i] * (0.35 + 0.65 * barNoise(i, t)))})`;
      });
      if (timerRef.current) timerRef.current.textContent = fmt(callSeconds(t));
    },
    [writeNova],
  );

  useMotionValueEvent(time, "change", apply);

  /** Directions from NOVA's face to the selected language and to the conversation panel. */
  const measure = useCallback(() => {
    const box = robotBoxRef.current;
    if (!box) return;
    const b = box.getBoundingClientRect();
    scale.current = Math.max(0.1, b.width / 200);
    const face = { x: b.left + b.width / 2, y: b.top + b.height * 0.3 };
    const unit = (el: Element | null | undefined, fallback: { x: number; y: number }) => {
      if (!el) return fallback;
      const r = el.getBoundingClientRect();
      const dx = r.left + r.width / 2 - face.x;
      const dy = r.top + r.height / 2 - face.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: dx / len, y: dy / len };
    };
    gaze.current = {
      lang: unit(listRef.current?.querySelector(`[data-lang-button="${activeRef.current}"]`), { x: 0, y: -1 }),
      panel: unit(panelRef.current, { x: 1, y: 0 }),
    };
    apply(time.get());
  }, [apply, time]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // A new language changes where NOVA looks; re-measure in the same frame.
  useLayoutEffect(() => measure(), [code, measure]);

  const expression = langNovaExpression(phase);
  const talking = langNovaTalking(phase);
  useLayoutEffect(() => apply(time.get()), [expression, talking, apply, time]);

  const choose = (next: string) => {
    if (next === code) return;
    setCode(next);
    // Restart the story for the new language. Paused visitors see the finished conversation
    // instead of an empty panel; under reduced motion the clock already rests on the final frame.
    if (!reduced) time.set(userPaused ? LANG_FINAL : 0);
  };

  return (
    <div ref={rootRef} data-lang-phase={phase} data-lang={code} className="min-w-0">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-8">
        {/* ---------------- Orbit (sm+) / grid (phones) ---------------- */}
        <div className="relative mx-auto w-full max-w-[460px] sm:mb-12 sm:aspect-square">
          <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
            <div className="absolute inset-[4%] rounded-full border border-nova-200/70" />
            <div className="absolute inset-[20%] rounded-full border border-dashed border-nova-300/70" />
            <div className="absolute inset-[24%] rounded-full bg-[radial-gradient(circle,rgb(196_181_253/0.45)_1px,transparent_1.5px)] [background-size:10px_10px] [mask-image:radial-gradient(circle,black_40%,transparent_72%)]" />
            {/* Glowing spoke from NOVA to the selected language */}
            <span
              style={{ transform: `rotate(${orbitAngle(active)}rad)` }}
              className="absolute top-[48%] left-1/2 h-[2px] w-[34%] origin-left rounded-full bg-gradient-to-r from-nova-300/0 via-nova-400 to-nova-500 shadow-[0_0_10px_rgb(139_92_246/0.7)] transition-transform duration-500 ease-out motion-reduce:transition-none"
            />
          </div>

          <div
            ref={robotBoxRef}
            className="relative mx-auto mb-6 w-[150px] sm:absolute sm:top-1/2 sm:left-1/2 sm:mb-0 sm:w-[34%] sm:-translate-x-1/2 sm:-translate-y-[54%]"
          >
            <Platform className="-bottom-[22%] left-1/2 h-[42%] w-[150%] -translate-x-1/2" />
            <RobotSlot name="multilingual">
              <div ref={robotRef} data-nova="multilingual-story" className="will-change-transform">
                <RobotMascot arm="rest" chest={lang.code} expression={expression} talking={talking} glow={false} />
              </div>
            </RobotSlot>
          </div>

          <div role="group" aria-label="Choose a language for the sample conversation">
            <ul ref={listRef} className="grid grid-cols-3 gap-2 sm:block">
              {languages.map((l, i) => (
                <li key={l.code} className="sm:contents">
                  <LanguageButton lang={l} index={i} active={i === active} onSelect={() => choose(l.code)} />
                </li>
              ))}
            </ul>
          </div>

          <span
            aria-hidden
            className="absolute -bottom-12 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold whitespace-nowrap text-nova-ink shadow-nova ring-1 ring-nova-100 sm:inline-flex"
          >
            <AudioLines className="size-4 text-nova-600" />
            <span>
              <span className="text-nova-700">NOVA</span> speaks nine languages
            </span>
          </span>
        </div>

        <ConversationPanel lang={lang} phase={phase} panelRef={panelRef} waveRef={waveRef} timerRef={timerRef} />
      </div>

      <LanguageStrip active={active} />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <PreviewTag>Illustrative multilingual conversation · no live audio</PreviewTag>
        {!reduced && <StoryControls paused={userPaused} onTogglePause={togglePause} onReplay={replay} label="multilingual conversation" />}
      </div>

      <p className="sr-only">
        Choose any of the nine languages to see the same short sample enquiry call in that language, with an English translation:
        the AI greets the lead about their enquiry, the lead asks for more information, the AI offers a call back from the team,
        and the lead agrees. This is an illustration, with no live audio or real call.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Language buttons                                                     */
/* ------------------------------------------------------------------ */

function LanguageButton({ lang, index, active, onSelect }: { lang: Language; index: number; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      data-lang-button={index}
      aria-pressed={active}
      onClick={onSelect}
      style={orbitPos(index)}
      className={cn(
        "group relative flex w-full flex-col items-center justify-center rounded-2xl py-2 text-center transition-[transform,box-shadow,background-color] duration-300 motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nova-600",
        "sm:absolute sm:top-[var(--oy)] sm:left-[var(--ox)] sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-full sm:py-0",
        active
          ? "bg-gradient-to-br from-nova-500 to-nova-700 text-white shadow-[0_0_0_4px_rgb(237_233_254),0_14px_30px_-10px_rgb(124_58_237/0.8)] sm:size-[92px]"
          : cn("bg-gradient-to-b shadow-nova ring-1 ring-white hover:scale-105 sm:size-[74px]", bubbleTints[index % bubbleTints.length]),
      )}
    >
      {/* Halo for the gentle sweep around the orbit (opacity driven per frame) */}
      <span aria-hidden data-halo={index} style={{ opacity: 0 }} className="pointer-events-none absolute -inset-1.5 rounded-[inherit] ring-2 ring-nova-400 shadow-[0_0_24px_rgb(139_92_246/0.6)]" />
      <span aria-hidden lang={lang.lang} className={cn("leading-none font-bold", active ? "text-[24px] sm:text-[30px]" : "text-[20px] sm:text-[24px]")}>
        {lang.glyph}
      </span>
      <span className={cn("mt-1 text-[11px] font-semibold", active ? "text-white" : "text-nova-ink")}>{lang.name}</span>
      <span className="sr-only">
        {" "}
        (<span lang={lang.lang}>{lang.native}</span>)
      </span>
    </button>
  );
}

/** Native-script names of all nine languages, with the selected one highlighted (visual only). */
function LanguageStrip({ active }: { active: number }) {
  return (
    <Glass strong aria-hidden className="mt-14 px-3 py-4 sm:px-5">
      <ul className="grid grid-cols-2 gap-x-2 gap-y-3 min-[420px]:grid-cols-3 sm:grid-cols-5">
        {languages.map((l, i) => (
          <li key={l.code} className={cn("flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors duration-300", i === active && "bg-nova-50")}>
            <span
              lang={l.lang}
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b text-[15px] font-bold ring-1",
                i === active ? "from-nova-500 to-nova-700 text-white ring-nova-500" : cn("ring-nova-100", bubbleTints[i % bubbleTints.length]),
              )}
            >
              {l.glyph}
            </span>
            <span className="min-w-0 leading-tight">
              <span lang={l.lang} className="block text-[13px] font-semibold whitespace-nowrap text-nova-ink">
                {l.native}
              </span>
              <span className="block text-[11.5px] text-nova-muted">{l.name}</span>
            </span>
          </li>
        ))}
      </ul>
    </Glass>
  );
}

/* ------------------------------------------------------------------ */
/* Conversation                                                         */
/* ------------------------------------------------------------------ */

function ConversationPanel({
  lang,
  phase,
  panelRef,
  waveRef,
  timerRef,
}: {
  lang: Language;
  phase: LangPhase;
  panelRef: React.RefObject<HTMLDivElement | null>;
  waveRef: React.RefObject<HTMLDivElement | null>;
  timerRef: React.RefObject<HTMLSpanElement | null>;
}) {
  const english = lang.code === "EN";
  const live = reachedL(phase, "connected") && !reachedL(phase, "done");
  const speaking = phase === "ai1" || phase === "ai2" ? "AI agent speaking" : phase === "lead1" || phase === "lead2" ? "Lead speaking" : null;

  return (
    <div ref={panelRef} className="mx-auto w-full max-w-[380px]">
      <Glass strong className="rounded-[2rem] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-nova-100 text-nova-700">
            <Languages className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-nova-ink">Sample enquiry call</p>
            <p className="truncate text-[12px] text-nova-muted">
              {lang.name}
              {!english && (
                <>
                  {" · "}
                  <span lang={lang.lang}>{lang.native}</span>
                </>
              )}
            </p>
          </div>
          <span
            aria-hidden
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap transition-colors duration-300",
              live ? "bg-emerald-50 text-emerald-700" : "bg-nova-100 text-nova-700",
            )}
          >
            <span className={cn("size-1.5 rounded-full", live ? "bg-emerald-500" : "bg-nova-500")} />
            {callStatus(phase)}
          </span>
        </div>

        <div aria-hidden className="mt-4">
          <p className="flex h-4 items-center justify-between text-[10.5px] font-semibold tracking-wide text-nova-muted uppercase">
            {speaking ?? (live ? "Line open" : reachedL(phase, "done") ? "Call complete" : "Preparing")}
            <span ref={timerRef} className={cn("font-mono text-[12px] tracking-normal text-nova-ink tabular-nums", !reachedL(phase, "connected") && "invisible")}>
              00:00
            </span>
          </p>
          <div ref={waveRef} className="mt-2 flex h-9 items-center justify-between">
            {waveBase.map((_, i) => (
              <span key={i} style={{ transform: "scaleY(0.1)" }} className="h-full w-[3px] rounded-full bg-gradient-to-t from-nova-600 to-nova-pink" />
            ))}
          </div>
        </div>

        {/*
          All nine conversations share one grid cell and only the selected one is visible, so the
          panel is always as tall as the longest language: switching never shifts the layout.
        */}
        <div className="mt-3 grid">
          {languages.map((l) => (
            <ConversationLines key={l.code} lang={l} phase={phase} visible={l.code === lang.code} />
          ))}
        </div>
      </Glass>
    </div>
  );
}

/** One language's note and four lines. Hidden copies only reserve height (invisible, aria-hidden). */
function ConversationLines({ lang, phase, visible }: { lang: Language; phase: LangPhase; visible: boolean }) {
  const entry = conversations[lang.code];
  const reviewed = entry && "reviewed" in entry ? entry.reviewed : null;
  const english = lang.code === "EN";
  return (
    <div aria-hidden={!visible} className={cn("[grid-area:1/1]", !visible && "invisible")}>
      {!reviewed && (
        <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-800 ring-1 ring-amber-100">
          {lang.name} sample text is awaiting native-speaker review, so the English meaning is shown below.
        </p>
      )}
      <ol className="grid content-start gap-2.5" aria-label={`Sample conversation in ${lang.name}`}>
        {conversationSpeakers.map((from, i) => {
          const ai = from === "ai";
          const text = reviewed ? reviewed[i] : conversationMeaning[i];
          return (
            <li key={i} className={cn(ai ? "mr-5" : "ml-8", visible ? reveal(reachedL(phase, lineCues[i])) : "opacity-0")}>
              <p className={cn("mb-1 flex items-center gap-1 text-[10.5px] font-semibold tracking-wide uppercase", ai ? "text-nova-700" : "justify-end text-fuchsia-700")}>
                {ai ? <Bot aria-hidden className="size-3" /> : <UserRound aria-hidden className="size-3" />}
                {ai ? "AI agent" : "Lead"}
              </p>
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5",
                  ai ? "rounded-tl-md bg-gradient-to-r from-nova-600 to-nova-500 text-white" : "rounded-tr-md border border-nova-100 bg-white text-nova-ink shadow-nova",
                )}
              >
                <p lang={reviewed ? lang.lang : "en"} className="text-[14px] leading-relaxed">
                  {text}
                </p>
                {reviewed && !english && (
                  <p lang="en" className={cn("mt-1 text-[11.5px] leading-snug", ai ? "text-white/85" : "text-nova-muted")}>
                    {conversationMeaning[i]}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
