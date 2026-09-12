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
    description: "Official reference server, scoped file access outside the project",
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
    description: "Drive a headless browser, screenshots, scraping, form fills",
    contextCost: "~2k tokens of tool schemas",
    config: { puppeteer: { command: "npx", args: ["-y", "@modelcontextprotocol/server-puppeteer"] } },
  },
  {
    name: "magic-21st",
    description: "21st.dev Magic, generate polished UI components in place",
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
  { name: "superpowers", repo: "https://github.com/obra/superpowers", description: "Plan → test → review discipline before code lands", note: "large, invoke per task, don't preload" },
  { name: "gstack", repo: "https://github.com/garrytan/gstack", description: "23 role skills (CEO review, EM, QA, release manager)", note: "pick individual roles, not the whole pack" },
  { name: "ui-ux-pro-max", repo: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill", description: "50+ UI styles, 97 palettes, 57 font pairings", note: "design tasks only" },
  { name: "impeccable", repo: "https://github.com/pbakaus/impeccable", description: "Layout, spacing, and typography cleanup passes", note: "small, safe to keep handy" },
  { name: "emil-motion", repo: "https://github.com/emilkowalski/skills", description: "Motion & easing so UI feels alive", note: "frontend polish" },
  { name: "taste", repo: "https://github.com/leonxlnx/taste-skill", description: "Pulls real design references to escape generic AI look", note: "design tasks" },
  { name: "stop-slop", repo: "https://github.com/hardikpandya/stop-slop", description: "Strips AI writing tells from copy", note: "writing tasks" },
  { name: "marketing-skills", repo: "https://github.com/coreyhaines31/marketingskills", description: "23 marketing agents, SEO, copy, email sequences", note: "pick what you need" },
  { name: "karpathy-behaviors", repo: "https://github.com/multica-ai/andrej-karpathy-skills", description: "Anti-overengineering behavior rules", note: "small, general-purpose" },
  { name: "context-engineering", repo: "https://github.com/muratcankoylan/agent-skills-for-context-engineering", description: "Token-diet techniques for long sessions", note: "meta. Read once" },
  { name: "remotion", repo: "https://www.remotion.dev/docs/ai/skills", description: "Programmatic video/motion design from prompts", note: "video tasks" },
  { name: "security-review", repo: "https://github.com/anthropics/claude-code-security-review", description: "Vulnerability scan patterns before shipping", note: "adapt prompts for 9p" },
];

/** Skills that ship with 9p itself: copy the markdown into .9p/skills/ or ~/.9p/skills/, invoke with /name. */
export interface BuiltinSkill {
  name: string;
  description: string;
  /** Full skill markdown, ready to paste into a skills directory verbatim. */
  content: string;
}

export const BUILTIN_SKILLS: BuiltinSkill[] = [
  {
    name: "cloudflare-pages",
    description:
      "Deploy or fix a Next.js app on Cloudflare (Workers Builds + OpenNext) — the playbook behind the 9th Protocol UI deploy",
    content: `---
name: cloudflare-pages
description: Set up or fix a Next.js deployment on Cloudflare (Workers Builds + OpenNext) - use when deploys fail or when wiring up CI from scratch
---

# Cloudflare deployment (Workers Builds + OpenNext)

Target pipeline: Cloudflare Workers Builds runs npm run build:cloudflare, then
npx wrangler deploy (wrangler detects the OpenNext project and calls
opennextjs-cloudflare deploy itself, which validates bindings against the API).

1. devDependencies: pin wrangler and @opennextjs/cloudflare in package.json. Never rely
   on npx fetching them during CI - a non-interactive deploy cannot answer prompts.
2. Commit wrangler.jsonc in the app root. The worker "name" must equal the Cloudflare
   project name, and the WORKER_SELF_REFERENCE service binding must reference that exact
   same name (Cloudflare error 10143 = mismatch, typically package.json name vs project name):

   {
     "$schema": "node_modules/wrangler/config-schema.json",
     "main": ".open-next/worker.js",
     "name": "<project-name>",
     "compatibility_date": "<today>",
     "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
     "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
     "services": [
       { "binding": "WORKER_SELF_REFERENCE", "service": "<project-name>" }
     ],
     "images": { "binding": "IMAGES" },
     "observability": { "enabled": true }
   }

3. Commit open-next.config.ts:

   import { defineCloudflareConfig } from "@opennextjs/cloudflare";
   export default defineCloudflareConfig();

4. package.json scripts:
   - "build": "next build" - opennextjs-cloudflare build invokes this script internally.
     NEVER set build to opennextjs-cloudflare build itself; it recurses until killed.
   - "build:cloudflare": "opennextjs-cloudflare build"
   - "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
5. .gitignore: add .open-next/ and .wrangler/.
6. public/_headers: immutable caching for /_next/static/*:

   /_next/static/*
     Cache-Control: public,max-age=31536000,immutable

7. Cloudflare dashboard -> Worker -> Settings -> Build: build command
   npm run build:cloudflare, deploy command npx wrangler deploy. The build command is a
   dashboard setting only - it cannot be declared in wrangler.jsonc.
8. Validate locally, exactly as CI runs it, before pushing:

   npm run build:cloudflare        # must end with: OpenNext build complete
   npx wrangler deploy --dry-run   # must list WORKER_SELF_REFERENCE / IMAGES / ASSETS

Failure signatures:
- error 10143 "Service binding 'WORKER_SELF_REFERENCE' references Worker '...' which was
  not found" -> no committed wrangler.jsonc (CI generated one with a mismatched name) or
  the service name differs from the worker name.
- "Could not find compiled Open Next config, did you run the build command?" -> the CI
  build command ran plain next build; it must run npm run build:cloudflare so .open-next/
  exists.
- Build loops printing "OpenNext - Cloudflare build" -> the build script recurses; keep
  "build" as plain next build.

Docker/standalone deploys are unaffected: keep "build": "next build" and .next/standalone
output; only the Cloudflare path uses build:cloudflare.`,
  },
];
