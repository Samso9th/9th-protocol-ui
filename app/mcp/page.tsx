"use client";

import { Shell, Snippet } from "@/components/shell";
import { MCP_GALLERY } from "@/lib/gallery";

export default function McpPage() {
  return (
    <Shell>
      {() => (
        <>
          <h1>MCP servers</h1>
          <p className="sub">
            add a server to <code>.9p/mcp.json</code> in your project (or <code>~/.9p/mcp.json</code>{" "}
            for all projects), 9p connects on the next session. Each entry shows what it costs your
            context window: tools you don&apos;t need are pure bloat. 9p&apos;s built-in tools
            (read, write, edit, bash, grep, web fetch and more) ship with the agent — this page is
            only about adding more via MCP.
          </p>
          {MCP_GALLERY.map((entry) => (
            <div className="card" key={entry.name}>
              <div className="row spread">
                <strong>{entry.name}</strong>
                <span className="badge warn">{entry.contextCost}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--dim)", margin: "6px 0" }}>{entry.description}</p>
              <Snippet text={JSON.stringify({ mcpServers: entry.config }, null, 2)} />
            </div>
          ))}
        </>
      )}
    </Shell>
  );
}
