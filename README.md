# NCHO Math Lane — the site

The permanent home for NCHO's math work. Hub plus five modules, plain HTML/CSS/JS, no build step.

**Live:** _(pending Netlify import — see below)_

## What's here

| Module | Page | What it holds |
|---|---|---|
| The Board | `site/standards/` | Every 6th and 7th grade Common Core math standard and its coverage. **The live scoreboard for the proof of concept.** |
| The Machine | `site/machine/` | How a worksheet gets made — the three jobs and the ten gates. |
| Samples | `site/samples/` | The worksheets themselves, plus the printable PDF. |
| What We Learned | `site/findings/` | Five research passes in plain words: surprises, legal landmines, the honest benchmark. |
| What's Next | `site/roadmap/` | Five steps in order, plus what reopens when we build apps. |

## Adding, growing, removing

The site is **registry-driven**. To add a module:

1. Create `site/<name>/index.html` (copy a sibling so the header, nav and relative paths match).
2. Add one entry to `site/data/modules.js`.
3. Add it to the `<nav>` on every page.

To remove one: delete the folder, the registry entry, and the nav links. Nothing else knows.

⚠️ **Data ships as `.js` script globals, never JSON alone.** `fetch()` is dead on `file://`, and
every page here has to work when you double-click it from disk, before Netlify is involved.

## Rebuilding the standards board

The board's data is **generated from the frozen official code table** in the Jumpdrive brain — it
is never hand-typed, because a wrong standard code on a product is exactly what the "honest or
absent" doctrine exists to prevent.

```bash
node tools/build-standards.mjs
```

Reads `../Jumpdrive/NCHO/standards/ccssm/ccssm-codes.json`, merges coverage from
`tools/coverage.json`, writes `site/data/standards.js` (and a `.json` twin for tooling).

**To mark a standard covered**, add it to `tools/coverage.json` and re-run:

```json
{
  "6.RP.A.1": { "status": "done", "note": "sheet 04, gated 2026-09-05" },
  "6.RP.A.2": { "status": "wip" }
}
```

`status` is `done`, `wip`, or `todo`. Anything absent is `todo`. Netlify never runs this — the
generated file is committed.

## Gates before pushing

```bash
node ~/.claude/skills/site-forge/scripts/check-site.mjs "<abs path>/ncho-math/site"   # 0 broken, 0 orphans
node --check site/assets/board.js
```

Then **look at it** in a browser. The gates catch broken links; they don't catch ugly.

## Deploy

Netlify, publish directory **`site`**, build command **EMPTY**. Once imported, **push is the
deploy** — no CLI, no manual upload.

## Source of truth

The math machine itself lives in the brain, not here:

```
Jumpdrive/NCHO/workbooks/math-lab/     the renderer, gates, and sample build
Jumpdrive/NCHO/standards/ccssm/        the 664-code table and its checker
```

This site is the **public face** of that work. When the machine changes, update the pages here to
match — they are hand-maintained prose, not generated from the code.

## Licence note that must stay on the site

Any page printing Common Core standard text carries this verbatim, and it is already in every
footer:

> © Copyright 2010. National Governors Association Center for Best Practices and Council of Chief
> State School Officers. All rights reserved.

Texas TEKS: print **codes only, never statement text** — a code is a legal citation, the text is
not, and selling from Alaska fits none of Texas's exemptions.
