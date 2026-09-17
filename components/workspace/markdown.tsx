import { createElement, type ReactNode } from "react";
function inline(text: string): ReactNode[] {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    .map((part, index) =>
      part.startsWith("`") && part.endsWith("`") ? (
        <code key={index}>{part.slice(1, -1)}</code>
      ) : part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}
function blocks(text: string, prefix: number): ReactNode[] {
  const lines = text.split("\n");
  const result: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index++;
      continue;
    }
    const heading = line.match(/^(#{1,3}) (.+)$/);
    if (heading) {
      result.push(
        createElement(
          `h${Math.min(heading[1].length + 1, 4)}`,
          { key: `${prefix}-${index}` },
          inline(heading[2]),
        ),
      );
      index++;
      continue;
    }
    const ordered = /^\d+\. /.test(line),
      list = /^[-*] /.test(line);
    if (ordered || list) {
      const entries: ReactNode[] = [];
      const start = index;
      while (
        index < lines.length &&
        (ordered ? /^\d+\. /.test(lines[index]) : /^[-*] /.test(lines[index]))
      ) {
        entries.push(
          <li key={index}>
            {inline(lines[index].replace(ordered ? /^\d+\. / : /^[-*] /, ""))}
          </li>,
        );
        index++;
      }
      result.push(
        createElement(
          ordered ? "ol" : "ul",
          { key: `${prefix}-${start}` },
          entries,
        ),
      );
      continue;
    }
    const paragraph: string[] = [];
    const start = index;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3} |[-*] |\d+\. )/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index++;
    }
    result.push(
      <p key={`${prefix}-${start}`}>{inline(paragraph.join("\n"))}</p>,
    );
  }
  return result;
}
// Model output is rendered as React text. It never becomes raw HTML.
export function Markdown({ text }: { text: string }) {
  return (
    <div className="markdown">
      {text.split(/```/g).map((part, index) => {
        if (index % 2) {
          const newline = part.indexOf("\n");
          return (
            <pre key={index}>
              <code>{newline < 0 ? part : part.slice(newline + 1)}</code>
            </pre>
          );
        }
        return blocks(part, index);
      })}
    </div>
  );
}
