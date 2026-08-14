"use client";

import { Shell } from "@/components/shell";

const PLANS = [
  {
    id: "core",
    name: "Core",
    price: 15,
    credits: 900,
    window: 120,
    weekly: 350,
    blurb: "Economy coders full-time, Sonnet-class metered",
    models: "GLM · Qwen3 Coder · DeepSeek · MiniMax · Kimi K2.7 · Sonnet 5 · Gemini · GPT-5.3 Codex",
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    credits: 3500,
    window: 350,
    weekly: 1100,
    blurb: "Daily driver + Fable pay-as-you-go packs",
    models: "Everything in Core, more of it · Fable 5 via pay-as-you-go packs",
  },
  {
    id: "max",
    name: "Max",
    price: 149,
    credits: 9500,
    window: 850,
    weekly: 3000,
    blurb: "Opus + Fable 5 included",
    models: "Everything + Kimi K3 · Opus 4.8 · Opus 4.8 Fast · Fable 5",
  },
];

export default function Plans() {
  return (
    <Shell>
      {(me) => (
        <>
          <h1>Plans</h1>
          <p className="sub">
            budgets shown as 5-hour session windows + weekly caps · session resets purchasable when
            you hit a limit
          </p>
          <div className="notice">
            Payments arrive in the next release (Stripe + Dubu Pay). During the beta your plan is
            set by the team. Ask in the beta channel.
          </div>
          <div className="grid">
            {PLANS.map((p) => (
              <div className="card" key={p.id}>
                <div className="row spread">
                  <strong style={{ fontSize: 17 }}>{p.name}</strong>
                  {me.user.plan === p.id && <span className="badge ok">current</span>}
                </div>
                <div style={{ fontSize: 26, margin: "6px 0" }}>
                  ${p.price}
                  <span style={{ fontSize: 13, color: "var(--dim)" }}>/mo</span>
                </div>
                <p style={{ color: "var(--dim)", fontSize: 13 }}>{p.blurb}</p>
                <ul style={{ margin: "10px 0 14px 18px", fontSize: 13, color: "var(--dim)" }}>
                  <li>{p.credits.toLocaleString()} credits / month</li>
                  <li>{p.window} per 5-hour window</li>
                  <li>{p.weekly} per week</li>
                  <li style={{ marginTop: 6 }}>{p.models}</li>
                </ul>
                <button disabled title="payments arrive with MVP2">
                  {me.user.plan === p.id ? "current plan" : "coming soon"}
                </button>
              </div>
            ))}
          </div>
          <h2>BYOK</h2>
          <div className="card">
            <p style={{ fontSize: 14 }}>
              Bring your own OpenRouter key: <strong>$10/mo flat</strong>. Your key stays on your
              device, calls go directly to OpenRouter, nothing is metered by us. Full agent, vault
              memory, skills, MCP, connectors included.
            </p>
          </div>
        </>
      )}
    </Shell>
  );
}
