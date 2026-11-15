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
the compatibility format. The portable root declares OpenAI listing and review
metadata in `extensions.com.openai`. Codex compatibility metadata mirrors those
settings; the validator checks that they agree. OpenAI uses the portable
extension when it is present, without merging the Codex overlay.
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
Public submission packages declare the remote server URL directly. Do not bundle
registered app references or hooks, which the public ZIP submission does not
currently accept.

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

## OpenAI submission package

Run `npm run pack:plugin` to create a validated ZIP under the gitignored
`artifacts/` directory. It includes the portable and Codex manifests, MCP
configs, license, and the existing BuzzSearch 512px icon. It excludes client
marketplaces, npm source files, and credentials.

The subtitle is 29 characters. The listing uses `Business & Operations`, a
supported category chosen for its customer research and marketing workflows.
The description explains how marketing and product teams find customer quotes
and use them for campaign messaging, without pricing or promotional language.
There is no standalone Marketing category in the
[supported category list](https://developers.openai.com/plugins/deploy/submission-errors#listing-and-interface-errors).
The support URL is the public GitHub issue
tracker; privacy and terms use the public BuzzSearch pages. All four listing
URLs returned HTTP 200 without sign-in when checked on October 5, 2026.

Five positive and three negative review cases are included in the manifest as
proposed review scenarios. They have not yet been run with the OpenAI reviewer
account. Run them in order: the first creates research that the following cases
reuse. Verify the expected results with that account before submitting.

The provided [video walkthrough](https://www.youtube.com/watch?v=YAVDTDy27_8)
is included under `extensions.com.openai.review.demo_recording_url` in the
portable and Codex compatibility manifests. It is OpenAI review metadata and is
not added to the public listing or Claude manifest. Reviewers still need access
to the recording and credentials and sign-in instructions in the secure
dashboard form. Do not put account credentials in the source or ZIP.
See [OpenAI's review information requirements](https://developers.openai.com/plugins/deploy/submission#complete-review-information).

The balance review case asks the model to report only the balance and explain
that it is shared with the connected BuzzSearch account. This package-only
revision does not modify the MCP tool definition or its response; the remote
server controls those independently of the ZIP.

The category and URL fields still need to pass OpenAI's automated scans. The
local validator checks package fields and lengths; it does not prove reviewer
access, category acceptance, or approval.

**Tool update needs further review** is a held server update, separate from ZIP
metadata checks. Inspect each tool's **Held update** and **Live definition** in
**MCPs → Issues**. Correct concrete server findings and rescan, or use **Appeal**
with an explanation when the finding is incorrect. A ZIP change does not approve
held tools. See [OpenAI's tool issue workflow](https://developers.openai.com/plugins/deploy/submission#find-and-resolve-tool-issues).
