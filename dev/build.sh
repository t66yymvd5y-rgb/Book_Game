#!/usr/bin/env bash
# Builds dev.html (repo root, next to audio/) — the developer copy of Corner Books — from index.html + dev/devtools.js.
# The dev copy has its own title and save key, a game-speed hook in the loop, and the dev panel.
# Run from anywhere: bash dev/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
import pathlib, sys
src = pathlib.Path("index.html").read_text()
dev = pathlib.Path("dev/devtools.js").read_text()
swaps = [
    ("<title>Corner Books</title>", "<title>Corner Books Dev</title>"),
    ('const SAVE_KEY="cornerbooks.save.v2"', 'const SAVE_KEY="cornerbooks.dev.save.v2"'),
    ('const FRESH_KEY="cornerbooks.fresh"', 'const FRESH_KEY="cornerbooks.dev.fresh"'),
    ("if(ts-last<66)", "if(ts-last<66/(window.DEV_SPEED||1))"),
]
for old, new in swaps:
    if src.count(old) != 1:
        sys.exit(f"build.sh: expected exactly one {old!r} in index.html — update dev/build.sh")
    src = src.replace(old, new)
i = src.rstrip().rfind("</script>")
if i < 0: sys.exit("build.sh: no closing </script> in index.html")
out = src[:i] + "</script>\n<script>\n" + dev + "\n</script>\n" + src[i+len("</script>"):].lstrip("\n")
pathlib.Path("dev.html").write_text(out)
print("wrote dev.html")
PY
