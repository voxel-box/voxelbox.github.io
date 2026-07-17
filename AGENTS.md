# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
This repository (`voxelbox.github.io`) is a **pure static website** — hand-authored HTML/CSS/JS at the repo root. There is **no package manager, build step, bundler, test suite, or linter**. The only vendored dependency is `vendor/three.module.js` (Three.js), committed directly. Deployment is just serving the repo contents as static files (GitHub Pages).

### Running it (development)
Serve the repo root over HTTP with any static file server, e.g.:

```bash
python3 -m http.server 8000   # from the repo root, then open http://localhost:8000/index.html
```

There is no dependency install / build / lint / test command — none exist and none are needed.

### Non-obvious gotchas
- **Extensionless nav links 404 locally.** The navigation uses clean URLs like `/servers`, `/about`, `/contact` (no `.html`). Production hosts (GitHub Pages / Cloudflare) rewrite these to the `.html` file, but `python3 -m http.server` does **not**. When testing locally, navigate directly to the file, e.g. `http://localhost:8000/servers.html`. This is expected, not a site bug.
- **Dynamic data comes from external, out-of-repo services** on `*.voxelbox.org` subdomains (live server status, news/`voxelbot` feed, portfolio JSON, web-push, and the contact/apply form `/api/*` endpoints). These are **not** part of this repo and will fail or be CORS-blocked when running locally. The site degrades gracefully (shows "loading…"/fallbacks) — this is expected and not a defect.
- **Theme picker** persists the chosen theme in `localStorage` (`vb_theme`), so a selected theme survives page reloads and carries across pages.
