"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
        <p className="sub">create your account, includes a free trial (~2–3 tasks)</p>
        <label>name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <label>email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>password (min 8 chars)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        {error && <div className="error-text">{error}</div>}
        <div style={{ marginTop: 18 }} className="row spread">
          <button disabled={busy}>{busy ? "…" : "create account"}</button>
          <Link href="/login">sign in instead</Link>
        </div>
      </form>
    </div>
  );
}
