import type { CSSProperties } from "react";

const paths = {
  chat: "M4 4h16v12H9l-5 4V4Zm8 3v6m-3-3h6",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm5.5 13 5 5",
  folder: "M3 6h6l2 2h10l-3 12H2L3 6Zm0 0V3h7l2 3h7v2",
  history: "M3 4v5h5m-5 0a9 9 0 1 1 1 9m8-11v5l3 2",
  apps: "M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zm15-1v8m-4-4h8",
  help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-2 5a2 2 0 1 1 3 2c-1 1-1 1-1 3m0 3h.01",
  share: "M12 15V2m-4 4 4-4 4 4M6 9H3v12h18V9h-3",
  diamond: "m12 3 8 6-8 12L4 9l8-6ZM4 9h16M8 9l4-6 4 6-4 12-4-12",
  agent:
    "M8 6V4l4-2 4 2v2h3l2 5-2 3v5H5v-5l-2-3 2-5h3Zm1 4h.01M15 10h.01M9 15h6",
  brain:
    "M12 5c-1-4-7-3-7 1-4 1-4 7 0 8-1 5 5 8 7 4V5Zm0 0c1-4 7-3 7 1 4 1 4 7 0 8 1 5-5 8-7 4M8 8l-3-2m3 7-3 1m11-6 3-2m-3 7 3 1",
  research:
    "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 0c-4 4-4 12 0 16m0-16c4 4 4 12 0 16M2 10h16m-2 6 5 5",
  attach:
    "m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2m-8 14a2 2 0 0 0 3 1l9-9",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  wave: "M3 8V5h4m10 0h4v3M3 16v3h4m10 0h4v-3M5 12h3l2-4 3 8 2-4h4",
  send: "M12 20V4m-6 6 6-6 6 6",
  stop: "M6 6h12v12H6z",
  down: "m6 9 6 6 6-6",
  plus: "M12 4v16M4 12h16",
  audio: "M10 4 5 8H2v8h3l5 4V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  like: "M8 10 12 2c3 0 3 3 2 6h5c2 0 3 2 2 4l-2 9H8V10ZM3 10h5v11H3z",
  dislike: "M8 14 12 22c3 0 3-3 2-6h5c2 0 3-2 2-4L19 3H8v11ZM3 3h5v11H3z",
  image: "M3 3h18v18H3zM3 17l5-6 4 4 3-3 6 7M15 7h.01",
  file: "M5 2h9l5 5v15H5V2Zm9 0v6h5M8 12h8m-8 4h5",

  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  chart: "M4 19V9m8 10V4m8 15v-7",
  card: "M3 7h18M5 16h4M4 3h16a1 1 0 0 1 1 1v16H3V4a1 1 0 0 1 1-1Z",
  plug: "M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-6 6v4m0-4a6 6 0 0 1-6-6V8",
  server: "M3 3h18v7H3zM3 14h18v7H3zM7 6.5h.01M7 17.5h.01M11 6.5h6m-6 11h6",
  sparkles:
    "m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3ZM20 2v4m-2-2h4",
  vault: "m12 3 8 4v10l-8 4-8-4V7l8-4ZM4 7l8 5 8-5m-8 5v9",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
  terminal: "m5 7 5 5-5 5m8 0h6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
  moon: "M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z",
  monitor: "M3 3h18v13H3zM8 21h8m-4-5v5",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  chevron: "m9 5 7 7-7 7",
  logout: "M9 3H3v18h6m5-14 5 5-5 5m-7-5h12",
  book: "M12 5v16M3 3c4 0 7 0 9 2 2-2 5-2 9-2v16c-4 0-7 0-9 2-2-2-5-2-9-2V3Z",
  copy: "M9 9h12v12H9zM15 5V3H3v12h2",
  check: "m5 12 4 4L19 6",
  clock: "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
  refresh: "M20 8a8 8 0 1 0 .5 7M20 3v5h-5",
} as const;

export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 18,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
