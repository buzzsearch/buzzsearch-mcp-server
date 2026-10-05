/**
 * Refreshes tools.json from the live server. `--check` exits 1 on drift.
 * Usage: BUZZSEARCH_API_KEY=bz_live_... node scripts/sync-tools.ts [--check]
 */
import { readFileSync, writeFileSync } from "node:fs"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

const key = process.env.BUZZSEARCH_API_KEY?.trim()
if (!key) {
  console.error("BUZZSEARCH_API_KEY is required")
  process.exit(1)
}
const url = new URL(process.env.BUZZSEARCH_MCP_URL?.trim() || "https://buzzsearch.ai/api/mcp")
const path = new URL("../tools.json", import.meta.url)

const client = new Client({ name: "buzzsearch-mcp-sync", version: "0.0.0" })
await client.connect(
  new StreamableHTTPClientTransport(url, { requestInit: { headers: { Authorization: `Bearer ${key}` } } })
)
const { tools } = await client.listTools()
const { prompts } = await client.listPrompts()
await client.close()

const next = JSON.stringify({ tools, prompts }, null, 2) + "\n"
const prev = readFileSync(path, "utf8")

if (process.argv.includes("--check")) {
  if (next !== prev) {
    console.error("tools.json is out of date. Run: node scripts/sync-tools.ts")
    process.exit(1)
  }
  console.log(`tools.json matches ${url} (${tools.length} tools, ${prompts.length} prompts)`)
} else {
  writeFileSync(path, next)
  console.log(`wrote ${tools.length} tools, ${prompts.length} prompts from ${url}`)
}
