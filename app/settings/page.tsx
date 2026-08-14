"use client";

import { Shell, Snippet } from "@/components/shell";
import { API_URL } from "@/lib/api";

export default function Settings() {
  return (
    <Shell>
      {(me) => (
        <>
          <h1>Settings</h1>
          <p className="sub">account & devices</p>
          <div className="card">
            <strong>Account</strong>
            <table style={{ marginTop: 8 }}>
              <tbody>
                <tr>
                  <td style={{ color: "var(--dim)" }}>email</td>
                  <td className="mono">{me.user.email}</td>
                </tr>
                <tr>
                  <td style={{ color: "var(--dim)" }}>name</td>
                  <td>{me.user.name || "-"}</td>
                </tr>
                <tr>
                  <td style={{ color: "var(--dim)" }}>plan</td>
                  <td>
                    <span className="badge accent">{me.user.plan}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card">
            <strong>Connect your CLI</strong>
            <p style={{ fontSize: 13, color: "var(--dim)", margin: "6px 0" }}>
              Install the CLI, then point it at your account (a proper <code>9p login</code> flow is
              coming; for now use your session token from this browser):
            </p>
            <Snippet
              text={`npm install -g @9thprotocol/cli\n\n# ~/.9p/auth.json\n{\n  "apiUrl": "${API_URL}",\n  "token": "<accessToken from your login response>"\n}`}
            />
          </div>
        </>
      )}
    </Shell>
  );
}
