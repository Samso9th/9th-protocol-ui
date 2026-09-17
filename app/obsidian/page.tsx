"use client";
import { Shell, Snippet } from "@/components/shell";
import { Icon } from "@/components/icon";
export default function ObsidianPage() {
  return (
    <Shell>
      {() => (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">The agent toolkit</span>
              <h1>Ideas worth remembering.</h1>
              <p className="sub">
                A little context goes a long way. Give your local agent a vault
                of project knowledge it can carry into the next session.
              </p>
            </div>
          </div>
          <div className="guide-layout">
            <div>
              <div
                className="memory-map"
                aria-label="Your project memory connects code, decisions, and notes"
              >
                <div className="memory-node main-node">
                  <Icon name="vault" size={24} />
                  <strong>Your project memory</strong>
                </div>
                <div className="memory-branches">
                  <span>
                    <Icon name="file" />
                    Code map
                  </span>
                  <span>
                    <Icon name="brain" />
                    Decisions
                  </span>
                  <span>
                    <Icon name="book" />
                    Daily notes
                  </span>
                </div>
              </div>
              <div className="memory-note">
                <Icon name="shield" size={20} />
                <div>
                  <h3>At home on your device.</h3>
                  <p>
                    Your vault is a folder of Markdown files. Choose how it
                    syncs. Excerpts used in prompts go to your selected model.
                  </p>
                </div>
              </div>
            </div>
            <div className="guide-steps">
              <section className="guide-step">
                <h2>Link a vault</h2>
                <p>
                  Start in your project. Choose “2. vault” to create the index,
                  daily notes, decisions, and knowledge graph folders.
                </p>
                <Snippet text={'9p init\n# Choose "2. vault"'} />
              </section>
              <section className="guide-step">
                <h2>Map your codebase</h2>
                <p>
                  Create linked notes for your main modules. Future sessions can
                  navigate the map and load the context they need.
                </p>
                <Snippet text="9p map" />
              </section>
              <section className="guide-step">
                <h2>See your knowledge grow</h2>
                <p>
                  Optionally open the folder in Obsidian for its graph view.
                  Your agent works with plain Markdown either way.
                </p>
                <a
                  className="pill-button"
                  href="https://obsidian.md"
                  target="_blank"
                  rel="noreferrer"
                >
                  Explore Obsidian <Icon name="external" size={14} />
                </a>
              </section>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
