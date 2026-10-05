# One repo, multiple clients

`buzzsearch/buzzsearch-mcp-server` is the distribution repo for the hosted
BuzzSearch MCP server at `https://buzzsearch.ai/api/mcp`.

The plugin exposes the existing MCP tools directly. `search` is the main entry
point for research, customer language, pain points, and ad hooks. The server also
offers reads and follow-up tools. The plugin bundles no skills or workflow
wrappers. The existing server prompts remain available through MCP.

## Layout and ownership

| Files | Purpose |
|---|---|
| `src/`, `tools.json`, `package.json` | npm stdio bridge and offline tool/prompt listing |
| `server.json`, `smithery.yaml`, `Dockerfile` | MCP registry and client distribution |
| `plugin.json`, `mcp.json` | Portable Agent Plugins package at the repo root |
| `.codex-plugin/plugin.json` | Codex compatibility manifest and presentation metadata |
| `.claude-plugin/plugin.json` | Claude Code plugin manifest |
| `.mcp.json` | Shared Codex compatibility and Claude Code HTTP connection |
| `.agents/plugins/marketplace.json` | OpenAI repo marketplace pointing at `./` |
| `.claude-plugin/marketplace.json` | Claude Code marketplace pointing at `./` |

New OpenAI packages use the portable root manifest; the Codex manifest supports
the compatibility format. The portable root intentionally omits
`extensions.com.openai`, so the Codex overlay supplies OpenAI-specific metadata.
Portable MCP uses `type: streamable-http`; the compatibility config uses
`type: http`. Both connect to the same server. See
[OpenAI packaging documentation](https://developers.openai.com/plugins/build/plugins)
and [Claude's manifest reference](https://code.claude.com/docs/en/plugins-reference).

Both marketplaces resolve plugin paths from the repository root. There is one
plugin named `buzzsearch`, with no nested copy of the repo. The plugin is
distributed through Git; the npm `files` allowlist continues to ship only the
stdio bridge and tool snapshot, along with npm's standard metadata files.

Server business logic, billing, OAuth, annotations, and any future Apps SDK
widgets stay in the service monorepo beside
`bonemeal-web/lib/mcp/buzzsearch/register.ts`. A ChatGPT connection uses the same
remote endpoint. A separate ChatGPT source repo is unnecessary. Registering and
submitting a public OpenAI listing is a separate step from creating this repo's
local marketplace; see
[OpenAI's publishing guidance](https://developers.openai.com/plugins/build/plugins#publish-official-public-plugins).
Add a registered server mapping only after OpenAI supplies a real connection id.

## Authentication and development

The plugin uses the client's OAuth connection to BuzzSearch. No key or token is
bundled. Headless clients can use the npm bridge with `BUZZSEARCH_API_KEY` as
documented in the README. Use either the plugin or a manually added server in a
client to avoid duplicate connections.

Validate the repository before distributing it:

```bash
npm run check:plugins
npm run typecheck
npm run build
claude plugin validate .claude-plugin/plugin.json
claude plugin validate .claude-plugin/marketplace.json
```

For local Claude Code testing, run `claude --plugin-dir .` and inspect `/mcp`.
For Codex, run `codex plugin marketplace add .`, then
`codex plugin add buzzsearch@buzzsearch-plugins`, or install BuzzSearch from the
`buzzsearch-plugins` source in the plugin browser. These
actions change client configuration and are left to the developer testing the
plugin. Verify OAuth and a real search with a test account before submission;
offline checks do not establish authentication or live tool behavior.

The npm version and all three plugin manifest versions share one release number.
When releasing, update them together and update `server.json` according to the
MCP Registry release process. `npm run check:plugins` checks plugin identity,
versions, marketplace roots, and endpoint agreement in CI and before npm publish.
Refresh `tools.json` from the hosted server with `npm run sync` after server
changes deploy. Plugin clients discover tools from the remote server directly,
so they do not use that npm snapshot.
