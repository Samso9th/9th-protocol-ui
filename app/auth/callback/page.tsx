"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthTheme } from "@/components/theme";
import { API_URL, saveTokens } from "@/lib/api";

/**
 * OAuth landing page. The API redirects here with a one-time `code` rather than
 * tokens in the URL, JWTs in a query string leak through browser history,
 * referrer headers, and server logs.
 */
export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="auth-wrap" />}>
      <CallbackBody />
    </Suspense>
  );
}

function CallbackBody() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  // The code is single-use; React StrictMode double-invokes effects in dev and
  // the second redemption would fail. Guard so it's only ever exchanged once.
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    const code = params.get("code");
    if (!code) {
      setError("No sign-in code was provided.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = (await res.json()) as {
          message?: string;
          accessToken?: string;
          refreshToken?: string;
        };
        if (!res.ok || !data.accessToken || !data.refreshToken) {
          throw new Error(data.message ?? "Sign-in failed");
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
        <h1>{error ? "Sign-in failed" : "Signing you in…"}</h1>
        {error && (
          <>
            <p className="sub">{error}</p>
            <a href="/login" className="oauth-btn" style={{ marginTop: 18 }}>
              back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
