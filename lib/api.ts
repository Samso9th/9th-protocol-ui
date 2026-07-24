"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4009/v1";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("9p.tokens");
  return raw ? (JSON.parse(raw) as Tokens) : null;
}

export function saveTokens(t: Tokens): void {
  localStorage.setItem("9p.tokens", JSON.stringify(t));
}

export function clearTokens(): void {
  localStorage.removeItem("9p.tokens");
}

async function tryRefresh(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens) return false;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });
  if (!res.ok) return false;
  saveTokens((await res.json()) as Tokens);
  return true;
}

/** Authenticated fetch with a single refresh retry; redirects to /login on failure. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const doFetch = () => {
    const tokens = getTokens();
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
        ...init?.headers,
      },
      ...(init?.json !== undefined ? { body: JSON.stringify(init.json) } : {}),
    });
  };
  let res = await doFetch();
  if (res.status === 401 && (await tryRefresh())) res = await doFetch();
  if (res.status === 401) {
    clearTokens();
    window.location.href = "/login";
    throw new Error("not authenticated");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface LimitState {
  plan: string;
  balance: number;
  windowSpent: number;
  windowCap: number;
  weeklySpent: number;
  weeklyCap: number;
}

export interface Me {
  user: { id: string; email: string; name: string; plan: string };
  limits: LimitState;
}
