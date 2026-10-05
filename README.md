# BuzzSearch MCP Server

Give your AI agent your customers' exact words. BuzzSearch reads comments on Reddit, TikTok, YouTube, and Facebook and hands your agent verbatim quotes, pain points, objections, and ad hooks, each one linked to where it was written.

[![npm](https://img.shields.io/npm/v/buzzsearch-mcp)](https://www.npmjs.com/package/buzzsearch-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-ai.buzzsearch%2Fmcp-blue)](https://registry.modelcontextprotocol.io/v0/servers?search=ai.buzzsearch)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Server URL:** `https://buzzsearch.ai/api/mcp`

[Website](https://buzzsearch.ai/mcp) | [Pricing](https://buzzsearch.ai/pricing) | [Get started free](https://buzzsearch.ai/app)

## What it does

- **Find customer pain points.** Pull the complaints buyers repeat across threads and videos, each one quoted and linked.
- **Write ad hooks in their words.** Turn real comments into hooks and scripts that sound like your buyer, not a template.
- **Research an audience.** Learn who buys, what they tried before, and the words they use, before you write a line of copy.

Ask your agent something like *"What do people hate about robot vacuums? Give me five hooks in their words"* and it searches the comments, reads the quotes, and writes the copy without leaving the chat.

## Quick start

The hosted server is the recommended install. You sign in with your BuzzSearch account the first time you connect, so there is no key to copy.

### Plugin for Claude Code and Codex

The plugin connects to the same hosted server and exposes its tools directly.
Use `search` for customer research, pain points, quotes, and ad hooks. No skills
are bundled.

Once these plugin files are published to GitHub, install in Claude Code:

```bash
claude plugin marketplace add buzzsearch/buzzsearch-mcp-server
claude plugin install buzzsearch@buzzsearch-plugins
```

For Codex, add the repo marketplace:

```bash
codex plugin marketplace add buzzsearch/buzzsearch-mcp-server
codex plugin add buzzsearch@buzzsearch-plugins
```

You can also install BuzzSearch from the `buzzsearch-plugins` source in the plugin browser.
Sign in to BuzzSearch through the client's MCP connection flow. If you already
added the server manually, keep one connection to avoid duplicate tools.

For local testing and the shared repo layout, see
[distribution notes](docs/distribution.md). You can also connect the server
directly using the commands below.

### Claude Code

```bash
claude mcp add --transport http buzzsearch https://buzzsearch.ai/api/mcp
```

### Codex

```bash
codex mcp add buzzsearch --url https://buzzsearch.ai/api/mcp
```

### Claude.ai and Claude Desktop

Settings, Connectors, Add custom connector, then paste `https://buzzsearch.ai/api/mcp`.

### ChatGPT

Add a custom connector in settings, then paste `https://buzzsearch.ai/api/mcp`.

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "buzzsearch": { "url": "https://buzzsearch.ai/api/mcp" }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "buzzsearch": { "type": "http", "url": "https://buzzsearch.ai/api/mcp" }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "buzzsearch": { "serverUrl": "https://buzzsearch.ai/api/mcp" }
  }
}
```

### Grok Build

```bash
grok mcp add --transport http buzzsearch https://buzzsearch.ai/api/mcp
```

## Use an API key

For headless agents, CI, or clients that only run local (stdio) servers, create a key in the BuzzSearch app under Settings, API.

**Send it as a header** to the hosted server:

```bash
claude mcp add --transport http buzzsearch https://buzzsearch.ai/api/mcp \
  --header "Authorization: Bearer bz_live_..."
```

**Or run the local package**, which forwards to the hosted server:

```json
{
  "mcpServers": {
    "buzzsearch": {
      "command": "npx",
      "args": ["-y", "buzzsearch-mcp"],
      "env": { "BUZZSEARCH_API_KEY": "bz_live_..." }
    }
  }
}
```

| Variable | Required | Description |
|---|---|---|
| `BUZZSEARCH_API_KEY` | yes | Your BuzzSearch API key |
| `BUZZSEARCH_MCP_URL` | no | Override the server URL. Default `https://buzzsearch.ai/api/mcp` |

## Tools

| Tool | Cost | What it returns |
|---|---|---|
| `search` | credits | Searches the web for UGC on Reddit, TikTok, YouTube, and Facebook, reads the comments, and returns a cited answer with the top quotes. Paste a post or video link to read its comments. |
| `get_search` | free | Reads back a finished search, or resumes one still running. |
| `get_quotes` | free | Pages through every quote, filtered by pain point, failed solution, objection, desired outcome, lingo, source, or phrase. |
| `get_sources` | free | Lists the threads and videos read, with engagement and quote counts. |
| `get_comments` | free | Hands back the raw comment bodies, grouped by thread or video. |
| `ask` | answer only | Asks a follow-up over research you already ran, without searching again. |
| `generate_hooks` | answer only | Writes ad hooks from the quotes, in your customers' own words. |
| `list_searches` | free | Finds research you ran before, in the app or through the API. |
| `get_balance` | free | Checks your credit balance. |

## Prompts

| Prompt | Arguments | What it does |
|---|---|---|
| `research` | `topic`, `depth` | Runs a search and reports the strongest pains, desired outcomes, objections, and vocabulary, each backed by quotes. |
| `ad-script` | `search_id`, `format` | Turns a finished search into three ad scripts that open with a real customer callout. |

## Example prompts

- "Research what new moms complain about with baby carriers. Quote them."
- "Search Reddit and TikTok for why people quit meal kit subscriptions, then write eight hooks for a TikTok UGC ad."
- "Read the comments on this video and tell me the top objections: https://www.tiktok.com/@creator/video/123"
- "List my past searches about skincare and pull the customer lingo from the latest one."

More in [`examples/`](examples).

## Pricing

A search uses credits from your BuzzSearch balance, and the exact charge comes back with the result. Reading a finished search, its quotes, sources, and comments is free, so your agent can come back to the same research as often as it needs. See [pricing](https://buzzsearch.ai/pricing).

## FAQ

**Which clients does it work with?** Any client that supports remote MCP servers over HTTP, including Claude Code, Claude.ai, Claude Desktop, ChatGPT, Cursor, Codex, VS Code, Windsurf, and Grok Build. Stdio-only clients can use the `buzzsearch-mcp` package.

**Do I need an API key?** No, most clients open a BuzzSearch sign-in the first time you connect. Keys are for headless agents and the local package.

**Can I use research from the BuzzSearch app?** Yes. `list_searches` shows research you ran in the app too, and your agent can read its quotes and comments without paying for the search twice.

## Development

```bash
npm install
npm run check:plugins
npm run build
BUZZSEARCH_API_KEY=bz_live_... npm run inspect   # MCP Inspector against the local build
BUZZSEARCH_API_KEY=bz_live_... npm run sync      # refresh tools.json from the live server
```

`tools.json` is a snapshot of the hosted server's tools and prompts, so the package can list them before a key is set. Calls always go to the hosted server.

## License

MIT
