/**
 * The workspace motion engine.
 *
 * Deliberately dependency-free: every animation here is either a CSS transition
 * or a Web Animations API call, so the dashboard ships no animation runtime and
 * nothing animates off the main thread unless the browser can promote it. The
 * curves mirror the `--ease` token in `globals.css` so CSS and script motion
 * never disagree.
 *
 * If a future pass wants GSAP, the surface to keep is small: `animate`,
 * `stagger`, `flyGhost`, `smoothScrollTo`. Swapping those four internals is the
 * whole migration.
 */

export const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
/** Lighter overshoot-free curve for elements that travel a long distance. */
export const EASE_TRAVEL = "cubic-bezier(0.16, 1, 0.3, 1)";

export const DUR = {
  /** Immediate feedback: press, hover, icon swap. */
  tick: 120,
  /** Small state changes: chips, checkmarks, carets. */
  quick: 180,
  /** Entrances: messages, menus, tiles. */
  base: 260,
  /** Settling: the composer re-flow, meters, charts. */
  settle: 420,
  /** Long travel: draft text leaving the composer for a chat bubble. */
  flight: 480,
} as const;

/** How far apart staggered siblings land, in milliseconds. */
export const STAGGER = 45;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** True when a script animation is allowed to run at all. */
export function canAnimate(): boolean {
  return typeof document !== "undefined" && !prefersReducedMotion();
}

/**
 * Run keyframes on one element. Returns null — the same shape as "finished
 * instantly" — when motion is reduced, so callers never branch on it.
 */
export function animate(
  element: Element | null | undefined,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions = {},
): Animation | null {
  if (!element || !canAnimate()) return null;
  const el = element as HTMLElement;
  if (!el.isConnected) return null;
  const animation = el.animate(keyframes, {
    duration: DUR.base,
    easing: EASE,
    fill: "both",
    ...options,
  });
  animation.addEventListener("finish", () => {
    // Leaving `fill: both` attached would pin the end state forever and make a
    // later CSS class change invisible.
    if (animation.playState !== "idle") animation.cancel();
  });
  return animation;
}

/** Enter a list one item at a time. Index is read from the caller's order. */
export function stagger(
  elements: Iterable<Element | null | undefined>,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions & { step?: number } = {},
): void {
  if (!canAnimate()) return;
  const { step = STAGGER, ...rest } = options;
  Array.from(elements).forEach((element, index) => {
    animate(element, keyframes, {
      duration: DUR.base,
      easing: EASE,
      ...rest,
      delay: (typeof rest.delay === "number" ? rest.delay : 0) + index * step,
    });
  });
}

export function rectOf(element: Element | null | undefined): DOMRect | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return rect.width || rect.height ? rect : null;
}

/** A one-shot nudge, used for buttons that just did something. */
export function pulse(
  element: Element | null,
  strength = 0.06,
  duration = DUR.quick,
): void {
  animate(
    element,
    [
      { transform: "scale(1)" },
      { transform: `scale(${1 - strength})`, offset: 0.4 },
      { transform: "scale(1)" },
    ],
    { duration: duration * 2, easing: EASE },
  );
}

/** A short lift-and-fall, for an element whose content just changed. */
export function bump(element: Element | null, distance = -3): void {
  animate(
    element,
    [
      { transform: "translateY(0)" },
      { transform: `translateY(${distance}px)`, offset: 0.45 },
      { transform: "translateY(0)" },
    ],
    { duration: 320, easing: EASE },
  );
}

export function smoothScrollTo(
  element: HTMLElement | null,
  top: number,
  behavior: ScrollBehavior = "smooth",
): void {
  if (!element) return;
  element.scrollTo({ top, behavior: canAnimate() ? behavior : "auto" });
}

/** Distance from the bottom, in pixels, at which "at the bottom" still holds. */
export const STICK_THRESHOLD = 96;

/**
 * Reproduce a textarea's *text* as a positioned element.
 *
 * A textarea exposes no text node to measure, so the flight needs a stand-in
 * that lands exactly on the characters the user just typed: identical font,
 * line breaking, and content box. Cloning those computed styles is what makes
 * the handoff invisible instead of a jump.
 */
export function textGhost(
  textarea: HTMLTextAreaElement | null,
  text: string,
): HTMLElement | null {
  if (!textarea || !text.trim() || !canAnimate()) return null;
  const rect = textarea.getBoundingClientRect();
  const style = getComputedStyle(textarea);
  const pad = {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
  const border = {
    top: parseFloat(style.borderTopWidth) || 0,
    left: parseFloat(style.borderLeftWidth) || 0,
  };
  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.dataset.motionGhost = "true";
  ghost.textContent = text;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${rect.left + border.left + pad.left}px`,
    top: `${rect.top + border.top + pad.top}px`,
    width: `${Math.max(0, rect.width - pad.left - pad.right)}px`,
    margin: "0",
    padding: "0",
    border: "0",
    font: style.font,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    pointerEvents: "none",
    zIndex: "80",
    willChange: "transform, opacity",
  });
  document.body.appendChild(ghost);
  return ghost;
}

export interface FlightOptions {
  /** Where the travelling text should visually end up. */
  target: Element | null;
  /** Duration override; defaults to `DUR.flight`. */
  duration?: number;
  /** Called when the travel finishes, after the ghost is removed. */
  onArrive?: () => void;
}

/**
 * Move a ghost from where it was created to the text origin of `target`,
 * fading out as the real element fades in underneath it. Deliberately no
 * scaling: stretching glyphs is what makes a text flight read as a cheap zoom.
 */
export function flyGhost(ghost: HTMLElement | null, options: FlightOptions): void {
  const target = rectOf(options.target);
  const from = rectOf(ghost);
  if (!ghost || !target || !from || !options.target) {
    ghost?.remove();
    options.onArrive?.();
    return;
  }
  const targetStyle = getComputedStyle(options.target);
  const dx = target.left + (parseFloat(targetStyle.paddingLeft) || 0) - from.left;
  const dy = target.top + (parseFloat(targetStyle.paddingTop) || 0) - from.top;
  const animation = ghost.animate(
    [
      { transform: "translate(0, 0)", opacity: 1, offset: 0 },
      {
        transform: `translate(${dx * 0.62}px, ${dy * 0.72}px)`,
        opacity: 1,
        offset: 0.6,
      },
      {
        transform: `translate(${dx}px, ${dy}px)`,
        opacity: 0.9,
        filter: "blur(0px)",
        offset: 0.88,
      },
      {
        transform: `translate(${dx}px, ${dy}px)`,
        opacity: 0,
        filter: "blur(1.5px)",
        offset: 1,
      },
    ],
    {
      duration: options.duration ?? DUR.flight,
      easing: EASE_TRAVEL,
      fill: "both",
    },
  );
  animation.addEventListener("finish", () => {
    ghost.remove();
    options.onArrive?.();
  });
}

/** The other half of a flight: bring the real element in as the ghost lands. */
export function settleIn(element: Element | null, delay = DUR.flight * 0.5): void {
  animate(
    element,
    [
      {
        opacity: 0,
        transform: "translateY(6px) scale(0.985)",
        filter: "blur(2px)",
      },
      { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0px)" },
    ],
    { duration: DUR.base, delay, easing: EASE },
  );
}

/**
 * Circular reveal for a theme change: the new palette grows out of the control
 * that was clicked instead of flashing the whole window. Uses the View
 * Transitions API where present, and falls back to an instant swap.
 */
export function revealThemeChange(x: number, y: number, apply: () => void): void {
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  };
  if (!doc.startViewTransition || !canAnimate()) {
    apply();
    return;
  }
  const root = document.documentElement;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty("--reveal-x", `${x}px`);
  root.style.setProperty("--reveal-y", `${y}px`);
  root.style.setProperty("--reveal-r", `${radius}px`);
  root.dataset.reveal = "on";
  doc.startViewTransition(apply).finished.finally(() => {
    delete root.dataset.reveal;
  });
}

/** Measure an element's natural height without leaving it changed. */
export function naturalHeight(element: HTMLElement | null): number {
  if (!element) return 0;
  const previous = element.style.height;
  element.style.height = "auto";
  const height = element.scrollHeight;
  element.style.height = previous;
  return height;
}
