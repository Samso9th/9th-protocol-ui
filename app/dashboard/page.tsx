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
  useEffect(() => {
    api<{ transactions: Tx[] }>("/billing/ledger").then((d) => setLedger(d.transactions), () => {});
  }, []);

  return (
    <>
      <h1>Usage</h1>
      <p className="sub">credits meter raw model cost — 1 credit = $0.01 of compute</p>
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
                <td className="mono">{t.model ?? "—"}</td>
                <td className="mono">
                  {t.type === "spend"
                    ? `${t.inputTokens} / ${t.cachedTokens} / ${t.outputTokens}`
                    : "—"}
                </td>
                <td className="mono">{Number(t.credits).toFixed(2)}</td>
              </tr>
            ))}
            {!ledger.length && (
              <tr>
                <td colSpan={5} style={{ color: "var(--dim)" }}>
                  no activity yet — run <code>9p</code> in a project
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
