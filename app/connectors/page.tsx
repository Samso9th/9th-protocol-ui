"use client";

import { useEffect, useState } from "react";
import { Shell, Snippet } from "@/components/shell";
import { api } from "@/lib/api";

interface Conn {
  kind: string;
  label: string;
  connectedAt: string;
}

const GUIDES = {
  github: {
    title: "GitHub",
    what: "lets the agent commit, open PRs, and manage issues as you",
    steps: [
      "GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token",
      "Repository access: the repos you want 9p to work in",
      "Permissions: Contents (read/write), Pull requests (read/write), Issues (read/write)",
      "Copy the token (starts with github_pat_) and paste it below",
    ],
  },
  vercel: {
    title: "Vercel",
    what: "lets the agent deploy previews and production from your projects",
    steps: [
      "Vercel → Account Settings → Tokens → Create token",
      "Scope: your team or personal account",
      "Copy the token and paste it below",
    ],
  },
} as const;

export default function Connectors() {
  const [conns, setConns] = useState<Conn[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);

  const load = () => {
    api<{ connectors: Conn[] }>("/connectors").then((d) => setConns(d.connectors), () => {});
  };
  useEffect(load, []);

  async function save(kind: string) {
    setStatus(null);
    try {
      await api(`/connectors/${kind}`, { method: "PUT", json: { token: tokens[kind] ?? "" } });
      setTokens((t) => ({ ...t, [kind]: "" }));
      setStatus(`${kind} connected`);
      load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  }

  async function disconnect(kind: string) {
    await api(`/connectors/${kind}`, { method: "DELETE" });
    load();
  }

  return (
    <Shell>
      {() => (
        <>
          <h1>Connectors</h1>
          <p className="sub">
            tokens are encrypted at rest and only handed to your own agent sessions
          </p>
          {status && <div className="notice">{status}</div>}
          {(Object.keys(GUIDES) as Array<keyof typeof GUIDES>).map((kind) => {
            const guide = GUIDES[kind];
            const connected = conns.find((c) => c.kind === kind);
            return (
              <div className="card" key={kind}>
                <div className="row spread">
                  <strong>{guide.title}</strong>
                  {connected ? (
                    <span className="badge ok">
                      connected {new Date(connected.connectedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="badge">not connected</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "var(--dim)", margin: "6px 0" }}>{guide.what}</p>
                <ol style={{ margin: "8px 0 8px 18px", fontSize: 13, color: "var(--dim)" }}>
                  {guide.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <div className="row">
                  <input
                    style={{ flex: 1 }}
                    type="password"
                    placeholder={`${guide.title} token`}
                    value={tokens[kind] ?? ""}
                    onChange={(e) => setTokens((t) => ({ ...t, [kind]: e.target.value }))}
                  />
                  <button onClick={() => save(kind)} disabled={!(tokens[kind] ?? "").length}>
                    {connected ? "replace" : "connect"}
                  </button>
                  {connected && (
                    <button className="secondary" onClick={() => disconnect(kind)}>
                      disconnect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <h2>Using connectors from the agent</h2>
          <div className="card">
            <p style={{ fontSize: 13, color: "var(--dim)" }}>
              Connected tokens are fetched by your CLI at runtime, e.g. ask 9p to “open a PR for
              this change” and it uses your GitHub token via:
            </p>
            <Snippet text={`GET /v1/connectors/github/token  (with your session auth)`} />
          </div>
        </>
      )}
    </Shell>
  );
}
