"""Package the MCP-only OpenAI plugin using an explicit public-file allowlist."""
import json
from pathlib import Path
from subprocess import run
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
run(["node", "scripts/check-plugins.mjs"], cwd=root, check=True)
version = json.loads((root / "plugin.json").read_text())["version"]
files = [
    "plugin.json",
    "mcp.json",
    ".codex-plugin/plugin.json",
    ".mcp.json",
    "LICENSE",
    "assets/buzzsearch-icon.png",
]
output = root / "artifacts" / f"buzzsearch-plugin-{version}.zip"
output.parent.mkdir(exist_ok=True)
with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, name)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert archive.namelist() == files
print(output)
