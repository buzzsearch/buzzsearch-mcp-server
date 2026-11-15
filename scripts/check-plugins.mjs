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

const openai = portable.extensions?.["com.openai"]
assert.ok(openai, "Portable manifest must include OpenAI submission metadata")
assert.deepEqual(openai.interface, codex.interface, "Portable and Codex listing metadata must match")
assert.deepEqual(openai.review, codex.extensions?.["com.openai"]?.review)
assert.deepEqual(openai.publication, codex.extensions?.["com.openai"]?.publication)
const listing = openai.interface
for (const [field, max] of [
  ["displayName", 30], ["shortDescription", 30],
  ["longDescription", 4000], ["developerName", 80],
]) {
  assert.equal(typeof listing[field], "string", `${field}: required text`)
  assert.ok(listing[field].trim() && listing[field].length <= max, `${field}: must be 1-${max} characters`)
}
const categories = new Set([
  "Productivity", "Creativity", "Developer Tools", "Business & Operations",
  "Data & Analytics", "Communication", "Education & Research", "Security",
  "Finance", "Healthcare", "Travel", "Entertainment", "Other",
])
assert.ok(categories.has(listing.category), "Use a supported OpenAI directory category")
assert.ok(Array.isArray(listing.capabilities) && listing.capabilities.length <= 20)
for (const capability of listing.capabilities) {
  assert.ok(typeof capability === "string" && capability.trim() && capability.length <= 120)
}
for (const field of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) {
  assert.ok(typeof listing[field] === "string" && listing[field].length <= 1024, `${field}: required URL`)
  const url = new URL(listing[field])
  assert.ok(url.protocol === "https:" && !url.username && !url.password, `${field}: public HTTPS URL required`)
}
assert.ok(listing.defaultPrompt.length <= 3)
for (const prompt of listing.defaultPrompt) assert.ok(prompt.trim() && prompt.length <= 128)
for (const field of ["logo", "composerIcon"]) {
  assert.equal(listing[field], "./assets/buzzsearch-icon.png")
  const icon = readFileSync(new URL(listing[field], root))
  assert.ok(icon.length <= 5 * 1024 * 1024, `${field}: at most 5 MiB`)
  assert.equal(icon.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${field}: PNG required`)
  const width = icon.readUInt32BE(16)
  const height = icon.readUInt32BE(20)
  assert.ok(width === height && width >= 48 && width <= 4096, `${field}: square 48-4096px icon required`)
}
const tools = new Set(read("tools.json").tools.map((tool) => tool.name))
for (const [kind, count] of [["positive", 5], ["negative", 3]]) {
  const cases = openai.review.test_cases[kind]
  assert.equal(cases.length, count, `${kind}: exactly ${count} review cases`)
  for (const test of cases) {
    for (const field of ["description", "prompt", "expected_behavior"]) {
      assert.ok(typeof test[field] === "string" && test[field].trim(), `${kind}: ${field} is required`)
    }
    if (kind === "positive") {
      assert.ok(test.tools_triggered?.trim(), "Positive cases must name expected tools")
      for (const tool of test.tools_triggered.split(",").map((name) => name.trim())) {
        assert.ok(tools.has(tool), `Unknown review tool: ${tool}`)
      }
    }
  }
}
assert.ok(openai.publication.release_notes?.trim(), "Release notes are required")
if (openai.review.demo_recording_url !== undefined) {
  const video = new URL(openai.review.demo_recording_url)
  assert.ok(video.protocol === "https:" && !video.username && !video.password,
    "Review walkthrough must use a public HTTPS URL")
}

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
