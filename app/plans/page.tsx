"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { FeaturePreview } from "@/components/workspace/primitives";
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
    models:
      "GLM · Qwen3 Coder · DeepSeek · MiniMax · Kimi K2.7 · Sonnet 5 · Gemini · GPT-5.3 Codex",
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
  const [plan, setPlan] = useState<string | null>(null);
  return (
    <Shell>
      {(me) => (
        <>
          <div className="plans-intro">
            <span className="eyebrow">Room for your ambitions</span>
            <h1>Find your building rhythm.</h1>
            <p className="sub">
              budgets shown as 5-hour session windows + weekly caps · session
              resets purchasable when you hit a limit
            </p>
            <div className="notice">
              Payments arrive in the next release (Stripe + Dubu Pay). During
              the beta your plan is set by the team. Ask in the beta channel.
            </div>
          </div>
          <div className="grid plan-grid">
            {PLANS.map((p) => (
              <div
                className={`card plan-card${me.user.plan === p.id ? " current" : ""}`}
                key={p.id}
              >
                <div className="row spread">
                  <strong style={{ fontSize: 17 }}>{p.name}</strong>
                  {me.user.plan === p.id && (
                    <span className="badge ok">current</span>
                  )}
                </div>
                <div style={{ fontSize: 36, margin: "6px 0" }}>
                  ${p.price}
                  <span style={{ fontSize: 13, color: "var(--dim)" }}>/mo</span>
                </div>
                <p style={{ color: "var(--dim)", fontSize: 13 }}>{p.blurb}</p>
                <ul
                  style={{
                    margin: "10px 0 14px 18px",
                    fontSize: 13,
                    color: "var(--dim)",
                  }}
                >
                  <li>{p.credits.toLocaleString()} credits / month</li>
                  <li>{p.window} per 5-hour window</li>
                  <li>{p.weekly} per week</li>
                  <li style={{ marginTop: 6 }}>{p.models}</li>
                </ul>
                <button className="pill-button" onClick={() => setPlan(p.name)}>
                  {me.user.plan === p.id ? "Plan details" : `Explore ${p.name}`}
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            ))}
          </div>
          <h2>Bring your own key</h2>
          <div className="card">
            <p style={{ fontSize: 14 }}>
              Bring your own OpenRouter key: <strong>$10/mo flat</strong>. Your
              key stays on your device, calls go directly to OpenRouter, nothing
              is metered by us. Full agent, vault memory, skills, MCP,
              connectors included.
            </p>
          </div>
          {plan && (
            <FeaturePreview
              title={`${plan} plan`}
              description="Self-service subscriptions and payment controls are coming soon. During the beta, the team manages your plan. Your current credits and limits are available in Usage & activity."
              onClose={() => setPlan(null)}
            />
          )}
        </>
      )}
    </Shell>
  );
}
