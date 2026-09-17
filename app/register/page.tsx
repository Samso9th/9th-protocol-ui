"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/shell";
import { AuthTheme } from "@/components/theme";
import { API_URL, saveTokens } from "@/lib/api";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as {
        message?: string;
        accessToken?: string;
        refreshToken?: string;
      };
      if (!res.ok || !data.accessToken || !data.refreshToken) {
        throw new Error(data.message ?? "registration failed");
      }
      saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.push("/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <AuthTheme />
      <form className="auth-card" onSubmit={submit}>
        <Brand />
        <h1>Make room for your next idea.</h1>
        <p className="sub">
          Start with a free trial, enough for about 2–3 tasks.
        </p>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          autoComplete="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password">Password (at least 8 characters)</label>
        <input
          id="password"
          autoComplete="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        {error && (
          <div className="error-text" role="alert">
            {error}
          </div>
        )}
        <div style={{ marginTop: 18 }} className="row spread">
          <button disabled={busy}>{busy ? "…" : "Create account"}</button>
          <Link href="/login">Sign in instead</Link>
        </div>
      </form>
    </div>
  );
}
