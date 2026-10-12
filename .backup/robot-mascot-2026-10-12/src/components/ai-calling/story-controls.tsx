"use client";

import { Pause, Play, RotateCcw } from "lucide-react";

/** Pause/Play + Replay for a looping story simulation (hidden by callers under reduced motion). */
export function StoryControls({
  paused,
  onTogglePause,
  onReplay,
  label,
}: {
  paused: boolean;
  onTogglePause: () => void;
  onReplay: () => void;
  /** What is being controlled, for accessible names, e.g. "comparison". */
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onTogglePause}
        aria-label={paused ? `Play ${label} simulation` : `Pause ${label} simulation`}
        className="inline-flex size-9 items-center justify-center rounded-full border border-nova-200 bg-white text-nova-700 shadow-nova transition-colors hover:border-nova-300 hover:bg-nova-50"
      >
        {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
      </button>
      <button
        type="button"
        onClick={onReplay}
        aria-label={`Replay ${label} simulation`}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-nova-200 bg-white px-3.5 text-[13px] font-semibold text-nova-700 shadow-nova transition-colors hover:border-nova-300 hover:bg-nova-50"
      >
        <RotateCcw className="size-3.5" /> Replay
      </button>
    </span>
  );
}
