"use client";
import { useState } from "react";
import Link from "next/link";
import { Shell, Snippet } from "@/components/shell";
import { ThemePicker } from "@/components/theme";
import { Icon } from "@/components/icon";
export default function Settings() {
  const [tab, setTab] = useState("appearance");
  return (
    <Shell>
      {(me) => (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">Make yourself at home</span>
              <h1>Your space. Your way.</h1>
              <p className="sub">A few small details that make it yours.</p>
            </div>
          </div>
          <div className="settings-layout">
            <div
              className="settings-nav"
              role="tablist"
              aria-label="Settings categories"
            >
              {(
                [
                  { id: "appearance", label: "Appearance", icon: "sun" },
                  { id: "account", label: "Account", icon: "shield" },
                  { id: "devices", label: "Devices", icon: "monitor" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  id={`${item.id}-tab`}
                  role="tab"
                  aria-controls="settings-panel"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                >
                  <Icon name={item.icon} size={17} />
                  {item.label}
                </button>
              ))}
            </div>
            <section
              className="settings-panel"
              id="settings-panel"
              role="tabpanel"
              aria-labelledby={`${tab}-tab`}
              key={tab}
            >
              {tab === "appearance" && (
                <>
                  <h2>Set the mood.</h2>
                  <p className="sub">
                    Light, dark, or in sync with your system. Your choice is
                    saved in this browser.
                  </p>
                  <ThemePicker expanded />
                  <div className="setting-row">
                    <span>Motion</span>
                    <div>Follows your device’s reduced motion preference.</div>
                  </div>
                </>
              )}
              {tab === "account" && (
                <>
                  <h2>The person behind the ideas.</h2>
                  <p className="sub">Your 9th Protocol account.</p>
                  <div className="setting-row">
                    <span>Name</span>
                    <div>{me.user.name || "Not set"}</div>
                  </div>
                  <div className="setting-row">
                    <span>Email</span>
                    <div>{me.user.email}</div>
                  </div>
                  <div className="setting-row">
                    <span>Plan</span>
                    <Link className="pill-button" href="/plans">
                      {me.user.plan}
                      <Icon name="arrow" size={14} />
                    </Link>
                  </div>
                </>
              )}
              {tab === "devices" && (
                <>
                  <h2>Take your workspace with you.</h2>
                  <p className="sub">
                    Use 9th Protocol from your terminal, desktop, or editor.
                    Sign in with the same account to use your credits.
                  </p>
                  <Snippet
                    text={
                      "npm install -g @9thprotocol/cli\n9p login\n\n# Inside your project\n9p"
                    }
                  />
                  <Link
                    href="/device"
                    className="primary-button"
                    style={{ marginTop: 24 }}
                  >
                    Connect a device <Icon name="arrow" size={16} />
                  </Link>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </Shell>
  );
}
