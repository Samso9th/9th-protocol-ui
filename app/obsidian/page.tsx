"use client";

import { Shell, Snippet } from "@/components/shell";

export default function ObsidianPage() {
  return (
    <Shell>
      {() => (
        <>
          <h1>Obsidian vault memory</h1>
          <p className="sub">
            give 9p long-term memory it navigates like a knowledge graph. Your memory store never
            leaves your device
          </p>
          <div className="card">
            <strong>1 · Link a vault</strong>
            <p style={{ fontSize: 13, color: "var(--dim)", margin: "6px 0" }}>
              In your project, run:
            </p>
            <Snippet text={`9p init\n# choose "2. vault"`} />
            <p style={{ fontSize: 13, color: "var(--dim)", marginTop: 8 }}>
              This scaffolds <code>INDEX.md</code>, <code>jobs/</code>, <code>daily/</code>,{" "}
              <code>decisions/</code>, and <code>graph/</code>, and teaches the agent the vault
              protocol: read the index first, append instead of creating notes, log work to daily
              notes, record decisions.
            </p>
          </div>
          <div className="card">
            <strong>2 · Map your codebase</strong>
            <Snippet text={`9p map`} />
            <p style={{ fontSize: 13, color: "var(--dim)", marginTop: 8 }}>
              Generates wiki notes for every major module with [[links]] between them. Future
              sessions navigate the map instead of re-reading raw files. That&apos;s where the
              token savings come from.
            </p>
          </div>
          <div className="card">
            <strong>3 · See the graph (optional)</strong>
            <p style={{ fontSize: 13, color: "var(--dim)", margin: "6px 0" }}>
              Install Obsidian (free, obsidian.md), open your vault folder as a vault, and use graph
              view to watch your project&apos;s knowledge grow. Obsidian is a viewer, 9p works on
              the plain markdown either way.
            </p>
          </div>
          <div className="card">
            <strong>Privacy</strong>
            <p style={{ fontSize: 13, color: "var(--dim)", margin: "6px 0" }}>
              The vault lives on your disk and syncs wherever you choose (git, iCloud, nothing).
              Prompts that reference vault excerpts are sent to the model you&apos;re using, the
              vault itself is never uploaded or stored by us.
            </p>
          </div>
        </>
      )}
    </Shell>
  );
}
