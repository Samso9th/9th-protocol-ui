"use client";

import { Shell, Snippet } from "@/components/shell";
import { SKILLS_GALLERY } from "@/lib/gallery";

export default function SkillsPage() {
  return (
    <Shell>
      {() => (
        <>
          <h1>Skills</h1>
          <p className="sub">
            skills are markdown playbooks in <code>.9p/skills/</code> (project) or{" "}
            <code>~/.9p/skills/</code> (global), invoked as <code>/name</code> in any session. A
            skill&apos;s content only enters context when you invoke it — never preloaded.
          </p>
          <div className="card">
            <strong>Skill format</strong>
            <Snippet
              text={`---\nname: ship\ndescription: stage, review, and open a PR\n---\n1. Run the project's tests and typecheck.\n2. Summarize the diff and write a commit message.\n3. Commit, push a branch, open a PR with the summary.`}
            />
            <p style={{ fontSize: 13, color: "var(--dim)", marginTop: 8 }}>
              save as <code>.9p/skills/ship.md</code> → invoke with <code>/ship</code>
            </p>
          </div>
          <h2>Curated collections</h2>
          <p className="sub">
            adapt these community collections into 9p skill files — copy the parts you need, keep
            them small
          </p>
          <div className="grid">
            {SKILLS_GALLERY.map((s) => (
              <div className="card" key={s.name}>
                <strong>{s.name}</strong>
                <p style={{ fontSize: 13, color: "var(--dim)", margin: "6px 0" }}>{s.description}</p>
                <div className="row spread">
                  <a href={s.repo} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                    source ↗
                  </a>
                  <span className="badge">{s.note}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
