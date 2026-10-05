/** Check distribution metadata offline, without connecting or spending credits. */
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"

const root = new URL("../", import.meta.url)
const read = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"))
const pkg = read("package.json")
const registry = read("server.json")
const portable = read("plugin.json")
const codex = read(".codex-plugin/plugin.json")
const claude = read(".claude-plugin/plugin.json")

assert.equal(portable.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json")
for (const [path, manifest] of [
  ["plugin.json", portable],
  [".codex-plugin/plugin.json", codex],
  [".claude-plugin/plugin.json", claude],
]) {
  assert.equal(manifest.name, "buzzsearch", `${path}: plugin name`)
  assert.equal(manifest.version, pkg.version, `${path}: version must match package.json`)
  for (const key of ["description", "author", "homepage", "repository", "license"]) {
    assert.deepEqual(manifest[key], portable[key], `${path}: ${key} must match plugin.json`)
  }
  assert.equal(manifest.skills, undefined, `${path}: MCP-only plugin must not declare skills`)
}
assert.ok(!existsSync(new URL("skills/", root)), "MCP-only plugin must not bundle skills")
assert.equal(codex.mcpServers, "./.mcp.json")

const compat = read(".mcp.json")
const mcp = read("mcp.json")
assert.equal(mcp.$schema, "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json")
assert.deepEqual(Object.keys(compat.mcpServers), ["buzzsearch"])
assert.deepEqual(Object.keys(mcp.mcpServers), ["buzzsearch"])
assert.equal(compat.mcpServers.buzzsearch.type, "http")
assert.equal(mcp.mcpServers.buzzsearch.type, "streamable-http")
const endpoint = registry.remotes.find((remote) => remote.type === "streamable-http")?.url
assert.equal(endpoint, "https://buzzsearch.ai/api/mcp")
for (const config of [compat, mcp]) {
  assert.deepEqual(config.mcpServers.buzzsearch, {
    type: config === compat ? "http" : "streamable-http",
    url: endpoint,
  }, "Plugin MCP configuration must point to the hosted server without bundled credentials")
}

const openaiMarket = read(".agents/plugins/marketplace.json")
const claudeMarket = read(".claude-plugin/marketplace.json")
for (const market of [openaiMarket, claudeMarket]) {
  assert.equal(market.name, "buzzsearch-plugins")
  assert.equal(market.plugins.length, 1)
  assert.equal(market.plugins[0].name, portable.name)
}
assert.deepEqual(openaiMarket.plugins[0].source, { source: "local", path: "./" })
assert.deepEqual(openaiMarket.plugins[0].policy, {
  installation: "AVAILABLE", authentication: "ON_INSTALL",
})
assert.equal(openaiMarket.plugins[0].category, "Productivity")
assert.equal(claudeMarket.plugins[0].source, "./")
assert.equal(claudeMarket.owner.name, portable.author.name)

console.log(`BuzzSearch plugin metadata matches v${pkg.version} and ${endpoint}`)
