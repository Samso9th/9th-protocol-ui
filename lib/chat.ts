import { api, apiResponse } from "./api";
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  model?: string;
  feedback?: "up" | "down";
  /** Server-executed tool calls made while producing this message. */
  tools?: ToolActivity[];
}
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}
export interface ChatModel {
  id: string;
  name: string;
  locked: boolean;
  tier: string;
}

/** One server-executed tool call, surfaced so the user sees why a turn is slow. */
export interface ToolActivity {
  id: string;
  name: string;
  status: "running" | "done" | "error";
  query?: string;
  url?: string;
}

/** Tools the API can run on our behalf. Browsers can do neither themselves. */
export const WEB_TOOLS = ["web_search", "web_fetch"] as const;

export async function streamChat({
  model,
  messages,
  sessionId,
  signal,
  onText,
  tools,
  onTool,
}: {
  model: string;
  messages: ChatMessage[];
  sessionId: string;
  signal: AbortSignal;
  onText: (text: string) => void;
  /** Server-executed tool names; omit for a plain text turn. */
  tools?: readonly string[];
  onTool?: (activity: ToolActivity) => void;
}) {
  const response = await apiResponse("/chat/completions", {
    signal,
    json: {
      model,
      messages: messages.map(({ role, content }) => ({ role, content })),
      ...(tools?.length ? { serverTools: tools } : {}),
      context: {
        sessionId,
        platform: "Web browser",
        memory: tools?.length
          ? "This is a direct chat in the 9th Protocol web app. You can search the " +
            "web with web_search and read a page with web_fetch; both run on the " +
            "server. You have no filesystem or terminal here, so never claim to " +
            "have edited files or run commands. Cite the URLs you actually " +
            "fetched, and never invent a source you did not retrieve."
          : "This is a direct chat in the 9th Protocol web app. No filesystem, terminal, or browsing tools are available in this session. Give explanations and code, and never claim to have edited files, run commands, or researched live sources.",
      },
    },
  });
  if (!response.body)
    throw new Error("The response stream is unavailable. Please try again.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const consume = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    const chunk = JSON.parse(data) as {
      error?: { message?: string };
      choices?: { delta?: { content?: string } }[];
      tool?: ToolActivity;
    };
    if (chunk.error)
      throw new Error(
        chunk.error.message || "The model could not complete this response.",
      );
    // Tool frames are additive: a client that ignores them still renders the text.
    if (chunk.tool) onTool?.(chunk.tool);
    const text = chunk.choices?.[0]?.delta?.content;
    if (typeof text === "string") onText(text);
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) consume(line.trimEnd());
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer.trim());
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export interface Capabilities {
  schemaVersion: number;
  features: Record<string, { available: boolean; reason?: string; providers?: string[] }>;
  limits: Record<string, number>;
}

/**
 * Ask the API what it can actually serve, so the composer offers web search
 * only where a provider is configured. A deployment with no search keys should
 * show no search affordance rather than one that fails on use.
 *
 * Returns null rather than throwing: capability discovery failing must not
 * block a plain chat turn.
 */
export async function fetchCapabilities(): Promise<Capabilities | null> {
  try {
    return await api<Capabilities>("/capabilities");
  } catch {
    return null;
  }
}
