---
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
output; only the Cloudflare path uses build:cloudflare.