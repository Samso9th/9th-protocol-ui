"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Icon, type IconName } from "@/components/icon";
import { AmbientBand, Segmented } from "@/components/workspace/primitives";
import { CountUp } from "@/components/workspace/motion";
import { api, type Me } from "@/lib/api";

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
const fmtTokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : String(n);

function Meter({
  label,
  spent,
  cap,
  icon,
}: {
  label: string;
  spent: number;
  cap: number;
  icon: IconName;
}) {
  const pct = cap > 0 ? Math.max(0, Math.min(100, (spent / cap) * 100)) : 0;
  return (
    <div className="budget-item">
      <div className="metric-label">
        {label}
        <Icon name={icon} size={17} />
      </div>
      <div className="metric-value">
        <CountUp value={spent} digits={1} />
        <span>/ {cap.toLocaleString()} cr</span>
      </div>
      <p className="metric-note">
        <CountUp value={Math.max(0, cap - spent)} digits={1} /> credits
        remaining
      </p>
      <div
        className={`meter${pct > 80 ? " hot" : ""}`}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${spent.toFixed(1)} of ${cap} credits used`}
      >
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DailyChart({
  report,
  error,
}: {
  report: UsageReport | null;
  error: boolean;
}) {
  const days =
    report?.buckets.slice().sort((a, b) => a.key.localeCompare(b.key)) ?? [];
  const max = Math.max(1, ...days.map((day) => day.credits));
  return (
    <div className="card chart-card">
      <div className="chart-heading">
        <strong>Compute activity</strong>
        <span className="chart-legend">Credits used · last 30 days</span>
      </div>
      {days.length ? (
        <>
          <div
            className="usage-chart"
            role="group"
            aria-label="Daily compute credits, last 30 days"
          >
            {days.map((day, index) => (
              <div
                key={day.key}
                className="chart-bar"
                tabIndex={0}
                aria-label={`${day.key}: ${day.credits.toFixed(2)} credits`}
                data-label={`${day.key}: ${day.credits.toFixed(2)} cr`}
                style={{ "--step": index } as CSSProperties}
              >
                <span style={{ height: `${(day.credits / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="chart-axis">
            <span>{days[0].key}</span>
            <span>{report?.totals.credits.toFixed(1)} credits total</span>
            <span>{days.length > 1 ? days[days.length - 1].key : ""}</span>
          </div>
        </>
      ) : (
        <div className="chart-empty" role="status">
          <Icon name="chart" size={25} />
          <strong>
            {error
              ? "Activity is unavailable"
              : report
                ? "Your next idea starts here"
                : "Loading your activity…"}
          </strong>
          <span>
            {error
              ? "Refresh the page to try again."
              : report
                ? "Run a task with 9p and your compute activity will appear here."
                : "Fetching your last 30 days of usage."}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return <Shell>{(me) => <DashboardBody me={me} />}</Shell>;
}

function DashboardBody({ me }: { me: Me }) {
  const [tab, setTab] = useState<"usage" | "activity">("usage");
  const [ledger, setLedger] = useState<Tx[] | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("model");
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [daily, setDaily] = useState<UsageReport | null>(null);
  const [ledgerError, setLedgerError] = useState(false);
  const [usageError, setUsageError] = useState(false);
  const [dailyError, setDailyError] = useState(false);
  useEffect(() => {
    let active = true;
    api<{ transactions: Tx[] }>("/billing/ledger").then(
      (data) => {
        if (active) setLedger(data.transactions);
      },
      () => {
        if (active) setLedgerError(true);
      },
    );
    api<UsageReport>("/billing/usage?groupBy=day&days=30").then(
      (data) => {
        if (active) setDaily(data);
      },
      () => {
        if (active) setDailyError(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setUsage(null);
    setUsageError(false);
    api<UsageReport>(`/billing/usage?groupBy=${groupBy}&days=30`).then(
      (data) => {
        if (active) setUsage(data);
      },
      () => {
        if (active) setUsageError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [groupBy]);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Your workspace</span>
          <h1>A little perspective.</h1>
          <p className="sub">
            See where your ideas take you. All your compute, in one place.
          </p>
        </div>
        <Link className="pill-button" href="/workspace">
          <Icon name="chat" size={16} /> Back to chat
        </Link>
      </div>
      <section className="activity-overview">
        <div className="balance-feature">
          <AmbientBand />
          <span className="eyebrow">Available balance</span>
          <div className="balance-number">
            {me.limits.balance.toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
            <small>credits</small>
          </div>
          <p>1 credit = $0.01 of compute</p>
          <Link className="pill-button" href="/plans">
            <Icon name="diamond" size={15} />
            {me.user.plan} plan <Icon name="arrow" size={14} />
          </Link>
        </div>
        <div className="budget-column">
          <Meter
            label="5-hour window"
            spent={me.limits.windowSpent}
            cap={me.limits.windowCap}
            icon="clock"
          />
          <Meter
            label="This week"
            spent={me.limits.weeklySpent}
            cap={me.limits.weeklyCap}
            icon="chart"
          />
        </div>
      </section>
      <DailyChart report={daily} error={dailyError} />
      <div
        className="activity-tabs"
        role="tablist"
        aria-label="Activity reports"
      >
        <button
          role="tab"
          id="usage-tab"
          aria-controls="usage-report"
          aria-selected={tab === "usage"}
          onClick={() => setTab("usage")}
        >
          Model usage
        </button>
        <button
          role="tab"
          id="activity-tab"
          aria-controls="activity-report"
          aria-selected={tab === "activity"}
          onClick={() => setTab("activity")}
        >
          Transactions
        </button>
      </div>
      {tab === "usage" && (
        <section id="usage-report" role="tabpanel" aria-labelledby="usage-tab">
          <div className="section-heading">
            <div>
              <h2>Usage breakdown</h2>
              <p>
                {usage
                  ? `${usage.totals.requests.toLocaleString()} calls · ${usage.totals.credits.toFixed(1)} credits · $${usage.totals.rawCostUsd.toFixed(4)} compute · ${(usage.totals.cacheHitRate * 100).toFixed(0)}% cached`
                  : "Your model activity over the last 30 days"}
              </p>
            </div>
            <Segmented
              label="Group usage by"
              value={groupBy}
              options={[
                { value: "model", label: "model" },
                { value: "day", label: "day" },
                { value: "session", label: "session" },
              ]}
              onChange={(value) => setGroupBy(value as GroupBy)}
            />
          </div>
          <div className="card table-card">
            <table>
              <caption className="sr-only">
                Usage by {groupBy}, last 30 days
              </caption>
              <thead>
                <tr>
                  <th style={{ textTransform: "capitalize" }}>{groupBy}</th>
                  <th>Calls</th>
                  <th>Tokens · in / cached / out</th>
                  <th>Cached</th>
                  <th>Credits</th>
                </tr>
              </thead>
              <tbody>
                {usage?.buckets.map((bucket) => (
                  <tr key={bucket.key}>
                    <td className="mono" title={bucket.key}>
                      {groupBy === "session" && bucket.key.length > 12
                        ? `${bucket.key.slice(0, 8)}…`
                        : bucket.key}
                    </td>
                    <td className="mono">{bucket.requests}</td>
                    <td className="mono">
                      {fmtTokens(bucket.inputTokens)} /{" "}
                      {fmtTokens(bucket.cachedTokens)} /{" "}
                      {fmtTokens(bucket.outputTokens)}
                    </td>
                    <td className="mono">
                      {(bucket.cacheHitRate * 100).toFixed(0)}%
                    </td>
                    <td className="mono">{bucket.credits.toFixed(2)}</td>
                  </tr>
                ))}
                {(!usage || !usage.buckets.length) && (
                  <tr>
                    <td colSpan={5} className="empty-cell" role="status">
                      {usageError
                        ? "Couldn’t load usage. Try selecting another group or refreshing."
                        : usage
                          ? "No usage in the last 30 days. Your first task will show up here."
                          : "Loading usage…"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "activity" && (
        <section
          id="activity-report"
          role="tabpanel"
          aria-labelledby="activity-tab"
        >
          <div className="section-heading">
            <h2>Recent activity</h2>
            <span>Latest 25 transactions</span>
          </div>
          <div className="card table-card">
            <table>
              <caption className="sr-only">Recent credit transactions</caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                  <th>Model</th>
                  <th>Tokens · in / cached / out</th>
                  <th>Credits</th>
                </tr>
              </thead>
              <tbody>
                {ledger?.slice(0, 25).map((tx) => (
                  <tr key={tx.id}>
                    <td
                      className="mono"
                      title={new Date(tx.createdAt).toLocaleString()}
                    >
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      <span
                        className={`badge${tx.type === "spend" ? "" : " accent"}`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="mono">{tx.model ?? "–"}</td>
                    <td className="mono">
                      {tx.type === "spend"
                        ? `${fmtTokens(tx.inputTokens)} / ${fmtTokens(tx.cachedTokens)} / ${fmtTokens(tx.outputTokens)}`
                        : "–"}
                    </td>
                    <td className="mono">{Number(tx.credits).toFixed(2)}</td>
                  </tr>
                ))}
                {(!ledger || !ledger.length) && (
                  <tr>
                    <td colSpan={5} className="empty-cell" role="status">
                      {ledgerError ? (
                        "Couldn’t load recent activity. Refresh to try again."
                      ) : ledger ? (
                        <>
                          All quiet for now. Run <code>9p</code> in a project to
                          get started.
                        </>
                      ) : (
                        "Loading recent activity…"
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
