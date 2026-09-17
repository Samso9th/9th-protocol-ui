"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, clearTokens, getTokens, type Me } from "@/lib/api";
import { Icon, type IconName } from "./icon";
import { ThemePicker } from "./theme";
import { ActionButton, Dialog } from "./workspace/primitives";

const PAGES: {
  href: string;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    href: "/workspace",
    label: "New chat",
    description: "A place for your next idea",
    icon: "chat",
  },
  {
    href: "/dashboard",
    label: "Usage & activity",
    description: "Credits, models, and recent activity",
    icon: "chart",
  },
  {
    href: "/connectors",
    label: "Connectors",
    description: "Bring GitHub and Cloudflare into your workflow",
    icon: "plug",
  },
  {
    href: "/skills",
    label: "Skills",
    description: "A little expertise, on demand",
    icon: "sparkles",
  },
  {
    href: "/mcp",
    label: "MCP servers",
    description: "More tools for your agent",
    icon: "server",
  },
  {
    href: "/obsidian",
    label: "Vault memory",
    description: "Knowledge that stays with your project",
    icon: "vault",
  },
  {
    href: "/plans",
    label: "Plans & billing",
    description: "Find your building rhythm",
    icon: "diamond",
  },
  {
    href: "/device",
    label: "Connect a device",
    description: "Sign in from your terminal or desktop",
    icon: "monitor",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Your account, your appearance",
    icon: "settings",
  },
];
export function Brand() {
  return (
    <Link href="/workspace" className="brand" aria-label="9th Protocol home">
      <Image src="/logo.png" alt="" width={46} height={28} priority />
      <span>9th Protocol</span>
    </Link>
  );
}
export function Shell({
  children,
}: {
  children: (me: Me, reload: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<
    | "navigation"
    | "search"
    | "toolkit"
    | "account"
    | "projects"
    | "share"
    | null
  >(null);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const current = PAGES.find((page) => page.href === pathname);
  const isChat = pathname === "/workspace";
  const load = useCallback(() => {
    setError(null);
    api<Me>("/me").then(setMe, (e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!getTokens()) {
      router.replace("/login");
      return;
    }
    load();
  }, [load, router]);
  useEffect(() => {
    setPanel(null);
  }, [pathname]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPanel("search");
      }
    };
    const toolkit = () => setPanel("toolkit");
    window.addEventListener("keydown", onKey);
    window.addEventListener("9p:toolkit", toolkit);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("9p:toolkit", toolkit);
    };
  }, []);
  function newChat() {
    if (isChat) window.dispatchEvent(new Event("9p:new-chat"));
    else router.push("/workspace?new=1");
  }
  if (error)
    return (
      <div className="app-state">
        <Brand />
        <h1>Let’s try that again.</h1>
        <p role="alert">{error}</p>
        <button className="primary-button" onClick={load}>
          Reload workspace
        </button>
        <Link href="/login">Back to sign in</Link>
      </div>
    );
  if (!me)
    return (
      <div className="app-state">
        <Brand />
        <span
          className="loading-dots"
          role="status"
          aria-label="Opening workspace"
        >
          <i />
          <i />
          <i />
        </span>
      </div>
    );
  const name = me.user.name || me.user.email.split("@")[0];
  return (
    <div className={`shell${isChat ? " chat-shell" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="icon-rail" aria-label="Workspace navigation">
        <Link
          href="/workspace"
          className="rail-brand"
          aria-label="9th Protocol home"
        >
          <Image src="/logo.png" alt="" width={36} height={25} priority />
        </Link>
        <ActionButton
          icon="chevron"
          label="Expand navigation"
          className="rail-expand"
          onClick={() => setPanel("navigation")}
        />
        <nav className="rail-primary">
          <ActionButton
            icon="chat"
            label="New chat"
            className="rail-new"
            onClick={newChat}
          />
          <ActionButton
            icon="search"
            label="Search workspace"
            onClick={() => {
              setQuery("");
              setPanel("search");
            }}
          />
          <ActionButton
            icon="folder"
            label="Projects"
            onClick={() => setPanel("projects")}
          />
          <ActionButton
            icon="history"
            label="Chat history"
            onClick={() => {
              if (isChat) window.dispatchEvent(new Event("9p:history"));
              else router.push("/workspace?history=1");
            }}
          />
          <ActionButton
            icon="apps"
            label="Agent toolkit"
            onClick={() => setPanel("toolkit")}
          />
          <Link
            href="/dashboard"
            className={`action-button${pathname === "/dashboard" ? " is-active" : ""}`}
            aria-label="Usage & activity"
            data-tooltip="Usage & activity"
          >
            <Icon name="chart" />
          </Link>
        </nav>
        <div className="rail-bottom">
          <a
            href="https://docs.9thprotocol.com"
            target="_blank"
            rel="noreferrer"
            className="action-button outlined"
            aria-label="Documentation"
            data-tooltip="Documentation"
          >
            <Icon name="help" />
          </a>
          <Link
            href="/settings"
            className={`action-button outlined${pathname === "/settings" ? " is-active" : ""}`}
            aria-label="Settings"
            data-tooltip="Settings"
          >
            <Icon name="settings" />
          </Link>
        </div>
      </aside>
      <div className="workspace-canvas">
        <header className="workspace-toolbar">
          <div className="toolbar-leading">
            <Link href="/plans" className="upgrade-button">
              <Icon name="diamond" size={18} />
              {me.user.plan === "pro" || me.user.plan === "max"
                ? `${me.user.plan[0].toUpperCase()}${me.user.plan.slice(1)} plan`
                : "Go Pro"}
            </Link>
            {!isChat && <span className="view-label">{current?.label}</span>}
          </div>
          <div className="toolbar-actions">
            <ActionButton
              icon="agent"
              label="Your agent toolkit"
              className="outlined"
              onClick={() => setPanel("toolkit")}
            />
            <ActionButton
              icon="share"
              label="Share or export"
              className="outlined"
              onClick={() => {
                if (isChat) window.dispatchEvent(new Event("9p:share"));
                else {
                  setCopied(false);
                  setPanel("share");
                }
              }}
            />
            <button
              className="profile-button"
              aria-label="Your account and appearance"
              title={name}
              onClick={() => setPanel("account")}
            >
              {name[0].toUpperCase()}
            </button>
          </div>
        </header>
        <main
          className={isChat ? "chat-main" : "content"}
          id="main"
          tabIndex={-1}
        >
          {children(me, load)}
        </main>
      </div>
      {panel === "navigation" && (
        <Dialog title="Your workspace" drawer onClose={() => setPanel(null)}>
          <div className="drawer-brand">
            <Brand />
          </div>
          <div className="nav-list">
            {PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                onClick={() => setPanel(null)}
                className={pathname === page.href ? "selected" : ""}
              >
                <Icon name={page.icon} />
                <span>{page.label}</span>
                <Icon name="chevron" size={14} />
              </Link>
            ))}
          </div>
          <div className="drawer-appearance">
            <span>Appearance</span>
            <ThemePicker />
          </div>
        </Dialog>
      )}
      {panel === "search" && (
        <Dialog title="Find your next step" onClose={() => setPanel(null)}>
          <div className="search-field">
            <Icon name="search" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your workspace…"
              aria-label="Search pages"
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="search-results">
            {PAGES.filter((p) =>
              `${p.label} ${p.description}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ).map((p) => (
              <Link href={p.href} key={p.href} onClick={() => setPanel(null)}>
                <span className="tile-icon">
                  <Icon name={p.icon} />
                </span>
                <span>
                  <strong>{p.label}</strong>
                  <small>{p.description}</small>
                </span>
                <Icon name="arrow" size={16} />
              </Link>
            ))}
            {!PAGES.some((p) =>
              `${p.label} ${p.description}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ) && (
              <p className="empty-state">
                No matches. Try “skills” or “billing”.
              </p>
            )}
          </div>
        </Dialog>
      )}
      {panel === "toolkit" && (
        <Dialog
          title="A toolkit for every idea"
          wide
          onClose={() => setPanel(null)}
        >
          <p className="dialog-intro">
            Bring the right knowledge, tools, and connections into your
            workflow.
          </p>
          <div className="toolkit-tiles">
            {PAGES.filter((p) =>
              ["/connectors", "/skills", "/mcp", "/obsidian"].includes(p.href),
            ).map((p) => (
              <Link href={p.href} key={p.href}>
                <span className="tile-icon">
                  <Icon name={p.icon} size={22} />
                </span>
                <strong>{p.label}</strong>
                <p>{p.description}</p>
                <Icon name="arrow" size={17} />
              </Link>
            ))}
          </div>
        </Dialog>
      )}
      {panel === "account" && (
        <Dialog title="Make yourself at home" onClose={() => setPanel(null)}>
          <div className="account-heading">
            <span className="profile-button large">
              {name[0].toUpperCase()}
            </span>
            <div>
              <strong>{name}</strong>
              <p>{me.user.email}</p>
            </div>
          </div>
          <div className="account-appearance">
            <span>Appearance</span>
            <ThemePicker expanded />
          </div>
          <div className="account-links">
            <Link href="/settings">
              Account settings <Icon name="arrow" size={16} />
            </Link>
            <Link href="/plans">
              Manage your plan <Icon name="arrow" size={16} />
            </Link>
            <button
              onClick={() => {
                clearTokens();
                router.replace("/login");
              }}
            >
              Sign out <Icon name="logout" size={16} />
            </button>
          </div>
        </Dialog>
      )}
      {panel === "projects" && (
        <Dialog title="Room for your projects" onClose={() => setPanel(null)}>
          <div className="project-empty">
            <span className="folder-illustration">
              <Icon name="folder" size={54} />
            </span>
            <h3>Your next big thing lives here.</h3>
            <p>
              Connect the desktop app or CLI to work with a local project. Cloud
              project workspaces are coming soon.
            </p>
            <Link href="/device" className="primary-button">
              Connect a device <Icon name="arrow" size={16} />
            </Link>
          </div>
        </Dialog>
      )}
      {panel === "share" && (
        <Dialog
          title="Share this workspace page"
          onClose={() => setPanel(null)}
        >
          <p className="dialog-intro">
            Anyone opening this page sees their own account. Your account data
            stays private.
          </p>
          <button
            className="primary-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${location.origin}${pathname}`,
                );
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            <Icon name={copied ? "check" : "copy"} size={16} />
            {copied ? "Link copied" : "Copy page link"}
          </button>
        </Dialog>
      )}
    </div>
  );
}
export function Snippet({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("error");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  }
  return (
    <div className="snippet">
      <div className="snippet-toolbar">
        <span>
          <Icon name="terminal" size={14} />
          Snippet
        </span>
        <button onClick={copy}>
          <Icon name={state === "copied" ? "check" : "copy"} size={13} />
          <span role="status">
            {state === "copied"
              ? "Copied"
              : state === "error"
                ? "Select text to copy"
                : "Copy"}
          </span>
        </button>
      </div>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  );
}
