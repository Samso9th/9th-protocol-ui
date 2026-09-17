"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthTheme } from "@/components/theme";
import { API_URL, saveTokens } from "@/lib/api";

/** Landing page for an emailed magic link. Redeems the token, then signs in. */
export default function MagicLink() {
  return (
    <Suspense fallback={<div className="auth-wrap" />}>
      <MagicBody />
    </Suspense>
  );
}

function MagicBody() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  // Single-use token. Never redeem twice (StrictMode re-runs effects in dev).
  const redeemed = useRef(false);

  useEffect(() => {
    if (redeemed.current) return;
    redeemed.current = true;

    const token = params.get("token");
    if (!token) {
      setError("This link is missing its sign-in token.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/magic-link/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as {
          message?: string;
          accessToken?: string;
          refreshToken?: string;
        };
        if (!res.ok || !data.accessToken || !data.refreshToken) {
          throw new Error(
            data.message ?? "That link is invalid or has expired",
          );
        }
        saveTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        router.replace("/workspace");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [params, router]);

  return (
    <div className="auth-wrap">
      <AuthTheme />
      <div className="auth-card">
        <h1>{error ? "Link didn't work" : "Signing you in…"}</h1>
        {error && (
          <>
            <p className="sub">{error}</p>
            <p className="sub" style={{ fontSize: 12 }}>
              Magic links work once and expire after 15 minutes.
            </p>
            <a href="/login" className="oauth-btn" style={{ marginTop: 18 }}>
              request a new link
            </a>
          </>
        )}
      </div>
    </div>
  );
}
