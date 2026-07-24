"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL, saveTokens } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
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

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>9th Protocol</h1>
        <p className="sub">sign in to your account</p>
        <label>email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="error-text">{error}</div>}
        <div style={{ marginTop: 18 }} className="row spread">
          <button disabled={busy}>{busy ? "…" : "sign in"}</button>
          <Link href="/register">create account</Link>
        </div>
        <p className="sub" style={{ marginTop: 18, fontSize: 12 }}>
          Google / GitHub / LinkedIn sign-in arrive once OAuth apps are approved.
        </p>
      </form>
    </div>
  );
}
