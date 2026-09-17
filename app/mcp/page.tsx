"use client";
import { Shell } from "@/components/shell";
import { Library } from "@/components/workspace/library";
import { MCP_GALLERY } from "@/lib/gallery";
export default function McpPage() {
  return (
    <Shell>
      {() => (
        <Library
          title="Make room for more."
          description="Connect your local agent to tools through MCP. Explore a server, copy its configuration, and make it part of your workflow."
          icon="server"
          entries={MCP_GALLERY.map((entry) => ({
            name: entry.name,
            description: entry.description,
            note: entry.contextCost,
            content: JSON.stringify({ mcpServers: entry.config }, null, 2),
            instructions:
              "Add this to .9p/mcp.json for your project, or ~/.9p/mcp.json globally. The server connects on your next local session. Each additional tool uses context, so choose the ones you need.",
          }))}
        />
      )}
    </Shell>
  );
}
