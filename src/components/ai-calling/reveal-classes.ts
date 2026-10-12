/**
 * Plain helpers for RevealOnView children. Kept outside the client module so server-rendered
 * sections can use them.
 */

/** Classes for an element that fades and rises in with its RevealOnView. Add a delay via style. */
export const revealItem =
  "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none group-data-[shown=false]/reveal:translate-y-4 group-data-[shown=false]/reveal:opacity-0";

/** Inline style for a staggered entrance. The delay also applies to the off-screen reset, which nobody sees. */
export const revealDelay = (ms: number): React.CSSProperties => ({ transitionDelay: `${ms}ms` });
