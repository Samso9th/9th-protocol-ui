"use client";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import {
  ActionButton,
  AmbientBand,
  ChoiceMenu,
  Dialog,
  FeaturePreview,
  PillButton,
} from "@/components/workspace/primitives";
import { Markdown } from "@/components/workspace/markdown";
import { useDictation } from "@/components/workspace/dictation";
import { api, type Me } from "@/lib/api";
import {
  streamChat,
  type ChatMessage,
  type ChatModel,
  type ChatSession,
} from "@/lib/chat";

const fresh = (): ChatSession => ({
  id: crypto.randomUUID(),
  title: "New conversation",
  messages: [],
  updatedAt: new Date().toISOString(),
});
interface Attachment {
  name: string;
  text: string;
}
export default function Workspace() {
  return <Shell>{(me) => <ChatWorkspace me={me} />}</Shell>;
}
function ChatWorkspace({ me }: { me: Me }) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [draft, setDraft] = useState("");
  const [models, setModels] = useState<ChatModel[]>([]);
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [think, setThink] = useState(false);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [dialog, setDialog] = useState<"history" | "share" | "more" | null>(
    null,
  );
  const [feature, setFeature] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const controller = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLFormElement>(null);
  const sessionRef = useRef<ChatSession | null>(null);
  const historyRef = useRef<ChatSession[]>([]);
  const stickToBottom = useRef(true);
  useEffect(
    () => () => {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    },
    [],
  );
  const storageKey = `9p.chats.${me.user.id}`;
  const dictation = useDictation(
    (text) => setDraft((value) => `${value}${value ? " " : ""}${text}`),
    setNotice,
  );
  useEffect(() => {
    let active = true;
    let saved: ChatSession[] = [];
    try {
      const parsed: unknown = JSON.parse(
        sessionStorage.getItem(storageKey) || "[]",
      );
      if (Array.isArray(parsed))
        saved = parsed.filter(
          (s) =>
            s &&
            typeof s.id === "string" &&
            typeof s.title === "string" &&
            Array.isArray(s.messages) &&
            s.messages.every(
              (m: ChatMessage) =>
                m &&
                (m.role === "user" || m.role === "assistant") &&
                typeof m.content === "string",
            ),
        );
    } catch {
      /* A fresh workspace is usable without saved history. */
    }
    setHistory(saved);
    historyRef.current = saved;
    const params = new URLSearchParams(location.search);
    setSession(params.has("new") ? fresh() : saved[0] || fresh());
    if (params.has("history")) setDialog("history");
    if (params.has("new") || params.has("history")) {
      params.delete("new");
      params.delete("history");
      window.history.replaceState(
        window.history.state,
        "",
        location.pathname + (params.size ? `?${params}` : ""),
      );
    }
    api<{ models: ChatModel[] }>("/models").then(
      (data) => {
        if (!active) return;
        setModels(data.models);
        setModel(data.models.find((item) => !item.locked)?.id || "");
      },
      () => {
        if (active)
          setNotice(
            "We couldn’t load your models. Refresh the page to try again.",
          );
      },
    );
    return () => {
      active = false;
      controller.current?.abort();
      const current = sessionRef.current;
      if (current?.messages.length) {
        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(
              [
                current,
                ...historyRef.current.filter((item) => item.id !== current.id),
              ].slice(0, 12),
            ),
          );
        } catch {
          /* Export remains available if storage is full. */
        }
      }
    };
  }, [storageKey]);
  sessionRef.current = session;
  useEffect(() => {
    if (!session?.messages.length) return;
    const timer = setTimeout(() => {
      const next = [
        session,
        ...historyRef.current.filter((item) => item.id !== session.id),
      ].slice(0, 12);
      historyRef.current = next;
      setHistory(next);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        setNotice(
          "This conversation could not be saved in this browser tab. You can export it from Share.",
        );
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [session, storageKey]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    if (stickToBottom.current && log.current)
      log.current.scrollTop = log.current.scrollHeight;
  }, [session?.messages]);
  useEffect(() => {
    function rememberCurrent() {
      const current = sessionRef.current;
      if (!current?.messages.length) return;
      const next = [
        current,
        ...historyRef.current.filter((item) => item.id !== current.id),
      ].slice(0, 12);
      historyRef.current = next;
      setHistory(next);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        setNotice(
          "History couldn’t be saved. Export your conversation to keep a copy.",
        );
      }
    }
    function newChat() {
      if (busyRef.current) {
        setNotice("Stop the current response before starting a new chat.");
        return;
      }
      rememberCurrent();
      setSession(fresh());
      setDraft("");
      setFiles([]);
      setFailure("");
      input.current?.focus();
    }
    const showHistory = () => {
      rememberCurrent();
      setDialog("history");
    };
    const share = () => setDialog("share");
    window.addEventListener("9p:new-chat", newChat);
    window.addEventListener("9p:history", showHistory);
    window.addEventListener("9p:share", share);
    return () => {
      window.removeEventListener("9p:new-chat", newChat);
      window.removeEventListener("9p:history", showHistory);
      window.removeEventListener("9p:share", share);
    };
  }, [storageKey]);
  async function send(retry = false) {
    if (!session || !model || busyRef.current || (!retry && !draft.trim()))
      return;
    const oldTop = composer.current?.getBoundingClientRect().top;
    const text =
      draft.trim() +
      (files.length
        ? "\n\n" +
          files
            .map((file) => `Attached file: ${file.name}\n\n${file.text}`)
            .join("\n\n")
        : "");
    const user: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      displayContent:
        draft.trim() +
        (files.length
          ? "\n\n" + files.map((file) => `📎 ${file.name}`).join(" · ")
          : ""),
      content:
        text +
        (think
          ? "\n\nConsider alternatives carefully and explain the reasoning behind your recommendation."
          : ""),
    };
    const messages = retry
      ? session.messages.slice(0, -1)
      : [...session.messages, user];
    const answer: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      model,
    };
    const next = {
      ...session,
      title: session.messages.length
        ? session.title
        : draft.trim().slice(0, 70),
      messages: [...messages, answer],
      updatedAt: new Date().toISOString(),
    };
    setSession(next);
    setDraft("");
    setFiles([]);
    setBusy(true);
    busyRef.current = true;
    setFailure("");
    stickToBottom.current = true;
    requestAnimationFrame(() => {
      if (
        oldTop !== undefined &&
        composer.current &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const offset = oldTop - composer.current.getBoundingClientRect().top;
        composer.current.animate(
          [
            { transform: `translateY(${offset}px)` },
            { transform: "translateY(0)" },
          ],
          { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      }
    });
    const abort = new AbortController();
    controller.current = abort;
    try {
      await streamChat({
        model,
        messages,
        sessionId: session.id,
        signal: abort.signal,
        onText: (text) =>
          setSession((current) =>
            current
              ? {
                  ...current,
                  messages: current.messages.map((message) =>
                    message.id === answer.id
                      ? { ...message, content: message.content + text }
                      : message,
                  ),
                }
              : current,
          ),
      });
    } catch (error) {
      if (!abort.signal.aborted)
        setFailure(
          error instanceof Error
            ? error.message
            : "The response could not be completed.",
        );
      else setNotice("Response stopped.");
    } finally {
      setBusy(false);
      busyRef.current = false;
      controller.current = null;
    }
  }
  async function attach(selected: FileList | null) {
    if (!selected) return;
    const next = [...files];
    for (const file of Array.from(selected)) {
      if (
        !/\.(txt|md|json|[cm]?[jt]sx?|py|css|html|csv|ya?ml|log)$/i.test(
          file.name,
        ) ||
        file.size > 50_000
      ) {
        setNotice(
          "Attach text or code files up to 50 KB each. Images and larger files are coming soon.",
        );
        continue;
      }
      if (next.length >= 3) {
        setNotice("You can attach up to three files per message.");
        break;
      }
      try {
        next.push({ name: file.name, text: await file.text() });
      } catch {
        setNotice(`Couldn’t read ${file.name}.`);
      }
    }
    setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Clipboard access is unavailable. Select the text to copy it.");
    }
  }
  function download() {
    if (!session) return;
    const text = session.messages
      .map(
        (m) =>
          `## ${m.role === "user" ? "You" : "9th Protocol"}\n\n${m.content}`,
      )
      .join("\n\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "9th-protocol-conversation.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDialog(null);
  }
  const messages = session?.messages || [];
  const empty = !messages.length;
  return (
    <section
      className={`chat-workspace${empty ? " is-empty" : ""}${busy ? " is-working" : ""}`}
      aria-label="9th Protocol chat"
    >
      <AmbientBand />
      <div
        className="conversation"
        ref={log}
        onScroll={() => {
          const el = log.current;
          if (el)
            stickToBottom.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
      >
        {empty ? (
          <div className="welcome">
            <h1>
              What can we build
              <br className="mobile-break" /> for you today?
            </h1>
          </div>
        ) : (
          <>
            <div className="conversation-date">Today</div>
            {messages.map((message, index) => (
              <article className={`message ${message.role}`} key={message.id}>
                {message.role === "assistant" && (
                  <div className="assistant-identity">
                    <span className="assistant-mark">
                      <Icon name="sparkles" size={14} />
                    </span>
                    <span>9th Protocol</span>
                    <span className="model-caption">
                      {
                        models.find(
                          (item) => item.id === (message.model || model),
                        )?.name
                      }
                    </span>
                  </div>
                )}
                {message.content ? (
                  <Markdown text={message.displayContent || message.content} />
                ) : busy ? (
                  <span
                    className="loading-dots"
                    role="status"
                    aria-label="Thinking"
                  >
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <p className="empty-response">
                    {failure
                      ? "The response wasn’t completed."
                      : "No text was returned. Try a different model or retry."}
                  </p>
                )}
                {message.role === "assistant" && message.content && (
                  <div className="message-actions">
                    <ActionButton
                      icon="copy"
                      label="Copy response"
                      onClick={() => void copy(message.content)}
                    />
                    <ActionButton
                      icon="audio"
                      label="Read response aloud"
                      onClick={() => {
                        if ("speechSynthesis" in window) {
                          speechSynthesis.cancel();
                          speechSynthesis.speak(
                            new SpeechSynthesisUtterance(message.content),
                          );
                        } else
                          setNotice(
                            "Read aloud is not supported in this browser.",
                          );
                      }}
                    />
                    <ActionButton
                      icon="like"
                      label="Helpful response"
                      active={message.feedback === "up"}
                      onClick={() =>
                        setSession((current) =>
                          current
                            ? {
                                ...current,
                                messages: current.messages.map((m) =>
                                  m.id === message.id
                                    ? {
                                        ...m,
                                        feedback:
                                          m.feedback === "up"
                                            ? undefined
                                            : "up",
                                      }
                                    : m,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                    <ActionButton
                      icon="dislike"
                      label="Unhelpful response"
                      active={message.feedback === "down"}
                      onClick={() =>
                        setSession((current) =>
                          current
                            ? {
                                ...current,
                                messages: current.messages.map((m) =>
                                  m.id === message.id
                                    ? {
                                        ...m,
                                        feedback:
                                          m.feedback === "down"
                                            ? undefined
                                            : "down",
                                      }
                                    : m,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                    {index === messages.length - 1 && (
                      <ActionButton
                        icon="refresh"
                        label="Regenerate response"
                        disabled={busy}
                        onClick={() => void send(true)}
                      />
                    )}
                  </div>
                )}
              </article>
            ))}
            {failure && (
              <div className="chat-error" role="alert">
                <Icon name="help" size={18} />
                <p>{failure}</p>
                <button onClick={() => void send(true)} disabled={busy}>
                  Retry
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="composer-stage">
        <form
          ref={composer}
          className="floating-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="composer-surface">
            <label className="sr-only" htmlFor="chat-input">
              Message 9th Protocol
            </label>
            <textarea
              ref={input}
              id="chat-input"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="What do you want to build…"
            />
            {files.length > 0 && (
              <div className="attachment-list">
                {files.map((file, i) => (
                  <span key={`${file.name}-${i}`}>
                    <Icon name="file" size={13} />
                    {file.name}
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() =>
                        setFiles((current) => current.filter((_, n) => n !== i))
                      }
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="composer-tools">
              <div className="tool-chips">
                <ActionButton
                  icon="attach"
                  label="Attach a file"
                  className="outlined"
                  onClick={() => fileInput.current?.click()}
                />
                <input
                  type="file"
                  ref={fileInput}
                  hidden
                  multiple
                  accept=".txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.css,.html,.csv,.yml,.yaml,.log"
                  onChange={(e) => void attach(e.target.files)}
                />
                <PillButton
                  icon="brain"
                  active={think}
                  onClick={() => setThink((value) => !value)}
                >
                  Think Bigger
                </PillButton>
                <PillButton
                  icon="research"
                  onClick={() =>
                    setFeature({
                      title: "Deep Research",
                      description:
                        "A dedicated research workflow with live sources is on the way. Direct chat can already help you reason through a question with the selected model.",
                    })
                  }
                >
                  Deep Research
                </PillButton>
                <PillButton icon="apps" onClick={() => setDialog("more")}>
                  More
                </PillButton>
              </div>
              <div className="send-actions">
                <ActionButton
                  icon="wave"
                  label={
                    dictation.listening ? "Stop voice input" : "Voice input"
                  }
                  active={dictation.listening}
                  className={`outlined${dictation.listening ? " listening" : ""}`}
                  onClick={dictation.toggle}
                />
                <button
                  className="send-button"
                  type={busy ? "button" : "submit"}
                  aria-label={busy ? "Stop response" : "Send message"}
                  disabled={!busy && (!draft.trim() || !model)}
                  onClick={busy ? () => controller.current?.abort() : undefined}
                >
                  <Icon name={busy ? "stop" : "send"} size={19} />
                </button>
              </div>
            </div>
          </div>
          <div className="composer-dock">
            <ChoiceMenu
              label="Chat mode"
              icon="audio"
              value="chat"
              options={[
                { value: "chat", label: "Direct Chat" },
                {
                  value: "agent",
                  label: "Agent workspace",
                  disabled: true,
                  note: "Coming soon",
                },
              ]}
              onChange={() => {}}
            />
            <div className="model-control">
              <span>Models</span>
              <ChoiceMenu
                label="Model"
                icon="sparkles"
                value={model}
                options={models.map((item) => ({
                  value: item.id,
                  label: item.name,
                  disabled: item.locked,
                }))}
                onChange={setModel}
              />
            </div>
          </div>
        </form>
        <p className="composer-caption">
          9th Protocol <span>·</span> Your models. Your possibilities.
        </p>
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {feature && (
        <FeaturePreview {...feature} onClose={() => setFeature(null)} />
      )}
      {dialog === "history" && (
        <Dialog
          title="Pick up where you left off"
          onClose={() => setDialog(null)}
        >
          <p className="dialog-intro">
            Conversations saved in this browser tab.
          </p>
          <div className="history-list">
            {history.length ? (
              history.map((item) => (
                <button
                  key={item.id}
                  disabled={busy}
                  onClick={() => {
                    setSession(item);
                    setFailure("");
                    setDialog(null);
                  }}
                >
                  <Icon name="chat" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {new Date(item.updatedAt).toLocaleDateString()} ·{" "}
                      {item.messages.length} messages
                    </small>
                  </span>
                  <Icon name="chevron" size={15} />
                </button>
              ))
            ) : (
              <div className="empty-state">
                <Icon name="history" size={32} />
                <h3>Your story starts here.</h3>
                <p>Start a conversation and you’ll find it here.</p>
              </div>
            )}
          </div>
        </Dialog>
      )}
      {dialog === "share" && (
        <Dialog
          title="Good ideas are worth keeping"
          onClose={() => setDialog(null)}
        >
          <p className="dialog-intro">
            Export this conversation, or copy it to take your work anywhere.
            Public share links are coming soon.
          </p>
          <div className="share-actions">
            <button
              className="primary-button"
              disabled={!messages.length}
              onClick={download}
            >
              <Icon name="file" size={17} />
              Download conversation
            </button>
            <PillButton
              icon="copy"
              disabled={!messages.length}
              onClick={() =>
                void copy(
                  messages
                    .map(
                      (m) =>
                        `${m.role === "user" ? "You" : "9th Protocol"}\n${m.content}`,
                    )
                    .join("\n\n"),
                )
              }
            >
              Copy conversation
            </PillButton>
          </div>
        </Dialog>
      )}
      {dialog === "more" && (
        <Dialog
          title="What would you like to do?"
          onClose={() => setDialog(null)}
        >
          <div className="more-actions">
            <button
              onClick={() => {
                setDialog(null);
                window.dispatchEvent(new Event("9p:toolkit"));
              }}
            >
              <Icon name="apps" />
              <span>
                <strong>Explore your toolkit</strong>
                <small>Skills, connectors, memory, and MCP</small>
              </span>
              <Icon name="arrow" />
            </button>
            <button
              onClick={() => {
                setDialog(null);
                setFeature({
                  title: "Create an image",
                  description:
                    "Image generation will live here, alongside your conversations and code. This tool is not connected yet.",
                });
              }}
            >
              <Icon name="image" />
              <span>
                <strong>Create an image</strong>
                <small>From an idea to a visual · Coming soon</small>
              </span>
              <Icon name="arrow" />
            </button>
            <button
              onClick={() => {
                setDraft(
                  "Help me plan a new feature. Start by asking what I want to build.",
                );
                setDialog(null);
                input.current?.focus();
              }}
            >
              <Icon name="brain" />
              <span>
                <strong>Plan something new</strong>
                <small>Turn an idea into a clear next step</small>
              </span>
              <Icon name="arrow" />
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
