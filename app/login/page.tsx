"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_URL, saveTokens } from "@/lib/api";

type Mode = "magic" | "password";

export default function Login() {
  return (
    <Suspense fallback={<div className="auth-wrap" />}>
      <LoginBody />
    </Suspense>
  );
}

function LoginBody() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The GitHub callback redirects here with ?error=... when something failed.
  useEffect(() => {
    const e = params.get("error");
    if (e) setError(e);
  }, [params]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Could not send the magic link");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        message?: string;
        accessToken?: string;
        refreshToken?: string;
      };
      if (!res.ok || !data.accessToken || !data.refreshToken) {
        throw new Error(data.message ?? "login failed");
      }
      saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p className="sub">
            If an account can be created or found for <strong>{email}</strong>, a magic link
            is on its way. It expires in 15 minutes.
          </p>
          <button className="ghost" style={{ marginTop: 18 }} onClick={() => setSent(false)}>
            use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={mode === "magic" ? sendMagicLink : signInWithPassword}>
        <h1>9th Protocol</h1>
        <p className="sub">sign in to your account</p>

        <a className="oauth-btn" href={`${API_URL}/auth/github`}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          Continue with GitHub
        </a>

        <div className="divider"><span>or</span></div>

        <label>email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        {mode === "password" && (
          <>
            <label>password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        )}

        {error && <div className="error-text">{error}</div>}

        <div style={{ marginTop: 18 }} className="row spread">
          <button disabled={busy}>
            {busy ? "…" : mode === "magic" ? "email me a magic link" : "sign in"}
          </button>
          <Link href="/register">create account</Link>
        </div>

        <button
          type="button"
          className="linkish"
          onClick={() => {
            setMode(mode === "magic" ? "password" : "magic");
            setError(null);
          }}
        >
          {mode === "magic" ? "use a password instead" : "email me a link instead"}
        </button>
      </form>
    </div>
  );
}
