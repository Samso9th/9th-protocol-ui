"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/shell";
import { api } from "@/lib/api";

interface Pending {
  userCode: string;
  clientLabel: string;
  expiresAt: string;
}

type Status = "idle" | "checking" | "found" | "approved" | "denied" | "error";

/** Device-grant approval screen — the browser half of `9p login`. */
export default function DevicePage() {
  return (
    <Suspense fallback={<div className="content">loading…</div>}>
      <Shell>{() => <DeviceBody />}</Shell>
    </Suspense>
  );
}

function DeviceBody() {
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  // A code in the URL means the CLI opened this page for us.
  useEffect(() => {
    const fromUrl = params.get("code");
    if (fromUrl) {
      setCode(fromUrl.toUpperCase());
      void lookup(fromUrl.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookup(userCode: string) {
    setStatus("checking");
    setMessage("");
    try {
      const p = await api<Pending>(`/auth/device/pending?userCode=${encodeURIComponent(userCode)}`);
      setPending(p);
      setStatus("found");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not find that code");
    }
  }

  async function decide(action: "approve" | "deny") {
    try {
      await api("/auth/device/approve", { json: { userCode: pending?.userCode ?? code, action } });
      setStatus(action === "approve" ? "approved" : "denied");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "approved") {
    return (
      <>
        <h1>Device connected</h1>
        <p className="sub">Your terminal is signed in. You can close this tab.</p>
        <div className="card">
          <p>
            Back in the terminal, <code>9p</code> is ready to use.
          </p>
        </div>
      </>
    );
  }

  if (status === "denied") {
    return (
      <>
        <h1>Request denied</h1>
        <p className="sub">Nothing was connected. You can close this tab.</p>
      </>
    );
  }

  return (
    <>
      <h1>Connect a device</h1>
      <p className="sub">Enter the code shown in your terminal after running <code>9p login</code></p>

      {status !== "found" && (
        <div className="card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) void lookup(code.trim().toUpperCase());
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              className="mono"
              autoFocus
              style={{ fontSize: 22, letterSpacing: 2, width: "100%", padding: "10px 12px" }}
            />
            <button type="submit" style={{ marginTop: 12 }} disabled={status === "checking"}>
              {status === "checking" ? "checking…" : "Continue"}
            </button>
          </form>
          {message && (
            <p style={{ color: "var(--warn, #d97757)", marginTop: 10 }}>{message}</p>
          )}
        </div>
      )}

      {status === "found" && pending && (
        <div className="card">
          <p>
            <strong>{pending.clientLabel || "A device"}</strong> is asking to sign in to your
            9th Protocol account.
          </p>
          <p className="mono" style={{ fontSize: 20, letterSpacing: 2, margin: "14px 0" }}>
            {pending.userCode}
          </p>
          {/* Device grants are phishable: only the person at the terminal should see this code. */}
          <p className="sub">
            Only approve this if you just ran <code>9p login</code> yourself. Approving gives
            this device full access to your account and credits.
          </p>
          <div className="row" style={{ gap: 10, marginTop: 16 }}>
            <button onClick={() => void decide("approve")}>Approve</button>
            <button className="ghost" onClick={() => void decide("deny")}>
              Deny
            </button>
          </div>
          {message && <p style={{ color: "var(--warn, #d97757)", marginTop: 10 }}>{message}</p>}
        </div>
      )}
    </>
  );
}
