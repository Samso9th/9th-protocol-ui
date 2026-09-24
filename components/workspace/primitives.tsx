"use client";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type CSSProperties,
} from "react";
import { DUR, animate } from "@/lib/motion";
import { Icon, type IconName } from "../icon";

export function ActionButton({
  icon,
  label,
  active,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  label: string;
  active?: boolean;
}) {
  const node = useRef<HTMLButtonElement>(null);
  const shown = useRef(icon);
  useEffect(() => {
    // Copy becoming a checkmark is the clearest example: the glyph changes
    // meaning, so it turns into its replacement instead of cutting.
    if (shown.current === icon) return;
    shown.current = icon;
    animate(
      node.current?.querySelector("svg"),
      [
        { opacity: 0, transform: "rotate(-65deg) scale(0.6)" },
        { opacity: 1, transform: "rotate(0deg) scale(1)" },
      ],
      { duration: DUR.quick },
    );
  }, [icon]);
  return (
    <button
      ref={node}
      type="button"
      aria-label={label}
      aria-pressed={active}
      data-tooltip={label}
      className={`action-button ${active ? "is-active" : ""} ${className}`}
      {...props}
    >
      <Icon name={icon} size={19} />
    </button>
  );
}
export function PillButton({
  icon,
  children,
  active,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconName;
  active?: boolean;
}) {
  const node = useRef<HTMLButtonElement>(null);
  const was = useRef(active);
  useEffect(() => {
    if (was.current === active) return;
    was.current = active;
    // A pill that just became active gets a single acknowledging pop.
    if (active)
      animate(
        node.current,
        [
          { transform: "scale(1)" },
          { transform: "scale(1.06)", offset: 0.45 },
          { transform: "scale(1)" },
        ],
        { duration: 280 },
      );
  }, [active]);
  return (
    <button
      ref={node}
      type="button"
      aria-label={typeof children === "string" ? children : undefined}
      title={typeof children === "string" ? children : undefined}
      className={`pill-button${active ? " is-active" : ""}`}
      aria-pressed={active}
      {...props}
    >
      {icon && <Icon name={icon} size={17} />}
      {children}
    </button>
  );
}
export function AmbientBand() {
  return (
    <div className="ambient-band" aria-hidden="true">
      {[
        78, 114, 150, 117, 86, 47, 22, 38, 69, 106, 72, 41, 22, 48, 80, 118,
        159, 128, 84, 47,
      ].map((height, index) => (
        <span
          key={index}
          style={
            {
              "--bar-height": `${height}px`,
              "--bar-delay": `${index * -0.27}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`workspace-dialog${wide ? " wide" : ""}${drawer ? " drawer" : ""}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <ActionButton icon="close" label="Close dialog" onClick={onClose} />
      </header>
      {children}
    </dialog>
  );
}
export function FeaturePreview({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <Dialog title={title} onClose={onClose}>
      <div className="feature-preview">
        <span className="feature-symbol">
          <Icon name="sparkles" size={26} />
        </span>
        <span className="badge">Coming soon</span>
        <h3>A little more possibility.</h3>
        <p>{description}</p>
        <button className="primary-button" onClick={onClose}>
          Got it <Icon name="arrow" size={16} />
        </button>
      </div>
    </Dialog>
  );
}

/**
 * A segmented control whose selection moves rather than reappears: one pill
 * travels between cells and swells slightly mid-flight, so the eye can follow
 * where the choice went.
 */
export function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
}) {
  const group = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [travelling, setTravelling] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const selected = group.current?.querySelector<HTMLElement>(
        "button.selected",
      );
      if (!group.current || !selected) return setPill(null);
      // Offsets are relative to `.segmented` because it is the offset parent.
      setPill({ x: selected.offsetLeft, w: selected.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, options.length]);

  useEffect(() => {
    if (!pill) return;
    setTravelling(true);
    const timer = setTimeout(() => setTravelling(false), 340);
    return () => clearTimeout(timer);
  }, [pill?.x, pill?.w]);

  return (
    <div className={`segmented${pill ? " has-pill" : ""}`} role="group" aria-label={label} ref={group}>
      {pill && (
        <span
          aria-hidden="true"
          className={`segmented-pill${travelling ? " is-travelling" : ""}`}
          style={{ transform: `translateX(${pill.x}px)`, width: `${pill.w}px` }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          className={value === option.value ? "selected" : ""}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ChoiceMenu({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  options: {
    value: string;
    label: string;
    disabled?: boolean;
    note?: string;
  }[];
  onChange: (value: string) => void;
  icon?: IconName;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        ref.current.open = false;
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <details
      ref={ref}
      className="choice-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape" && ref.current) {
          ref.current.open = false;
          ref.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary
        aria-label={`${label}: ${options.find((option) => option.value === value)?.label || "Choose"}`}
      >
        {icon && <Icon name={icon} size={16} />}
        <span>
          {options.find((option) => option.value === value)?.label ||
            "Choose a model"}
        </span>
        <Icon name="down" size={14} />
      </summary>
      <div className="choice-options" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            disabled={option.disabled}
            aria-pressed={value === option.value}
            onClick={() => {
              onChange(option.value);
              if (ref.current) {
                ref.current.open = false;
                ref.current.querySelector("summary")?.focus();
              }
            }}
          >
            <span>{option.label}</span>
            {value === option.value && <Icon name="check" size={15} />}
            {option.disabled && <small>{option.note || "Upgrade"}</small>}
          </button>
        ))}
      </div>
    </details>
  );
}
