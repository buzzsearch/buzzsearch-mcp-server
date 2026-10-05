#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js"

/**
 * Stdio bridge to the hosted BuzzSearch MCP server. Lists tools from the
 * bundled tools.json (so it starts without a key) and forwards every call.
 */

const DEFAULT_URL = "https://buzzsearch.ai/api/mcp"
const KEY_HELP =
  "Set BUZZSEARCH_API_KEY to a key from https://buzzsearch.ai/app (Settings, API). " +
  "Or connect your client to https://buzzsearch.ai/api/mcp directly and sign in."

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string }
const manifest = JSON.parse(readFileSync(new URL("../tools.json", import.meta.url), "utf8")) as {
  tools: unknown[]
  prompts: unknown[]
}

const apiKey = process.env.BUZZSEARCH_API_KEY?.trim()
const url = new URL(process.env.BUZZSEARCH_MCP_URL?.trim() || DEFAULT_URL)

let upstream: Promise<Client> | null = null

function connect(): Promise<Client> {
  upstream ??= (async () => {
    const client = new Client({ name: "buzzsearch-mcp", version: pkg.version })
    await client.connect(
      new StreamableHTTPClientTransport(url, {
        requestInit: { headers: { Authorization: `Bearer ${apiKey}` } },
      })
    )
    return client
  })().catch((err) => {
    upstream = null
    throw err
  })
  return upstream
}

const fail = (text: string): CallToolResult => ({ isError: true, content: [{ type: "text", text }] })

const server = new Server(
  { name: "buzzsearch", version: pkg.version },
  { capabilities: { tools: {}, prompts: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: manifest.tools }) as never)
server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: manifest.prompts }) as never)

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (!apiKey) return fail(KEY_HELP)
  try {
    const client = await connect()
    return (await client.callTool(req.params, undefined, { timeout: 120_000 })) as CallToolResult
  } catch (err) {
    return fail(`BuzzSearch request failed: ${err instanceof Error ? err.message : String(err)}`)
  }
})

server.setRequestHandler(GetPromptRequestSchema, async (req) => {
  if (!apiKey) throw new Error(KEY_HELP)
  const client = await connect()
  return client.getPrompt(req.params)
})

await server.connect(new StdioServerTransport())
