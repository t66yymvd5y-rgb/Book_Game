# Corner Books — working notes for Claude

## Keep the artifact in step with the game

The game is also published as a claude.ai artifact:
https://claude.ai/artifact/3C21NnF9iJjPnmyB8rXC6p ("Corner Books").

Whenever you change the game (`index.html` or anything it loads), republish that
artifact automatically after the change is made — do not wait to be asked.

- Publish `index.html` with the Artifact tool, passing the URL above as `url`.
- Leave `capabilities` out so the page keeps what it has, and leave out `files`
  unless a supporting file (e.g. something under `audio/`) changed — files left
  out are kept.
- If the publish is refused because the live version differs, compare the diff
  it returns against your change. Merge in anything on the live page that is not
  yours; if the only differences are your own edits, publish again unchanged.
- Tell the user the artifact was updated, with the link.

## Developer copy (dev artifact)

A developer copy with a test panel (jump to day X, set bank balance / reputation, free floor
expansion, replay George, reset magazines and stamps, spawn customers, skip to close, 1×/2×/4×
speed) is published as a separate artifact with its own save:
https://claude.ai/artifact/7jY4JNXd6htPKa264WhgjK ("Corner Books Dev").

- The panel lives in `dev/devtools.js`. `bash dev/build.sh` builds `dev.html` (git-ignored) from
  `index.html` + the panel, with its own title and save key and a speed hook in the game loop.
  `index.html` itself never loads the panel. Until the branch `claude/youthful-euler-ann7ym` is
  merged, the `dev/` folder is only on that branch: take `dev/build.sh` and `dev/devtools.js` from
  it (`git show origin/claude/youthful-euler-ann7ym:dev/build.sh`) and run the build against this
  branch's `index.html`.
- Whenever you republish the main artifact, also rebuild and republish the dev copy: run
  `bash dev/build.sh`, then publish `dev.html` with the Artifact tool, passing the URL above as `url`.
  If `build.sh` stops with "expected exactly one …", a line it patches in `index.html` changed —
  update the swap list in `dev/build.sh`.
- Leave `files` and `capabilities` out unless the audio changed (the four tracks are already on the
  dev artifact). The dev copy deliberately has no account sync: its save stays in the browser.
