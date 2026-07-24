/** Curated galleries (from docs/PLAN.md §10). Context-cost notes keep the anti-bloat promise. */

export interface McpEntry {
  name: string;
  description: string;
  contextCost: string;
  config: Record<string, { command: string; args: string[] }>;
}

export const MCP_GALLERY: McpEntry[] = [
  {
    name: "filesystem",
    description: "Official reference server — scoped file access outside the project",
    contextCost: "~1.5k tokens of tool schemas",
    config: { filesystem: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "~/allowed-dir"] } },
  },
  {
    name: "github",
    description: "GitHub issues/PRs/repos via MCP (alternative to the token connector)",
    contextCost: "~4k tokens of tool schemas",
    config: { github: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] } },
  },
  {
    name: "postgres",
    description: "Query Postgres schemas and run read-only SQL",
    contextCost: "~1k tokens of tool schemas",
    config: { postgres: { command: "npx", args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/db"] } },
  },
  {
    name: "puppeteer",
    description: "Drive a headless browser — screenshots, scraping, form fills",
    contextCost: "~2k tokens of tool schemas",
    config: { puppeteer: { command: "npx", args: ["-y", "@modelcontextprotocol/server-puppeteer"] } },
  },
  {
    name: "magic-21st",
    description: "21st.dev Magic — generate polished UI components in place",
    contextCost: "~2k tokens of tool schemas",
    config: { magic: { command: "npx", args: ["-y", "@21st-dev/magic"] } },
  },
];

export interface SkillEntry {
  name: string;
  repo: string;
  description: string;
  note: string;
}

export const SKILLS_GALLERY: SkillEntry[] = [
  { name: "superpowers", repo: "https://github.com/obra/superpowers", description: "Plan → test → review discipline before code lands", note: "large — invoke per task, don't preload" },
  { name: "gstack", repo: "https://github.com/garrytan/gstack", description: "23 role skills (CEO review, EM, QA, release manager)", note: "pick individual roles, not the whole pack" },
  { name: "ui-ux-pro-max", repo: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill", description: "50+ UI styles, 97 palettes, 57 font pairings", note: "design tasks only" },
  { name: "impeccable", repo: "https://github.com/pbakaus/impeccable", description: "Layout, spacing, and typography cleanup passes", note: "small, safe to keep handy" },
  { name: "emil-motion", repo: "https://github.com/emilkowalski/skills", description: "Motion & easing so UI feels alive", note: "frontend polish" },
  { name: "taste", repo: "https://github.com/leonxlnx/taste-skill", description: "Pulls real design references to escape generic AI look", note: "design tasks" },
  { name: "stop-slop", repo: "https://github.com/hardikpandya/stop-slop", description: "Strips AI writing tells from copy", note: "writing tasks" },
  { name: "marketing-skills", repo: "https://github.com/coreyhaines31/marketingskills", description: "23 marketing agents — SEO, copy, email sequences", note: "pick what you need" },
  { name: "karpathy-behaviors", repo: "https://github.com/multica-ai/andrej-karpathy-skills", description: "Anti-overengineering behavior rules", note: "small, general-purpose" },
  { name: "context-engineering", repo: "https://github.com/muratcankoylan/agent-skills-for-context-engineering", description: "Token-diet techniques for long sessions", note: "meta — read once" },
  { name: "remotion", repo: "https://www.remotion.dev/docs/ai/skills", description: "Programmatic video/motion design from prompts", note: "video tasks" },
  { name: "security-review", repo: "https://github.com/anthropics/claude-code-security-review", description: "Vulnerability scan patterns before shipping", note: "adapt prompts for 9p" },
];
