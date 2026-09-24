"use client";
/**
 * React bindings for `lib/motion.ts`. Everything here is a hook or a leaf
 * component: the pages stay readable and the motion stays testable, because the
 * timing lives in one file.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DUR,
  STAGGER,
  STICK_THRESHOLD,
  animate,
  bump,
  canAnimate,
  flyGhost,
  pulse,
  settleIn,
  smoothScrollTo,
  stagger as staggerElements,
  textGhost,
} from "@/lib/motion";

/**
 * The headline interaction: the draft text leaves the composer and becomes the
 * chat bubble it was sent as.
 *
 * Two halves, because they happen on either side of a React commit: `capture`
 * runs while the textarea still holds the text, `land` runs once the bubble is
 * in the DOM. A ghost (not the bubble) travels, so the text keeps its own line
 * breaks instead of stretching.
 */
export function useBubbleFlight() {
  const ghost = useRef<HTMLElement | null>(null);
  const arrival = useRef<(() => void) | null>(null);

  const capture = useCallback(
    (
      textarea: HTMLTextAreaElement | null,
      text: string,
      onArrive?: () => void,
    ) => {
      ghost.current?.remove();
      ghost.current = textGhost(textarea, text);
      arrival.current = onArrive ?? null;
      // Callers use the return value to decide whether a flight is in progress:
      // with reduced motion there is no ghost, and the bubble should keep its
      // ordinary entrance animation instead of waiting for an arrival.
      return Boolean(ghost.current);
    },
    [],
  );

  const land = useCallback((target: Element | null) => {
    if (!target) return;
    const travelling = ghost.current;
    if (!travelling) {
      arrival.current?.();
      arrival.current = null;
      return;
    }
    ghost.current = null;
    flyGhost(travelling, {
      target,
      onArrive: () => {
        arrival.current?.();
        arrival.current = null;
      },
    });
    // The bubble fades up underneath the landing text instead of popping in, so
    // the handoff reads as one continuous movement.
    settleIn(target, DUR.flight * 0.52);
  }, []);

  const cancel = useCallback(() => {
    ghost.current?.remove();
    ghost.current = null;
    arrival.current = null;
  }, []);

  useEffect(() => () => ghost.current?.remove(), []);

  return { capture, land, cancel };
}

/**
 * Grow the composer with its content, and collapse it back when it empties.
 * The height is set as an inline value so CSS can transition it; animating the
 * height from script would fight the textarea's own reflow.
 */
export function useAutoGrow(value: string, min = 100, max = 230) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = Math.min(max, Math.max(min, el.scrollHeight));
    el.style.height = `${next}px`;
  }, [value, min, max]);
  const rest = useCallback(() => {
    const el = ref.current;
    if (el) el.style.height = `${min}px`;
  }, [min]);
  return { ref, rest };
}

/**
 * Follow new messages only while the reader is already at the bottom. Scrolling
 * up to re-read an earlier answer must never be yanked away by an arriving
 * token, which is why the pin is a ref and not state read inside the effect.
 */
export function useChatScroll(dependency: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !pinned.current) return;
    el.scrollTop = el.scrollHeight;
  }, [dependency]);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinned.current = distance < STICK_THRESHOLD;
    setAtBottom(pinned.current);
    setScrolled(el.scrollTop > 12);
    // Drift the ambient band against the scroll: a few pixels of parallax is
    // enough to make the background feel connected to the content.
    el.closest<HTMLElement>(".chat-workspace")?.style.setProperty(
      "--band-drift",
      `${Math.min(64, el.scrollTop * 0.08).toFixed(1)}px`,
    );
  }, []);

  const toLatest = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    pinned.current = true;
    setAtBottom(true);
    smoothScrollTo(el, el.scrollHeight);
  }, []);

  return { ref, pinned, atBottom, scrolled, onScroll, toLatest };
}

/**
 * A transient status line that animates out instead of vanishing. The parent
 * clears `text`; this component owns the exit, so the parent keeps its simple
 * "set a string, clear it later" logic.
 */
export function Toast({
  text,
  tone = "info",
  life = 6000,
}: {
  text: string;
  tone?: "info" | "error";
  life?: number;
}) {
  const [shown, setShown] = useState(text);
  const [leaving, setLeaving] = useState(false);
  const node = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (text) {
      setShown(text);
      setLeaving(false);
      animate(
        node.current,
        [
          { opacity: 0, transform: "translateY(8px) scale(0.98)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        { duration: DUR.base },
      );
      return;
    }
    if (!shown) return;
    setLeaving(true);
    const timer = setTimeout(() => {
      setShown("");
      setLeaving(false);
    }, DUR.quick);
    return () => clearTimeout(timer);
  }, [text, shown]);

  if (!shown) return null;
  return (
    <div
      className={`toast${leaving ? " is-leaving" : ""}`}
      role="status"
      data-tone={tone}
      ref={node}
    >
      <span>{shown}</span>
      {/* The hairline matches the parent's auto-dismiss timer, so the toast
          never disappears without warning. */}
      <i className="toast-life" style={{ animationDuration: `${life}ms` }} />
    </div>
  );
}

/** Numbers that move to their new value instead of cutting to it. */
export function CountUp({
  value,
  digits = 0,
  suffix = "",
}: {
  value: number;
  digits?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    const origin = current.current;
    if (!canAnimate() || origin === value) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DUR.settle);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = origin + (value - origin) * eased;
      current.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(step);
      else current.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {display.toFixed(digits)}
      {suffix}
    </>
  );
}

/** Enter a group of elements one after another. */
export function StaggerGroup({
  children,
  className,
  signature = "",
  distance = 8,
  step = STAGGER,
}: {
  children: ReactNode;
  className?: string;
  /** Change this to replay the entrance, e.g. when a filter changes. */
  signature?: string;
  distance?: number;
  step?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    staggerElements(
      Array.from(group.children),
      [
        { opacity: 0, transform: `translateY(${distance}px)` },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { step, duration: DUR.base },
    );
  }, [signature, distance, step]);
  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
}

/** Feedback helpers for the surfaces that act on a click. */
export function useAcknowledgement<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const press = useCallback(() => pulse(ref.current), []);
  const lift = useCallback(() => bump(ref.current), []);
  return { ref, press, lift };
}
