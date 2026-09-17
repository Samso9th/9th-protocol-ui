import { apiResponse } from "./api";
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  model?: string;
  feedback?: "up" | "down";
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

export async function streamChat({
  model,
  messages,
  sessionId,
  signal,
  onText,
}: {
  model: string;
  messages: ChatMessage[];
  sessionId: string;
  signal: AbortSignal;
  onText: (text: string) => void;
}) {
  const response = await apiResponse("/chat/completions", {
    signal,
    json: {
      model,
      messages: messages.map(({ role, content }) => ({ role, content })),
      context: {
        sessionId,
        platform: "Web browser",
        memory:
          "This is a direct chat in the 9th Protocol web app. No filesystem, terminal, or browsing tools are available in this session. Give explanations and code, and never claim to have edited files, run commands, or researched live sources.",
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
    };
    if (chunk.error)
      throw new Error(
        chunk.error.message || "The model could not complete this response.",
      );
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
