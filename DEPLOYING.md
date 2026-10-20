# Deploying

## Hosting

This site is hosted on **GitHub Pages**, served directly from this repository
(`mohsinsapra/cambridge`).

Confirmed via `gh api repos/mohsinsapra/cambridge/pages`:

- **Source:** `master` branch, root path (`/`)
- **Build type:** legacy (GitHub's built-in Pages build, no custom Actions workflow)
- **Status:** built / public

There is no `.github/workflows` directory, no `vercel.json`, `netlify.toml`,
or `package.json` in this repo — GitHub Pages is the only deploy mechanism
in play here.

Note: the Pages API reports the live URL as `http://mohsin.se/cambridge/`,
which suggests a custom domain/redirect is configured at the GitHub account
or DNS level rather than in this repo (no `CNAME` file is present here). If
you need the exact production URL, verify in the repo's Settings → Pages
page on GitHub, since it isn't fully derivable from this repo's contents
alone.

## What pushing to `master` triggers

Because this uses GitHub's legacy Pages build (not a custom Actions
workflow), pushing to `master` causes GitHub to automatically rebuild and
redeploy the Pages site — no CI configuration in this repo is involved.
There's usually a short delay (seconds to a couple of minutes) before the
change is live.

## Local preview

No build step or dependencies are required.

```
make preview
```

which just runs `open index.html`. Alternatively:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Publishing changes

```
make deploy
```

This stages all changes, commits them (only if there's something to commit),
and pushes to `origin`. If there's nothing new to commit, it still pushes
(a no-op if `master` is already up to date with `origin`).

## URL move (2026-10-20)

The repo was renamed from `cambridge-site` to `cambridge`, so the site is now
served at https://mohsin.se/cambridge/. Old `/cambridge-site/...` URLs get a 301
redirect to the same path under `/cambridge/` from the Cloudflare Worker
`cambridge-site-redirect` (source in `redirect-worker/`, route
`mohsin.se/cambridge-site*`).
