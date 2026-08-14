"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { api } from "@/lib/api";

interface Tx {
  id: string;
  type: string;
  credits: number;
  model: string | null;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  rawCostUsd: number;
  createdAt: string;
}

interface UsageBucket {
  key: string;
  requests: number;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  rawCostUsd: number;
  credits: number;
  cacheHitRate: number;
}

interface UsageReport {
  totals: Omit<UsageBucket, "key">;
  buckets: UsageBucket[];
}

type GroupBy = "model" | "day" | "session";

const fmtTokens = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

function Meter({ label, spent, cap }: { label: string; spent: number; cap: number }) {
  const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
  return (
    <div className="card">
      <div className="row spread">
        <strong>{label}</strong>
        <span className="mono" style={{ color: "var(--dim)" }}>
          {spent.toFixed(1)} / {cap} cr
        </span>
      </div>
      <div className={`meter${pct > 80 ? " hot" : ""}`}>
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Shell>
      {(me) => <DashboardBody balance={me.limits.balance} limits={me.limits} />}
    </Shell>
  );
}

function DashboardBody({
  balance,
  limits,
}: {
  balance: number;
  limits: { windowSpent: number; windowCap: number; weeklySpent: number; weeklyCap: number };
}) {
  const [ledger, setLedger] = useState<Tx[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>("model");
  const [usage, setUsage] = useState<UsageReport | null>(null);

  useEffect(() => {
    api<{ transactions: Tx[] }>("/billing/ledger").then((d) => setLedger(d.transactions), () => {});
  }, []);

  useEffect(() => {
    setUsage(null);
    api<UsageReport>(`/billing/usage?groupBy=${groupBy}&days=30`).then(setUsage, () => {});
  }, [groupBy]);

  return (
    <>
      <h1>Usage</h1>
      <p className="sub">credits meter raw model cost, 1 credit = $0.01 of compute</p>
      <div className="grid">
        <div className="card">
          <strong>Balance</strong>
          <div style={{ fontSize: 28, marginTop: 6 }} className="mono">
            {balance.toFixed(1)} <span style={{ fontSize: 14, color: "var(--dim)" }}>credits</span>
          </div>
        </div>
        <Meter label="5-hour window" spent={limits.windowSpent} cap={limits.windowCap} />
        <Meter label="Weekly" spent={limits.weeklySpent} cap={limits.weeklyCap} />
      </div>
      <div className="row spread" style={{ alignItems: "baseline", marginTop: 28 }}>
        <h2 style={{ margin: 0 }}>Last 30 days</h2>
        <div className="row" style={{ gap: 6 }}>
          {(["model", "day", "session"] as GroupBy[]).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`badge${groupBy === g ? " accent" : ""}`}
              style={{ cursor: "pointer", border: "none" }}
            >
              by {g}
            </button>
          ))}
        </div>
      </div>

      {usage && usage.totals.requests > 0 && (
        <p className="sub" style={{ marginTop: 6 }}>
          {usage.totals.requests} calls · {usage.totals.credits.toFixed(1)} credits · $
          {usage.totals.rawCostUsd.toFixed(4)} raw ·{" "}
          {(usage.totals.cacheHitRate * 100).toFixed(0)}% cached
        </p>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>{groupBy}</th>
              <th>calls</th>
              <th>tokens (in / cached / out)</th>
              <th>cached</th>
              <th>credits</th>
            </tr>
          </thead>
          <tbody>
            {usage?.buckets.map((b) => (
              <tr key={b.key}>
                <td className="mono">
                  {/* session ids are UUIDs, a full one wrecks the column */}
                  {groupBy === "session" && b.key.length > 12 ? `${b.key.slice(0, 8)}…` : b.key}
                </td>
                <td className="mono">{b.requests}</td>
                <td className="mono">
                  {fmtTokens(b.inputTokens)} / {fmtTokens(b.cachedTokens)} /{" "}
                  {fmtTokens(b.outputTokens)}
                </td>
                <td className="mono">{(b.cacheHitRate * 100).toFixed(0)}%</td>
                <td className="mono">{b.credits.toFixed(2)}</td>
              </tr>
            ))}
            {usage && !usage.buckets.length && (
              <tr>
                <td colSpan={5} style={{ color: "var(--dim)" }}>
                  nothing in the last 30 days
                </td>
              </tr>
            )}
            {!usage && (
              <tr>
                <td colSpan={5} style={{ color: "var(--dim)" }}>
                  loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2>Recent activity</h2>
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>when</th>
              <th>type</th>
              <th>model</th>
              <th>tokens (in / cached / out)</th>
              <th>credits</th>
            </tr>
          </thead>
          <tbody>
            {ledger.slice(0, 25).map((t) => (
              <tr key={t.id}>
                <td className="mono">{new Date(t.createdAt).toLocaleString()}</td>
                <td>
                  <span className={`badge${t.type === "spend" ? "" : " accent"}`}>{t.type}</span>
                </td>
                <td className="mono">{t.model ?? "-"}</td>
                <td className="mono">
                  {t.type === "spend"
                    ? `${t.inputTokens} / ${t.cachedTokens} / ${t.outputTokens}`
                    : "-"}
                </td>
                <td className="mono">{Number(t.credits).toFixed(2)}</td>
              </tr>
            ))}
            {!ledger.length && (
              <tr>
                <td colSpan={5} style={{ color: "var(--dim)" }}>
                  no activity yet. Run <code>9p</code> in a project
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
