"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { Dialog } from "@/components/workspace/primitives";
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
  cloudflare: {
    title: "Cloudflare",
    what:
      "lets the agent deploy Workers and Pages and manage your domains — like Vercel, " +
      "but with DNS and domains in the same dashboard and far more programmable features " +
      "(Workers, routes, cron, bindings)",
    steps: [
      "Cloudflare dashboard → My Profile → API Tokens → Create Token",
      "Template: Edit Cloudflare Workers (Workers Scripts: Edit, Account Settings: Read)",
      "Account resources: include → your account; Zone resources: include → your zones",
      "Copy the token and paste it below",
    ],
  },
} as const;

export default function Connectors() {
  const [selected, setSelected] = useState<keyof typeof GUIDES | null>(null);
  const [pending, setPending] = useState(false);
  const [conns, setConns] = useState<Conn[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);

  const load = () => {
    api<{ connectors: Conn[] }>("/connectors").then(
      (d) => setConns(d.connectors),
      () => setStatus("Couldn’t load your connections. Refresh to try again."),
    );
  };
  useEffect(load, []);

  async function save(kind: string) {
    setStatus(null);
    setPending(true);
    try {
      await api(`/connectors/${kind}`, {
        method: "PUT",
        json: { token: tokens[kind] ?? "" },
      });
      setTokens((t) => ({ ...t, [kind]: "" }));
      setStatus(`${kind} connected`);
      load();
      setSelected(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  async function disconnect(kind: string) {
    setPending(true);
    setStatus(null);
    try {
      await api(`/connectors/${kind}`, { method: "DELETE" });
      load();
      setSelected(null);
      setStatus(`${kind} disconnected`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Couldn’t disconnect.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Shell>
      {() => (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">The agent toolkit</span>
              <h1>Better, together.</h1>
              <p className="sub">
                Bring the tools you use into the work you love. Connect your
                services to your local agent sessions.
              </p>
            </div>
          </div>
          {status && !selected && (
            <div className="notice" role="status">
              {status}
            </div>
          )}
          <div className="connector-grid">
            {(Object.keys(GUIDES) as (keyof typeof GUIDES)[]).map((kind) => {
              const guide = GUIDES[kind];
              const connected = conns.find((c) => c.kind === kind);
              return (
                <article className="connector-tile" key={kind}>
                  <div className="row spread">
                    <span className="tile-icon">
                      <Icon
                        name={kind === "github" ? "plug" : "server"}
                        size={25}
                      />
                    </span>
                    <span className={`badge${connected ? " ok" : ""}`}>
                      {connected ? "Connected" : "Available"}
                    </span>
                  </div>
                  <h2>{guide.title}</h2>
                  <p>
                    {kind === "github"
                      ? "From your next commit to your next release. Work with repositories, pull requests, and issues."
                      : "Deploy Workers and Pages, manage domains, and bring your next idea online."}
                  </p>
                  <div className="row spread">
                    <button
                      className="pill-button"
                      onClick={() => {
                        setStatus(null);
                        setSelected(kind);
                      }}
                    >
                      {connected
                        ? "Manage connection"
                        : `Connect ${guide.title}`}
                      <Icon name="arrow" size={15} />
                    </button>
                    {connected && (
                      <span className="badge">
                        {new Date(connected.connectedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="sub" style={{ marginTop: 28 }}>
            Tokens are encrypted at rest and available to your own local agent
            sessions. Once connected, ask your agent to use the service in a
            task.
          </p>
          {selected && (
            <Dialog
              title={`Connect ${GUIDES[selected].title}`}
              onClose={() => {
                if (!pending) setSelected(null);
              }}
            >
              <p className="dialog-intro">
                Create a scoped token for the repositories or account you want
                your agent to work with.
              </p>
              <details className="connector-guide">
                <summary>How to create your token</summary>
                <ol>
                  {GUIDES[selected].steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </details>
              <form
                className="connect-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void save(selected);
                }}
              >
                <label htmlFor="connector-token">
                  {GUIDES[selected].title} token
                </label>
                <input
                  id="connector-token"
                  autoComplete="off"
                  type="password"
                  placeholder="Paste your access token"
                  value={tokens[selected] || ""}
                  onChange={(e) =>
                    setTokens((t) => ({ ...t, [selected]: e.target.value }))
                  }
                />
                <div className="row">
                  <button
                    className="primary-button"
                    disabled={pending || !tokens[selected]?.trim()}
                  >
                    {pending
                      ? "Saving…"
                      : conns.some((c) => c.kind === selected)
                        ? "Replace token"
                        : "Connect"}
                    <Icon name="arrow" size={15} />
                  </button>
                  {conns.some((c) => c.kind === selected) && (
                    <button
                      type="button"
                      className="pill-button"
                      disabled={pending}
                      onClick={() => void disconnect(selected)}
                    >
                      Disconnect
                    </button>
                  )}
                </div>
                {status && (
                  <p role="status" className="error-text">
                    {status}
                  </p>
                )}
              </form>
            </Dialog>
          )}
        </>
      )}
    </Shell>
  );
}
