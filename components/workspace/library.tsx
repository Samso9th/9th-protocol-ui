"use client";
import { useState } from "react";
import { Icon, type IconName } from "../icon";
import { Snippet } from "../shell";
import { CountUp, StaggerGroup } from "./motion";
import { Dialog } from "./primitives";
export interface LibraryEntry {
  name: string;
  description: string;
  note: string;
  content?: string;
  href?: string;
  instructions?: string;
}
export function Library({
  title,
  description,
  icon,
  entries,
  guide,
}: {
  title: string;
  description: string;
  icon: IconName;
  entries: LibraryEntry[];
  guide?: { title: string; text: string; content: string };
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LibraryEntry | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const filtered = entries.filter((entry) =>
    `${entry.name} ${entry.description} ${entry.note}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">The agent toolkit</span>
          <h1>{title}</h1>
          <p className="sub">{description}</p>
        </div>
        {guide && (
          <button className="pill-button" onClick={() => setShowGuide(true)}>
            <Icon name="plus" size={15} />
            {guide.title}
          </button>
        )}
      </div>
      <div className="library-toolbar">
        <div className="search-field">
          <Icon name="search" size={17} />
          <input
            placeholder="Find your next tool…"
            aria-label="Search library"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="badge">
          <CountUp value={filtered.length} /> tools to explore
        </span>
      </div>
      <StaggerGroup
        className="library-grid"
        signature={query}
        distance={10}
        step={38}
      >
        {filtered.map((entry) => (
          <button
            className="library-tile"
            key={entry.name}
            onClick={() => setSelected(entry)}
          >
            <span className="tile-icon">
              <Icon name={icon} size={22} />
            </span>
            <h3>{entry.name}</h3>
            <p>{entry.description}</p>
            <span className="tile-bottom">
              <span>{entry.note}</span>
              <Icon name="arrow" size={17} />
            </span>
          </button>
        ))}
      </StaggerGroup>
      {!filtered.length && (
        <div className="empty-state">
          <Icon name="search" size={26} />
          <h3>Nothing here just yet.</h3>
          <p>Try a different search.</p>
        </div>
      )}
      {selected && (
        <Dialog title={selected.name} wide onClose={() => setSelected(null)}>
          <span className="badge">{selected.note}</span>
          <p className="dialog-intro" style={{ marginTop: 18 }}>
            {selected.description}
          </p>
          {selected.instructions && (
            <p className="dialog-intro">{selected.instructions}</p>
          )}
          {selected.content && <Snippet text={selected.content} />}
          {selected.href && (
            <a
              className="primary-button"
              href={selected.href}
              target="_blank"
              rel="noreferrer"
            >
              Explore collection <Icon name="external" size={15} />
            </a>
          )}
        </Dialog>
      )}
      {showGuide && guide && (
        <Dialog title={guide.title} wide onClose={() => setShowGuide(false)}>
          <p className="dialog-intro">{guide.text}</p>
          <Snippet text={guide.content} />
        </Dialog>
      )}
    </>
  );
}
