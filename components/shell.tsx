"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, clearTokens, getTokens, type Me } from "@/lib/api";

const NAV = [
  ["/dashboard", "Usage"],
  ["/plans", "Plans"],
  ["/connectors", "Connectors"],
  ["/mcp", "MCP servers"],
  ["/skills", "Skills"],
  ["/obsidian", "Obsidian"],
  ["/settings", "Settings"],
] as const;

/** Authenticated shell: sidebar + guard. Children render once /me resolves. */
export function Shell({ children }: { children: (me: Me, reload: () => void) => React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api<Me>("/me").then(setMe, (e: Error) => setError(e.message));
  };

  useEffect(() => {
    if (!getTokens()) {
      router.replace("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="content">error: {error}</div>;
  if (!me) return <div className="content">loading…</div>;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">9th Protocol</div>
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""}>
            {label}
          </Link>
        ))}
        <div className="foot">
          {me.user.email}
          <br />
          plan: {me.user.plan}
          <br />
          <a
            href="/login"
            onClick={() => clearTokens()}
            style={{ color: "var(--dim)", textDecoration: "underline" }}
          >
            sign out
          </a>
        </div>
      </aside>
      <main className="content">{children(me, load)}</main>
    </div>
  );
}

export function Snippet({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="snippet mono">
      <button
        onClick={() => {
          void navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "copied" : "copy"}
      </button>
      {text}
    </div>
  );
}
