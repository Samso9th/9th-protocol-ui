// Exercises the browser chat transport with fragmented SSE and authentication retries.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "9p-chat-test-"));
const originalFetch = globalThis.fetch;
try {
  for (const name of ["api", "chat"]) {
    const source = await fs.readFile(
      new URL(`../lib/${name}.ts`, import.meta.url),
      "utf8",
    );
    const compiled = ts
      .transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
        },
      })
      .outputText.replace('"./api"', '"./api.mjs"');
    await fs.writeFile(path.join(temp, `${name}.mjs`), compiled);
  }
  const { streamChat } = await import(`file://${temp}/chat.mjs`);
  const saved = new Map([
    [
      "9p.tokens",
      JSON.stringify({ accessToken: "old", refreshToken: "refresh" }),
    ],
  ]);
  globalThis.localStorage = {
    getItem: (k) => saved.get(k) || null,
    setItem: (k, v) => saved.set(k, v),
    removeItem: (k) => saved.delete(k),
  };
  globalThis.window = { location: { href: "/workspace" } };
  const signal = new AbortController().signal;
  let requests = [],
    answer = "";
  const wire =
    'data: {"choices":[{"delta":{"content":"Hello "}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":"世界"}}]}\n\ndata: {"usage":{"tokens":2}}\n\ndata: [DONE]\n\n';
  const bytes = new TextEncoder().encode(wire);
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init });
    if (url.endsWith("/auth/refresh"))
      return Response.json({ accessToken: "new", refreshToken: "refresh" });
    if (init.headers.Authorization === "Bearer old")
      return new Response("", { status: 401 });
    return new Response(
      new ReadableStream({
        start(controller) {
          for (let i = 0; i < bytes.length; i += 3)
            controller.enqueue(bytes.slice(i, i + 3));
          controller.close();
        },
      }),
    );
  };
  const args = {
    model: "test/model",
    messages: [
      {
        id: "private-id",
        role: "user",
        content: "Build a thing",
        feedback: "up",
      },
    ],
    sessionId: "session-id",
    signal,
    onText: (text) => (answer += text),
  };
  await streamChat(args);
  assert.equal(answer, "Hello 世界");
  assert.equal(requests.length, 3);
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[2].init.headers.Authorization, "Bearer new");
  assert.equal(requests[2].init.signal, signal);
  const body = JSON.parse(requests[2].init.body);
  assert.deepEqual(body.messages, [{ role: "user", content: "Build a thing" }]);
  assert.equal(body.model, "test/model");
  assert.equal(body.context.sessionId, "session-id");
  assert.match(
    body.context.memory,
    /No filesystem, terminal, or browsing tools/,
  );
  globalThis.fetch = async () =>
    Response.json({ message: "Credits exhausted" }, { status: 402 });
  await assert.rejects(() => streamChat(args), /Credits exhausted/);
  globalThis.fetch = async () =>
    new Response('data: {"error":{"message":"Provider unavailable"}}\n\n');
  await assert.rejects(() => streamChat(args), /Provider unavailable/);
  globalThis.fetch = async () => {
    throw new DOMException("Stopped", "AbortError");
  };
  await assert.rejects(
    () => streamChat(args),
    (error) => error.name === "AbortError",
  );
  globalThis.fetch = async () => new Response("", { status: 401 });
  await assert.rejects(() => streamChat(args), /not authenticated/);
  assert.equal(window.location.href, "/login");
  assert.equal(saved.has("9p.tokens"), false);
  console.log(
    "PASS: fragmented SSE/Unicode, auth refresh, message payload, stream errors, aborts, and expired-session redirect.",
  );
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.localStorage;
  await fs.rm(temp, { recursive: true, force: true });
}
