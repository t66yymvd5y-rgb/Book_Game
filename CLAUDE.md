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
